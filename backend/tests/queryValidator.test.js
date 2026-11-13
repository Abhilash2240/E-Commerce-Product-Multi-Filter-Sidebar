import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import { validateQueryParams, QueryValidationError } from '../src/validators/queryValidator.js';
import { CATEGORIES, SORT_OPTIONS } from '../src/utils/constants.js';

const boundaries = { minPrice: 199, maxPrice: 49999 };

test('Query Validator - Categories sanitization', () => {
  // Comma-separated values and whitespace trimming
  const res1 = validateQueryParams({ categories: ' Electronics , Footwear ' }, boundaries);
  assert.deepStrictEqual(res1.categories, ['Electronics', 'Footwear']);

  // Filters out unknown categories
  const res2 = validateQueryParams({ categories: 'Electronics,Automotive,Groceries' }, boundaries);
  assert.deepStrictEqual(res2.categories, ['Electronics']);

  // Case-insensitive mapping
  const res3 = validateQueryParams({ categories: 'apparel, footwear' }, boundaries);
  assert.deepStrictEqual(res3.categories, ['Apparel', 'Footwear']);

  // Empty or omitted selection defaults to all categories
  const res4 = validateQueryParams({}, boundaries);
  assert.deepStrictEqual(res4.categories, CATEGORIES);

  const res5 = validateQueryParams({ categories: '' }, boundaries);
  assert.deepStrictEqual(res5.categories, CATEGORIES);

  const res6 = validateQueryParams({ categories: 'Unknown1, Unknown2' }, boundaries);
  assert.deepStrictEqual(res6.categories, CATEGORIES);
});

test('Query Validator - Price sanitization and boundary clamping', () => {
  // Standard conversion
  const res1 = validateQueryParams({ minPrice: '1000', maxPrice: '15000' }, boundaries);
  assert.strictEqual(res1.minPrice, 1000);
  assert.strictEqual(res1.maxPrice, 15000);

  // Invalid numbers use dataset boundaries
  const res2 = validateQueryParams({ minPrice: 'abc', maxPrice: 'invalid' }, boundaries);
  assert.strictEqual(res2.minPrice, 199);
  assert.strictEqual(res2.maxPrice, 49999);

  // Clamping to boundaries
  const res3 = validateQueryParams({ minPrice: '50', maxPrice: '99999' }, boundaries);
  assert.strictEqual(res3.minPrice, 199);
  assert.strictEqual(res3.maxPrice, 49999);

  // Swap when minPrice > maxPrice
  const res4 = validateQueryParams({ minPrice: '20000', maxPrice: '5000' }, boundaries);
  assert.strictEqual(res4.minPrice, 5000);
  assert.strictEqual(res4.maxPrice, 20000);
});

test('Query Validator - Rating sanitization', () => {
  // Accept integer values 1 through 5
  assert.strictEqual(validateQueryParams({ minRating: '1' }, boundaries).minRating, 1);
  assert.strictEqual(validateQueryParams({ minRating: '4' }, boundaries).minRating, 4);
  assert.strictEqual(validateQueryParams({ minRating: '5' }, boundaries).minRating, 5);

  // Invalid values become null
  assert.strictEqual(validateQueryParams({ minRating: '9' }, boundaries).minRating, null);
  assert.strictEqual(validateQueryParams({ minRating: '0' }, boundaries).minRating, null);
  assert.strictEqual(validateQueryParams({ minRating: '3.5' }, boundaries).minRating, null);
  assert.strictEqual(validateQueryParams({ minRating: 'abc' }, boundaries).minRating, null);
  assert.strictEqual(validateQueryParams({ minRating: '' }, boundaries).minRating, null);
  assert.strictEqual(validateQueryParams({}, boundaries).minRating, null);
});

test('Query Validator - Sort sanitization', () => {
  // Supported sort options
  assert.strictEqual(validateQueryParams({ sort: 'price_asc' }, boundaries).sort, 'price_asc');
  assert.strictEqual(validateQueryParams({ sort: 'price_desc' }, boundaries).sort, 'price_desc');
  assert.strictEqual(validateQueryParams({ sort: 'rating_desc' }, boundaries).sort, 'rating_desc');
  assert.strictEqual(validateQueryParams({ sort: 'relevance' }, boundaries).sort, 'relevance');

  // Unknown values default to relevance
  assert.strictEqual(validateQueryParams({ sort: 'xyz' }, boundaries).sort, 'relevance');
  assert.strictEqual(validateQueryParams({ sort: 'popular' }, boundaries).sort, 'relevance');
  assert.strictEqual(validateQueryParams({}, boundaries).sort, 'relevance');
});

test('Query Validator - Error handling for array/object parameters', () => {
  // Array parameters throw QueryValidationError
  assert.throws(
    () => validateQueryParams({ minPrice: ['100', '200'] }, boundaries),
    (err) => err instanceof QueryValidationError && err.statusCode === 400
  );

  // Object parameters throw QueryValidationError
  assert.throws(
    () => validateQueryParams({ categories: { item: 'Electronics' } }, boundaries),
    (err) => err instanceof QueryValidationError && err.statusCode === 400
  );

  // Defensive: never crashes on unexpected inputs
  assert.doesNotThrow(() => validateQueryParams(null, boundaries));
  assert.doesNotThrow(() => validateQueryParams(undefined, boundaries));
});

test('HTTP API - Verification of required examples', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. /api/products?minPrice=abc
    const res1 = await fetch(`${baseUrl}/api/products?minPrice=abc`);
    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.validatedQuery.minPrice, 199);
    assert.strictEqual(data1.count, 30); // Not filtered yet

    // 2. /api/products?minRating=9
    const res2 = await fetch(`${baseUrl}/api/products?minRating=9`);
    assert.strictEqual(res2.status, 200);
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true);
    assert.strictEqual(data2.validatedQuery.minRating, null);

    // 3. /api/products?sort=xyz
    const res3 = await fetch(`${baseUrl}/api/products?sort=xyz`);
    assert.strictEqual(res3.status, 200);
    const data3 = await res3.json();
    assert.strictEqual(data3.success, true);
    assert.strictEqual(data3.validatedQuery.sort, 'relevance');

    // 4. Array/object valued parameters return HTTP 400
    const res4 = await fetch(`${baseUrl}/api/products?minPrice[]=100`);
    assert.strictEqual(res4.status, 400);
    const data4 = await res4.json();
    assert.strictEqual(data4.success, false);
    assert.ok(data4.message.includes('Array- or object-valued'));

    const res5 = await fetch(`${baseUrl}/api/products?categories[a]=test`);
    assert.strictEqual(res5.status, 400);
    const data5 = await res5.json();
    assert.strictEqual(data5.success, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
