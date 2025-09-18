const { initializeSearchIndexes } = require('../utils/search');

async function initializeSearch() {
  try {
    console.log('🔍 Initializing Meilisearch...');
    await initializeSearchIndexes();
    console.log('✅ Meilisearch initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Meilisearch:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeSearch()
    .then(() => {
      console.log('🎉 Search initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Search initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeSearch };
