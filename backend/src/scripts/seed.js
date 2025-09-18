const { PrismaClient } = require('@prisma/client');
const { indexProducts } = require('../utils/search');

const prisma = new PrismaClient();

// Sample products data
const sampleProducts = [
  {
    name: 'Fufu Flour',
    description: 'Traditional cassava flour for making fufu',
    category: 'Rice & Grains',
    image: 'https://example.com/fufu-flour.jpg',
    size: '1kg',
    weight: 1.0,
    unit: 'kg',
    price: 4.99,
    unitPrice: 4.99,
    allergens: [],
    origin: 'Ghana',
    availability: true,
    stock: 50
  },
  {
    name: 'Plantains (Green)',
    description: 'Fresh green plantains for cooking',
    category: 'Fresh Produce',
    image: 'https://example.com/plantains.jpg',
    size: '1kg',
    weight: 1.0,
    unit: 'kg',
    price: 3.50,
    unitPrice: 3.50,
    allergens: [],
    origin: 'Cameroon',
    availability: true,
    stock: 30
  },
  {
    name: 'Egusi Seeds',
    description: 'Ground melon seeds for soups and stews',
    category: 'Spices & Seasonings',
    image: 'https://example.com/egusi.jpg',
    size: '500g',
    weight: 0.5,
    unit: 'kg',
    price: 6.99,
    unitPrice: 13.98,
    allergens: [],
    origin: 'Nigeria',
    availability: true,
    stock: 25
  },
  {
    name: 'Jollof Rice Seasoning',
    description: 'Authentic seasoning blend for Jollof rice',
    category: 'Spices & Seasonings',
    image: 'https://example.com/jollof-seasoning.jpg',
    size: '200g',
    weight: 0.2,
    unit: 'kg',
    price: 4.50,
    unitPrice: 22.50,
    allergens: [],
    origin: 'Nigeria',
    availability: true,
    stock: 40
  },
  {
    name: 'Fresh Tilapia Fish',
    description: 'Fresh whole tilapia fish',
    category: 'Meat & Fish',
    image: 'https://example.com/tilapia.jpg',
    size: '1kg',
    weight: 1.0,
    unit: 'kg',
    price: 12.99,
    unitPrice: 12.99,
    allergens: ['fish'],
    origin: 'Belgium',
    availability: true,
    stock: 15
  },
  {
    name: 'Palm Oil',
    description: 'Red palm oil for cooking',
    category: 'Spices & Seasonings',
    image: 'https://example.com/palm-oil.jpg',
    size: '500ml',
    weight: 0.5,
    unit: 'L',
    price: 5.99,
    unitPrice: 11.98,
    allergens: [],
    origin: 'Ghana',
    availability: true,
    stock: 20
  },
  {
    name: 'Coconut Milk',
    description: 'Rich coconut milk for curries and stews',
    category: 'Spices & Seasonings',
    image: 'https://example.com/coconut-milk.jpg',
    size: '400ml',
    weight: 0.4,
    unit: 'L',
    price: 2.99,
    unitPrice: 7.48,
    allergens: [],
    origin: 'Thailand',
    availability: true,
    stock: 35
  },
  {
    name: 'African Bread',
    description: 'Traditional African bread',
    category: 'Bakery',
    image: 'https://example.com/african-bread.jpg',
    size: '1 piece',
    weight: 0.3,
    unit: 'piece',
    price: 2.50,
    unitPrice: 8.33,
    allergens: ['gluten', 'wheat'],
    origin: 'Belgium',
    availability: true,
    stock: 10
  },
  {
    name: 'Ginger Root',
    description: 'Fresh ginger root',
    category: 'Fresh Produce',
    image: 'https://example.com/ginger.jpg',
    size: '100g',
    weight: 0.1,
    unit: 'kg',
    price: 1.99,
    unitPrice: 19.90,
    allergens: [],
    origin: 'India',
    availability: true,
    stock: 50
  },
  {
    name: 'Scotch Bonnet Peppers',
    description: 'Hot scotch bonnet peppers',
    category: 'Fresh Produce',
    image: 'https://example.com/scotch-bonnet.jpg',
    size: '200g',
    weight: 0.2,
    unit: 'kg',
    price: 3.99,
    unitPrice: 19.95,
    allergens: [],
    origin: 'Jamaica',
    availability: true,
    stock: 25
  }
];

