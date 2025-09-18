const { MeiliSearch } = require('meilisearch');

// Initialize Meilisearch client
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

/**
 * Initialize Meilisearch indexes and settings
 */
async function initializeSearchIndexes() {
  try {
    console.log('Initializing Meilisearch indexes...');

    // Create products index
    const productsIndex = meilisearch.index('products');
    
    // Configure products index settings
    await productsIndex.updateSettings({
      searchableAttributes: [
        'name',
        'description',
        'category',
        'allergens',
        'origin'
      ],
      filterableAttributes: [
        'category',
        'price',
        'availability',
        'allergens',
        'dietary'
      ],
      sortableAttributes: [
        'price',
        'name',
        'createdAt'
      ],
      displayedAttributes: [
        'id',
        'name',
        'description',
        'category',
        'image',
        'size',
        'weight',
        'unit',
        'price',
        'unitPrice',
        'allergens',
        'origin',
        'availability',
        'stock'
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ],
      stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      synonyms: {
        'fufu': ['cassava', 'yam'],
        'plantain': ['banana', 'cooking banana'],
        'egusi': ['melon seed'],
        'rice': ['riz'],
        'spice': ['spices', 'seasoning'],
        'meat': ['viande'],
        'fish': ['poisson'],
        'vegetable': ['légume'],
        'fruit': ['fruits']
      }
    });

    console.log('Meilisearch indexes initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Meilisearch indexes:', error);
    throw error;
  }
}

/**
 * Index a single product in Meilisearch
 * @param {Object} product - Product data
 */
async function indexProduct(product) {
  try {
    const productsIndex = meilisearch.index('products');
    
    // Transform product data for search
    const searchDocument = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      image: product.image || '',
      size: product.size || '',
      weight: product.weight || 0,
      unit: product.unit || '',
      price: product.price,
      unitPrice: product.unitPrice || 0,
      allergens: product.allergens || [],
      origin: product.origin || '',
      availability: product.availability,
      stock: product.stock || 0,
      dietary: extractDietaryInfo(product),
      createdAt: product.createdAt
    };

    await productsIndex.addDocuments([searchDocument]);
    console.log(`Indexed product: ${product.name}`);
  } catch (error) {
    console.error('Failed to index product:', error);
    throw error;
  }
}

/**
 * Index multiple products in Meilisearch
 * @param {Array} products - Array of product data
 */
async function indexProducts(products) {
  try {
    const productsIndex = meilisearch.index('products');
    
    const searchDocuments = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      image: product.image || '',
      size: product.size || '',
      weight: product.weight || 0,
      unit: product.unit || '',
      price: product.price,
      unitPrice: product.unitPrice || 0,
      allergens: product.allergens || [],
      origin: product.origin || '',
      availability: product.availability,
      stock: product.stock || 0,
      dietary: extractDietaryInfo(product),
      createdAt: product.createdAt
    }));

    await productsIndex.addDocuments(searchDocuments);
    console.log(`Indexed ${products.length} products`);
  } catch (error) {
    console.error('Failed to index products:', error);
    throw error;
  }
}

/**
 * Update a product in Meilisearch
 * @param {Object} product - Updated product data
 */
async function updateProduct(product) {
  try {
    const productsIndex = meilisearch.index('products');
    
    const searchDocument = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      image: product.image || '',
      size: product.size || '',
      weight: product.weight || 0,
      unit: product.unit || '',
      price: product.price,
      unitPrice: product.unitPrice || 0,
      allergens: product.allergens || [],
      origin: product.origin || '',
      availability: product.availability,
      stock: product.stock || 0,
      dietary: extractDietaryInfo(product),
      createdAt: product.createdAt
    };

    await productsIndex.updateDocuments([searchDocument]);
    console.log(`Updated product in search: ${product.name}`);
  } catch (error) {
    console.error('Failed to update product in search:', error);
    throw error;
  }
}

/**
 * Delete a product from Meilisearch
 * @param {string} productId - Product ID to delete
 */
async function deleteProduct(productId) {
  try {
    const productsIndex = meilisearch.index('products');
    await productsIndex.deleteDocument(productId);
    console.log(`Deleted product from search: ${productId}`);
  } catch (error) {
    console.error('Failed to delete product from search:', error);
    throw error;
  }
}

/**
 * Search products in Meilisearch
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.q - Search query
 * @param {string} searchParams.category - Category filter
 * @param {number} searchParams.page - Page number
 * @param {number} searchParams.limit - Results per page
 * @param {Object} searchParams.filters - Additional filters
 * @returns {Promise<Object>} Search results
 */
