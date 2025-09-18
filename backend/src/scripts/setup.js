#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Feeya Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '../../env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please update it with your configuration.');
  } else {
    console.log('⚠️ env.example file not found. Please create .env file manually.');
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Check if database URL is configured
const envContent = fs.readFileSync(envPath, 'utf8');
if (envContent.includes('postgresql://username:password@localhost:5432/feeya_db')) {
  console.log('\n⚠️ Please update DATABASE_URL in .env file before running migrations');
  console.log('Example: DATABASE_URL="postgresql://feeya_user:feeya_password@localhost:5432/feeya_db"');
} else {
  // Run database migrations
  console.log('\n🗄️ Running database migrations...');
  try {
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    console.log('Please check your DATABASE_URL and ensure PostgreSQL is running');
  }
}

// Initialize search indexes
console.log('\n🔍 Initializing search indexes...');
try {
  execSync('node src/scripts/init-search.js', { stdio: 'inherit' });
  console.log('✅ Search indexes initialized');
} catch (error) {
  console.warn('⚠️ Failed to initialize search indexes:', error.message);
  console.log('Make sure Meilisearch is running on http://localhost:7700');
}

// Seed database
console.log('\n🌱 Seeding database...');
try {
  execSync('node src/scripts/seed.js', { stdio: 'inherit' });
  console.log('✅ Database seeded with sample data');
} catch (error) {
  console.warn('⚠️ Failed to seed database:', error.message);
  console.log('You can run "npm run seed" later to populate the database');
}

console.log('\n🎉 Setup completed!');
console.log('\nNext steps:');
console.log('1. Update your .env file with the correct configuration');
console.log('2. Make sure PostgreSQL and Meilisearch are running');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. The API will be available at http://localhost:3001');
console.log('\nFor Docker setup, run: docker-compose up -d');
