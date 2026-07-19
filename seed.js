/**
 * Seed Script — GlossyEve
 * ─────────────────────────────────────────────────────────
 * Clears old dummy categories & products, then inserts
 * proper lingerie categories, a brand, and 10 products.
 *
 * Usage:
 *   cd glossyeve-server
 *   node seed.js
 * ─────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Brand = require('./src/models/Brand');
const Product = require('./src/models/Product');

// ── Seed data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Bras', slug: 'bras', description: 'Comfortable and stylish bras for every occasion.' },
  { name: 'Panties', slug: 'panties', description: 'Elegant and breathable panties in premium fabrics.' },
  { name: 'Nightwear', slug: 'nightwear', description: 'Luxurious nightgowns, robes, and pajama sets.' },
  { name: 'Sets', slug: 'sets', description: 'Perfectly matched lingerie sets for a complete look.' },
];

const BRAND_NAME = 'GlossyEve';

// Products keyed by category slug
const PRODUCTS_BY_CATEGORY = {
  bras: [
    {
      name: 'Silk Lace Bralette',
      sku: 'BR-001',
      description: 'Elegant silk bralette with delicate lace trim. Perfect for everyday comfort and style.',
      price: 1250,
      stock: 50,
      images: ['https://picsum.photos/seed/silk-lace/600/800', 'https://picsum.photos/seed/silk-lace2/600/800'],
      specifications: [
        { key: 'Material', value: '80% Silk, 20% Lace' },
        { key: 'Sizes', value: 'S, M, L, XL' },
        { key: 'Colors', value: 'Rose Gold, Black, Cream' },
      ],
    },
    {
      name: 'Everyday T-Shirt Bra',
      sku: 'BR-002',
      description: 'Seamless and invisible under clothing. Designed for all-day comfort and support.',
      price: 950,
      stock: 80,
      images: ['https://picsum.photos/seed/tshirt-bra/600/800'],
      specifications: [
        { key: 'Material', value: '95% Cotton, 5% Spandex' },
        { key: 'Sizes', value: '32A, 32B, 34B, 34C, 36C' },
        { key: 'Colors', value: 'Nude, Black, White' },
      ],
    },
    {
      name: 'Push-Up Plunge Bra',
      sku: 'BR-003',
      description: 'Enhances cleavage with comfortable padding and underwire support.',
      price: 1450,
      discountPrice: 1200,
      stock: 35,
      images: ['https://picsum.photos/seed/plunge-bra/600/800'],
      specifications: [
        { key: 'Material', value: 'Microfiber, Foam Padding' },
        { key: 'Sizes', value: '32B, 34B, 34C, 36B' },
        { key: 'Colors', value: 'Crimson Red, Black' },
      ],
    },
  ],
  panties: [
    {
      name: 'Lace Trim Panty Set',
      sku: 'PN-001',
      description: 'Set of 3 cotton panties with elegant lace trim. Breathable and stylish.',
      price: 850,
      stock: 100,
      images: ['https://picsum.photos/seed/lace-panty/600/800'],
      specifications: [
        { key: 'Material', value: '100% Cotton with Lace' },
        { key: 'Sizes', value: 'S, M, L' },
        { key: 'Colors', value: 'Pastel Mix, Classic Black' },
        { key: 'Pack', value: 'Set of 3' },
      ],
    },
    {
      name: 'High-Waist Briefs (Pack of 2)',
      sku: 'PN-002',
      description: 'Comfortable high-waisted briefs offering full coverage and a smooth silhouette.',
      price: 600,
      stock: 120,
      images: ['https://picsum.photos/seed/briefs/600/800'],
      specifications: [
        { key: 'Material', value: 'Soft Cotton Blend' },
        { key: 'Sizes', value: 'M, L, XL, XXL' },
        { key: 'Colors', value: 'Beige, Black' },
        { key: 'Pack', value: 'Pack of 2' },
      ],
    },
  ],
  nightwear: [
    {
      name: 'Satin Nightgown',
      sku: 'NW-001',
      description: 'Luxurious satin nightgown with adjustable straps. Soft on the skin for a peaceful sleep.',
      price: 2400,
      stock: 40,
      images: ['https://picsum.photos/seed/satin-night/600/800'],
      specifications: [
        { key: 'Material', value: '100% Satin' },
        { key: 'Sizes', value: 'M, L, XL' },
        { key: 'Colors', value: 'Midnight Blue, Emerald, Burgundy' },
      ],
    },
    {
      name: 'Cotton Pajama Set',
      sku: 'NW-002',
      description: 'Cozy two-piece pajama set made from 100% breathable cotton.',
      price: 2100,
      stock: 60,
      images: ['https://picsum.photos/seed/pajama-set/600/800'],
      specifications: [
        { key: 'Material', value: '100% Cotton' },
        { key: 'Sizes', value: 'S, M, L, XL' },
        { key: 'Colors', value: 'Lavender, Mint Green' },
        { key: 'Includes', value: 'Top + Pants' },
      ],
    },
    {
      name: 'Silk Robe',
      sku: 'NW-003',
      description: 'Premium silk robe with a tie belt and wide sleeves. Elegance at its finest.',
      price: 2800,
      discountPrice: 2400,
      stock: 25,
      images: ['https://picsum.photos/seed/silk-robe/600/800'],
      specifications: [
        { key: 'Material', value: 'Premium Silk' },
        { key: 'Sizes', value: 'Free Size' },
        { key: 'Colors', value: 'Champagne, Navy Blue' },
      ],
    },
  ],
  sets: [
    {
      name: 'Embroidered Mesh Set',
      sku: 'ST-001',
      description: 'Exquisite embroidered mesh bra and panty set. Designed for special occasions.',
      price: 3200,
      discountPrice: 2800,
      stock: 30,
      images: ['https://picsum.photos/seed/mesh-set/600/800'],
      specifications: [
        { key: 'Material', value: 'Embroidered Mesh, Satin' },
        { key: 'Sizes', value: '32B, 34B, 36B, 34C' },
        { key: 'Colors', value: 'Floral Pink, Deep Red' },
        { key: 'Includes', value: 'Bra + Panty' },
      ],
    },
    {
      name: 'Bridal Honeymoon Set',
      sku: 'ST-002',
      description: 'A stunning 3-piece bridal set featuring a robe, slip dress, and matching lingerie.',
      price: 4500,
      stock: 20,
      images: ['https://picsum.photos/seed/bridal-set/600/800'],
      specifications: [
        { key: 'Material', value: 'Silk, Lace, Chiffon' },
        { key: 'Sizes', value: 'S, M, L' },
        { key: 'Colors', value: 'Ivory White, Blush Pink' },
        { key: 'Includes', value: 'Robe + Slip Dress + Lingerie' },
      ],
    },
  ],
};

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'aonelube',
  });
  console.log('✅ Connected to MongoDB');

  // 1. Delete old dummy data only (keep other collections intact)
  const deletedProducts = await Product.deleteMany({});
  console.log(`🗑  Deleted ${deletedProducts.deletedCount} products`);

  const deletedCategories = await Category.deleteMany({});
  console.log(`🗑  Deleted ${deletedCategories.deletedCount} categories`);

  // 2. Insert categories
  const createdCategories = {};
  for (const catData of CATEGORIES) {
    const cat = await Category.create(catData);
    createdCategories[catData.slug] = cat._id;
    console.log(`📁 Created category: ${cat.name} (slug: ${cat.slug})`);
  }

  // 3. Upsert brand
  let brand = await Brand.findOne({ name: BRAND_NAME });
  if (!brand) {
    brand = await Brand.create({ name: BRAND_NAME });
    console.log(`🏷  Created brand: ${brand.name}`);
  } else {
    console.log(`🏷  Reusing brand: ${brand.name}`);
  }

  // 4. Insert products
  let productCount = 0;
  for (const [categorySlug, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) {
      console.warn(`⚠️  No category found for slug: ${categorySlug}`);
      continue;
    }

    for (const productData of products) {
      await Product.create({
        ...productData,
        category: categoryId,
        brand: brand._id,
        benefits: [],
      });
      console.log(`  ✔ Product: ${productData.name}`);
      productCount++;
    }
  }

  console.log(`\n✅ Seeding complete! ${productCount} products across ${CATEGORIES.length} categories.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