async function searchProducts({ q, category, page = 1, limit = 20, filters = {} }) {
  try {
    const productsIndex = meilisearch.index('products');
    const offset = (page - 1) * limit;

    let searchQuery = {
      q,
      limit,
      offset,
      attributesToRetrieve: [
        'id', 'name', 'description', 'category', 'image', 
        'size', 'weight', 'unit', 'price', 'unitPrice', 
        'allergens', 'origin', 'availability', 'stock'
      ],
      attributesToHighlight: ['name', 'description']
    };

    // Add category filter
    if (category) {
      searchQuery.filter = `category = "${category}"`;
    }

    // Add price filters
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceFilter = [];
      if (filters.priceMin !== undefined) {
        priceFilter.push(`price >= ${filters.priceMin}`);
      }
      if (filters.priceMax !== undefined) {
        priceFilter.push(`price <= ${filters.priceMax}`);
      }
      
      if (searchQuery.filter) {
        searchQuery.filter += ` AND (${priceFilter.join(' AND ')})`;
      } else {
        searchQuery.filter = `(${priceFilter.join(' AND ')})`;
      }
    }

    // Add dietary filters
    if (filters.dietary && filters.dietary.length > 0) {
      const dietaryFilter = filters.dietary.map(diet => `dietary = "${diet}"`).join(' OR ');
      
      if (searchQuery.filter) {
        searchQuery.filter += ` AND (${dietaryFilter})`;
      } else {
        searchQuery.filter = `(${dietaryFilter})`;
      }
    }

    // Add allergen filters (exclude products with these allergens)
    if (filters.allergens && filters.allergens.length > 0) {
      const allergenFilter = filters.allergens.map(allergen => 
        `allergens NOT CONTAINS "${allergen}"`
      ).join(' AND ');
      
      if (searchQuery.filter) {
        searchQuery.filter += ` AND (${allergenFilter})`;
      } else {
        searchQuery.filter = `(${allergenFilter})`;
      }
    }

    const searchResults = await productsIndex.search(searchQuery);
    return searchResults;
  } catch (error) {
    console.error('Search products error:', error);
    throw error;
  }
}

/**
 * Get search suggestions/autocomplete
 * @param {string} query - Search query
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} Search suggestions
 */
async function getSearchSuggestions(query, limit = 5) {
  try {
    const productsIndex = meilisearch.index('products');
    
    const searchResults = await productsIndex.search({
      q: query,
      limit,
      attributesToRetrieve: ['name', 'category'],
      attributesToHighlight: ['name']
    });

    return searchResults.hits.map(hit => ({
      name: hit.name,
      category: hit.category,
      highlighted: hit._formatted?.name || hit.name
    }));
  } catch (error) {
    console.error('Get search suggestions error:', error);
    throw error;
  }
}

/**
 * Extract dietary information from product data
 * @param {Object} product - Product data
 * @returns {Array} Dietary tags
 */
function extractDietaryInfo(product) {
  const dietary = [];
  
  // Check for halal indicators
  if (product.name.toLowerCase().includes('halal') || 
      product.description?.toLowerCase().includes('halal')) {
    dietary.push('halal');
  }
  
  // Check for vegan indicators
  if (product.name.toLowerCase().includes('vegan') || 
      product.description?.toLowerCase().includes('vegan')) {
    dietary.push('vegan');
  }
  
  // Check for vegetarian indicators
  if (product.name.toLowerCase().includes('vegetarian') || 
      product.description?.toLowerCase().includes('vegetarian')) {
    dietary.push('vegetarian');
  }
  
  // Check allergens for dietary restrictions
  if (product.allergens) {
    const hasAnimalProducts = product.allergens.some(allergen => 
      ['milk', 'eggs', 'fish', 'shellfish', 'meat'].includes(allergen.toLowerCase())
    );
    
    if (!hasAnimalProducts && !dietary.includes('vegan')) {
      dietary.push('vegetarian');
    }
  }
  
  return dietary;
}

/**
 * Reindex all products (useful for initial setup or after schema changes)
 * @param {Array} products - All products to index
 */
async function reindexAllProducts(products) {
  try {
    console.log('Starting full reindex of products...');
    
    const productsIndex = meilisearch.index('products');
    
    // Clear existing index
    await productsIndex.deleteAllDocuments();
    
    // Index all products
    await indexProducts(products);
    
    console.log('Full reindex completed successfully');
  } catch (error) {
    console.error('Failed to reindex products:', error);
    throw error;
  }
}

module.exports = {
  meilisearch,
  initializeSearchIndexes,
  indexProduct,
  indexProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  getSearchSuggestions,
  reindexAllProducts
};
