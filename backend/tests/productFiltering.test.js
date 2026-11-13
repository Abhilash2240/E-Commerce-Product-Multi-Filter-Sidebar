import test from 'node:test';
import assert from 'node:assert';
import {
  products,
  getMeta,
  hasActiveFilters,
  filterProducts
} from '../src/services/productService.js';

test('Product Service - getMeta dynamic dataset calculations', () => {
  const meta = getMeta();
  assert.strictEqual(meta.minPrice, 199, 'Dynamic minimum price must be 199');
  assert.strictEqual(meta.maxPrice, 49999, 'Dynamic maximum price must be 49999');
  assert.deepStrictEqual(meta.categories.sort(), ['Apparel', 'Electronics', 'Footwear']);
  assert.ok(Array.isArray(meta.sortOptions) && meta.sortOptions.length > 0);
});

test('Product Service - hasActiveFilters detection', () => {
  const meta = getMeta();

  // No active filters
  assert.strictEqual(hasActiveFilters({}, meta), false);
  assert.strictEqual(
    hasActiveFilters({ categories: [], minPrice: 199, maxPrice: 49999, minRating: null }, meta),
    false
  );
  assert.strictEqual(
    hasActiveFilters({ categories: ['Electronics', 'Apparel', 'Footwear'], minPrice: 199, maxPrice: 49999, minRating: null }, meta),
    false
  );

  // Category filter active
  assert.strictEqual(hasActiveFilters({ categories: ['Electronics'] }, meta), true);

  // Price filter active
  assert.strictEqual(hasActiveFilters({ minPrice: 500 }, meta), true);
  assert.strictEqual(hasActiveFilters({ maxPrice: 20000 }, meta), true);

  // Rating filter active
  assert.strictEqual(hasActiveFilters({ minRating: 4 }, meta), true);
});

test('Product Service - Category filtering with OR logic within categories', () => {
  const meta = getMeta();

  // Single category: Electronics (10 items)
  const electronicsOnly = filterProducts(products, { categories: ['Electronics'] }, meta);
  assert.strictEqual(electronicsOnly.length, 10);
  assert.ok(electronicsOnly.every((p) => p.category === 'Electronics'));

  // Multi-category OR logic: Electronics + Footwear (10 + 10 = 20 items)
  const dualCategory = filterProducts(products, { categories: ['Electronics', 'Footwear'] }, meta);
  assert.strictEqual(dualCategory.length, 20);
  assert.ok(dualCategory.every((p) => p.category === 'Electronics' || p.category === 'Footwear'));
  assert.ok(dualCategory.some((p) => p.category === 'Electronics'));
  assert.ok(dualCategory.some((p) => p.category === 'Footwear'));
});

test('Product Service - Price filtering with inclusive boundaries', () => {
  const meta = getMeta();

  // Inclusive min boundary: price >= 49999
  const maxItem = filterProducts(products, { minPrice: 49999 }, meta);
  assert.strictEqual(maxItem.length, 1);
  assert.strictEqual(maxItem[0].price, 49999);

  // Inclusive range
  const midRange = filterProducts(products, { minPrice: 1000, maxPrice: 2500 }, meta);
  assert.ok(midRange.length > 0);
  assert.ok(midRange.every((p) => p.price >= 1000 && p.price <= 2500));
});

test('Product Service - Rating filtering (greater than or equal)', () => {
  const meta = getMeta();

  // Rating >= 4.5
  const highRated = filterProducts(products, { minRating: 4 }, meta);
  assert.ok(highRated.length > 0);
  assert.ok(highRated.every((p) => p.rating >= 4));

  // Rating >= 5
  const perfect = filterProducts(products, { minRating: 5 }, meta);
  assert.ok(perfect.every((p) => p.rating >= 5));
});

test('Product Service - Combinatorial AND logic across Category, Price, and Rating', () => {
  const meta = getMeta();

  // Electronics AND price <= 3000 AND rating >= 4
  const filtered = filterProducts(
    products,
    {
      categories: ['Electronics'],
      minPrice: 199,
      maxPrice: 3000,
      minRating: 4
    },
    meta
  );

  assert.ok(filtered.length > 0);
  filtered.forEach((p) => {
    assert.strictEqual(p.category, 'Electronics');
    assert.ok(p.price >= 199 && p.price <= 3000);
    assert.ok(p.rating >= 4);
  });
});

test('Product Service - Dataset immutability', () => {
  const meta = getMeta();
  const initialLength = products.length;
  const initialFirst = { ...products[0] };

  const result = filterProducts(products, { categories: ['Apparel'], minRating: 4 }, meta);
  assert.notStrictEqual(result, products);
  assert.strictEqual(products.length, initialLength);
  assert.deepStrictEqual(products[0], initialFirst);
});
