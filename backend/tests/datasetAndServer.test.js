import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';
import { CATEGORIES, SORT_OPTIONS, computePriceBoundaries } from '../src/utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsPath = path.resolve(__dirname, '../src/data/products.json');

test('Product dataset verification', async (t) => {
  const fileContent = fs.readFileSync(productsPath, 'utf-8');
  const products = JSON.parse(fileContent);

  // Exactly 30 products
  assert.strictEqual(products.length, 30, 'Dataset must contain exactly 30 products');

  // Category counts: 10 Electronics, 10 Apparel, 10 Footwear
  const counts = { Electronics: 0, Apparel: 0, Footwear: 0 };
  const names = new Set();
  const imageSeeds = new Set();
  const prices = [];
  const ratings = [];

  let countBelow2 = 0;
  let countAboveOrEqual4_5 = 0;

  products.forEach((p, index) => {
    // Required fields
    assert.ok(p.id !== undefined && p.id !== null, `Product at index ${index} must have an id`);
    assert.ok(typeof p.name === 'string' && p.name.trim().length > 0, `Product at index ${index} must have a name`);
    assert.ok(typeof p.category === 'string', `Product at index ${index} must have a category`);
    assert.ok(typeof p.price === 'number', `Product at index ${index} must have a numeric price`);
    assert.ok(typeof p.rating === 'number', `Product at index ${index} must have a numeric rating`);
    assert.ok(typeof p.image === 'string', `Product at index ${index} must have an image string`);

    // Price rules
    assert.ok(Number.isInteger(p.price), `Price of product ${p.id} must be a whole number, got ${p.price}`);
    assert.ok(p.price >= 199, `Price of product ${p.id} must be >= 199, got ${p.price}`);
    assert.ok(p.price <= 49999, `Price of product ${p.id} must be <= 49999, got ${p.price}`);

    // Rating rules
    assert.ok(p.rating >= 1.0 && p.rating <= 5.0, `Rating of product ${p.id} must be between 1.0 and 5.0, got ${p.rating}`);
    const decimalParts = p.rating.toString().split('.');
    assert.ok(
      decimalParts.length === 2 && decimalParts[1].length === 1,
      `Rating of product ${p.id} must have exactly one decimal place, got ${p.rating}`
    );

    if (p.rating < 2.0) countBelow2++;
    if (p.rating >= 4.5) countAboveOrEqual4_5++;

    // Category count
    assert.ok(counts[p.category] !== undefined, `Category ${p.category} must be one of Electronics, Apparel, Footwear`);
    counts[p.category]++;

    // Uniqueness checks
    assert.ok(!names.has(p.name), `Product name must be unique: duplicated "${p.name}"`);
    names.add(p.name);

    // Image seed check
    const seedMatch = p.image.match(/p(\d+)/);
    assert.ok(seedMatch, `Image URL must contain seed p1 through p30: "${p.image}"`);
    const seedNum = parseInt(seedMatch[1], 10);
    assert.ok(seedNum >= 1 && seedNum <= 30, `Image seed number must be between 1 and 30, got ${seedNum}`);
    assert.ok(!imageSeeds.has(seedMatch[0]), `Image seed must be unique: duplicated "${seedMatch[0]}"`);
    imageSeeds.add(seedMatch[0]);

    prices.push(p.price);
    ratings.push(p.rating);
  });

  // Verify category distribution
  assert.strictEqual(counts.Electronics, 10, 'Must have exactly 10 Electronics');
  assert.strictEqual(counts.Apparel, 10, 'Must have exactly 10 Apparel');
  assert.strictEqual(counts.Footwear, 10, 'Must have exactly 10 Footwear');

  // Verify min & max boundaries
  const computed = computePriceBoundaries(products);
  assert.strictEqual(computed.minPrice, 199, 'Minimum price boundary must be 199');
  assert.strictEqual(computed.maxPrice, 49999, 'Maximum price boundary must be 49999');

  // Verify rating conditions
  assert.ok(countBelow2 >= 3, `Must include at least 3 products rated below 2.0 (found ${countBelow2})`);
  assert.ok(countAboveOrEqual4_5 >= 5, `Must include at least 5 products rated 4.5 or above (found ${countAboveOrEqual4_5})`);

  // Verify duplicate prices and duplicate ratings exist
  const uniquePrices = new Set(prices);
  assert.ok(uniquePrices.size < prices.length, 'Dataset must include duplicate prices');

  const uniqueRatings = new Set(ratings);
  assert.ok(uniqueRatings.size < ratings.length, 'Dataset must include duplicate ratings');

  // Verify image seeds coverage
  assert.strictEqual(imageSeeds.size, 30, 'Dataset must have 30 unique image seeds p1 through p30');
});

test('Constants verification', async (t) => {
  assert.deepStrictEqual(CATEGORIES, ['Electronics', 'Apparel', 'Footwear'], 'CATEGORIES constant must match');
  assert.ok(SORT_OPTIONS.PRICE_ASC, 'SORT_OPTIONS must include PRICE_ASC');
  assert.ok(SORT_OPTIONS.PRICE_DESC, 'SORT_OPTIONS must include PRICE_DESC');
  assert.ok(SORT_OPTIONS.RATING_DESC, 'SORT_OPTIONS must include RATING_DESC');
});

test('Express Server boots and responds to API requests', async (t) => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  try {
    const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');

    const productsRes = await fetch(`http://127.0.0.1:${port}/api/products`);
    assert.strictEqual(productsRes.status, 200);
    const productsJson = await productsRes.json();
    assert.strictEqual(productsJson.success, true);
    assert.strictEqual(productsJson.count, 30);
    assert.strictEqual(productsJson.priceBoundaries.minPrice, 199);
    assert.strictEqual(productsJson.priceBoundaries.maxPrice, 49999);
    assert.strictEqual(productsJson.data.length, 30);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