// Sample delivery zones
const sampleDeliveryZones = [
  {
    name: 'Brussels Central',
    postalCodes: ['1000', '1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010', '1011', '1012', '1013', '1014', '1015', '1016', '1017', '1018', '1019', '1020', '1021', '1022', '1023', '1024', '1025', '1026', '1027', '1028', '1029', '1030', '1031', '1032', '1033', '1034', '1035', '1036', '1037', '1038', '1039', '1040', '1041', '1042', '1043', '1044', '1045', '1046', '1047', '1048', '1049', '1050'],
    deliveryFee: 3.99,
    freeDeliveryThreshold: 40.00,
    etaBands: {
      'morning': { start: '09:00', end: '12:00', available: true },
      'afternoon': { start: '12:00', end: '16:00', available: true },
      'evening': { start: '16:00', end: '20:00', available: true }
    },
    isActive: true
  },
  {
    name: 'Hasselt Area',
    postalCodes: ['3500', '3501', '3502', '3503', '3504', '3505', '3506', '3507', '3508', '3509', '3510', '3511', '3512', '3513', '3514', '3515', '3516', '3517', '3518', '3519', '3520', '3521', '3522', '3523', '3524', '3525', '3526', '3527', '3528', '3529', '3530', '3531', '3532', '3533', '3534', '3535', '3536', '3537', '3538', '3539', '3540', '3541', '3542', '3543', '3544', '3545', '3546', '3547', '3548', '3549', '3550'],
    deliveryFee: 4.99,
    freeDeliveryThreshold: 50.00,
    etaBands: {
      'morning': { start: '09:00', end: '12:00', available: true },
      'afternoon': { start: '12:00', end: '16:00', available: true },
      'evening': { start: '16:00', end: '20:00', available: true }
    },
    isActive: true
  }
];

// Sample substitutions
const sampleSubstitutions = [
  {
    productId: null, // Will be set after products are created
    substituteId: null, // Will be set after products are created
    priority: 1,
    priceRule: 'REFUND_DELTA',
    maxDelta: 2.00
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.orderEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.basketItem.deleteMany();
    await prisma.basket.deleteMany();
    await prisma.address.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.substitution.deleteMany();
    await prisma.deliveryZone.deleteMany();
    await prisma.product.deleteMany();

    // Create delivery zones
    console.log('📍 Creating delivery zones...');
    for (const zone of sampleDeliveryZones) {
      await prisma.deliveryZone.create({
        data: zone
      });
    }

    // Create products
    console.log('🛍️ Creating products...');
    const createdProducts = [];
    for (const product of sampleProducts) {
      const created = await prisma.product.create({
        data: product
      });
      createdProducts.push(created);
    }

    // Index products in Meilisearch
    console.log('🔍 Indexing products in Meilisearch...');
    try {
      await indexProducts(createdProducts);
      console.log('✅ Products indexed successfully');
    } catch (error) {
      console.warn('⚠️ Failed to index products in Meilisearch:', error.message);
    }

    // Create sample substitutions (using first two products as example)
    if (createdProducts.length >= 2) {
      console.log('🔄 Creating substitutions...');
      await prisma.substitution.create({
        data: {
          productId: createdProducts[0].id,
          substituteId: createdProducts[1].id,
          priority: 1,
          priceRule: 'REFUND_DELTA',
          maxDelta: 2.00
        }
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${createdProducts.length} products`);
    console.log(`   - ${sampleDeliveryZones.length} delivery zones`);
    console.log(`   - 1 substitution rule`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
