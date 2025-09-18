const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { MeiliSearch } = require('meilisearch');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Meilisearch
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

// Validation schemas
const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
  category: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  filters: Joi.object({
    priceMin: Joi.number().min(0).optional(),
    priceMax: Joi.number().min(0).optional(),
    dietary: Joi.array().items(Joi.string().valid('halal', 'vegan', 'vegetarian')).optional(),
    allergens: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const categorySchema = Joi.object({
  category: Joi.string().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('name', 'price_asc', 'price_desc', 'popularity').default('name')
});

// GET /api/products/search
router.get('/search', async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { q, category, page, limit, filters } = value;
    const offset = (page - 1) * limit;

    // Build Meilisearch query
    let searchQuery = {
      q,
      limit,
      offset,
      attributesToRetrieve: ['id', 'name', 'category', 'price', 'unitPrice', 'size', 'image', 'availability'],
      attributesToHighlight: ['name', 'description']
    };

    // Add filters
    if (category) {
      searchQuery.filter = `category = "${category}"`;
    }

    if (filters) {
      const filterArray = [];
      
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        const priceFilter = [];
        if (filters.priceMin !== undefined) {
          priceFilter.push(`price >= ${filters.priceMin}`);
        }
        if (filters.priceMax !== undefined) {
          priceFilter.push(`price <= ${filters.priceMax}`);
        }
        filterArray.push(`(${priceFilter.join(' AND ')})`);
      }

      if (filters.dietary && filters.dietary.length > 0) {
        const dietaryFilter = filters.dietary.map(diet => `dietary = "${diet}"`).join(' OR ');
        filterArray.push(`(${dietaryFilter})`);
      }

      if (filters.allergens && filters.allergens.length > 0) {
        const allergenFilter = filters.allergens.map(allergen => `allergens NOT CONTAINS "${allergen}"`).join(' AND ');
        filterArray.push(`(${allergenFilter})`);
      }

      if (filterArray.length > 0) {
        searchQuery.filter = filterArray.join(' AND ');
      }
    }

    // Search in Meilisearch
    const searchResults = await meilisearch.index('products').search(searchQuery);

    // Get full product details from database
    const productIds = searchResults.hits.map(hit => hit.id);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        availability: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        image: true,
        size: true,
        weight: true,
        unit: true,
        price: true,
        unitPrice: true,
        allergens: true,
        origin: true,
        stock: true
      }
    });

    // Maintain search result order
    const orderedProducts = productIds.map(id => 
      products.find(product => product.id === id)
    ).filter(Boolean);

    res.json({
      products: orderedProducts,
      pagination: {
        page,
        limit,
        total: searchResults.estimatedTotalHits,
        pages: Math.ceil(searchResults.estimatedTotalHits / limit)
      },
      facets: searchResults.facetDistribution
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).sort();
    
    res.json({ categories: categoryList });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const { error, value } = categorySchema.validate({
      ...req.params,
      ...req.query
    });
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { category, page, limit, sort } = value;
    const offset = (page - 1) * limit;

    // Build orderBy clause
    let orderBy = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popularity':
        // For now, order by name. In production, you'd track popularity
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          category,
          availability: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          image: true,
          size: true,
          weight: true,
          unit: true,
          price: true,
          unitPrice: true,
          allergens: true,
          origin: true,
          stock: true
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.product.count({
        where: {
          category,
          availability: true
        }
      })
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({ error: 'Failed to fetch category products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        image: true,
        size: true,
        weight: true,
        unit: true,
        price: true,
        unitPrice: true,
        allergens: true,
        origin: true,
        stock: true,
        availability: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/popular
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // For MVP, return random products. In production, track popularity
    const products = await prisma.product.findMany({
      where: { availability: true },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        image: true,
        size: true,
        weight: true,
        unit: true,
        price: true,
        unitPrice: true,
        allergens: true,
        origin: true,
        stock: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ error: 'Failed to fetch popular products' });
  }
});

module.exports = router;
