import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import {
  products,
  getMeta,
  getProducts,
  filterProducts,
  sortProducts
} from '../src/services/productService.js';
import { SORT_OPTIONS } from '../src/utils/constants.js';

test('1. No filters returns all 30 products', () => {
  const result = getProducts({});
  assert.equal(result.count, 30);
  assert.equal(result.total, 30);
  assert.equal(result.products.length, 30);
  assert.equal(result.products[0].id, 1);
});

test('2. Single category', () => {
  const result = getProducts({ categories: 'Electronics' });
  assert.equal(result.count, 10);
  assert.equal(result.total, 30);
  for (const item of result.products) {
    assert.equal(item.category, 'Electronics');
  }
});

test('3. Multiple categories', () => {
  const result = getProducts({ categories: 'Electronics,Footwear' });
  assert.equal(result.count, 20);
  assert.equal(result.total, 30);
  const foundCategories = new Set(result.products.map((p) => p.category));
  assert.deepEqual([...foundCategories].sort(), ['Electronics', 'Footwear']);
});

test('4. Inclusive price boundaries', () => {
  // Test lower inclusive boundary: price 199
  const lowerBoundary = getProducts({ minPrice: 199, maxPrice: 199 });
  assert.equal(lowerBoundary.count, 2);
  for (const item of lowerBoundary.products) {
    assert.equal(item.price, 199);
  }

  // Test upper inclusive boundary: price 49999
  const upperBoundary = getProducts({ minPrice: 49999, maxPrice: 49999 });
  assert.equal(upperBoundary.count, 1);
  assert.equal(upperBoundary.products[0].price, 49999);
});

test('5. Minimum and maximum swapping', () => {
  // When minPrice > maxPrice, query validator swaps them (5000 and 1000 become 1000 and 5000)
  const result = getProducts({ minPrice: 5000, maxPrice: 1000 });
  assert.ok(result.count > 0);
  for (const item of result.products) {
    assert.ok(item.price >= 1000 && item.price <= 5000);
  }
});

test('6. Minimum rating', () => {
  const result = getProducts({ minRating: 4 });
  assert.ok(result.count > 0);
  for (const item of result.products) {
    assert.ok(item.rating >= 4);
  }
});

test('7. Combined filtering', () => {
  const result = getProducts({
    categories: 'Apparel',
    minPrice: 500,
    maxPrice: 3000,
    minRating: 4
  });

  assert.ok(result.count > 0);
  for (const item of result.products) {
    assert.equal(item.category, 'Apparel');
    assert.ok(item.price >= 500 && item.price <= 3000);
    assert.ok(item.rating >= 4);
  }
});

test('8. Zero matching products', () => {
  // Electronics with price <= 200 and rating >= 4 has zero matches (id 6 has price 199, but rating 1.8)
  const result = getProducts({
    categories: 'Electronics',
    minPrice: 199,
    maxPrice: 200,
    minRating: 4
  });

  assert.equal(result.count, 0);
  assert.equal(result.total, 30);
  assert.equal(result.products.length, 0);
});

test('9. Price ascending sorting', () => {
  const result = getProducts({ sort: 'price_asc' });
  assert.equal(result.count, 30);
  for (let i = 0; i < result.products.length - 1; i++) {
    assert.ok(result.products[i].price <= result.products[i + 1].price);
  }
  assert.equal(result.products[0].price, 199);
  assert.equal(result.products[result.products.length - 1].price, 49999);
});

test('10. Rating descending sorting', () => {
  const result = getProducts({ sort: 'rating_desc' });
  assert.equal(result.count, 30);
  for (let i = 0; i < result.products.length - 1; i++) {
    assert.ok(result.products[i].rating >= result.products[i + 1].rating);
  }
  assert.equal(result.products[0].rating, 4.9);
});

test('11. Sorting after filtering', () => {
  const result = getProducts({
    categories: 'Electronics',
    minPrice: 1000,
    maxPrice: 10000,
    sort: 'price_desc'
  });

  assert.ok(result.count > 0);
  for (let i = 0; i < result.products.length - 1; i++) {
    assert.equal(result.products[i].category, 'Electronics');
    assert.ok(result.products[i].price >= result.products[i + 1].price);
  }
});

test('12. Original dataset is not mutated', () => {
  const initialCount = products.length;
  const initialFirst = { ...products[0] };

  // Perform multiple mutations-prone operations
  getProducts({ categories: 'Apparel', sort: 'price_desc' });
  getProducts({ minRating: 4, sort: 'rating_desc' });
  sortProducts(products, SORT_OPTIONS.PRICE_ASC);

  assert.equal(products.length, initialCount);
  assert.deepEqual(products[0], initialFirst);
});

test('13. Unknown sort fallback', () => {
  const result = getProducts({ sort: 'unknown_sort_fallback' });
  assert.equal(result.count, 30);
  // Defaults to relevance: sorted by ID ascending
  for (let i = 0; i < result.products.length - 1; i++) {
    assert.ok(result.products[i].id < result.products[i + 1].id);
  }
});

test('14. Deterministic tie-breaking', () => {
  // 14a: price_asc tie-break -> rating descending, then id ascending
  const priceAsc = sortProducts(products, SORT_OPTIONS.PRICE_ASC);
  const items199 = priceAsc.filter((p) => p.price === 199);
  assert.equal(items199.length, 2);
  // id 6 (rating 1.8) must precede id 27 (rating 1.2)
  assert.equal(items199[0].id, 6);
  assert.equal(items199[1].id, 27);

  // 14b: rating_desc tie-break -> price ascending, then id ascending
  const ratingDesc = sortProducts(products, SORT_OPTIONS.RATING_DESC);
  const items4_8 = ratingDesc.filter((p) => p.rating === 4.8);
  // id 15 (price 4999), id 24 (price 5999), id 1 (price 8999)
  assert.equal(items4_8.length, 3);
  assert.equal(items4_8[0].id, 15);
  assert.equal(items4_8[1].id, 24);
  assert.equal(items4_8[2].id, 1);
});

test('15. REST API - GET /api/products/meta endpoint structure', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/products/meta`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.deepEqual(body.categories, ['Electronics', 'Apparel', 'Footwear']);
    assert.equal(body.minPrice, 199);
    assert.equal(body.maxPrice, 49999);
    assert.deepEqual(body.sortOptions, [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'rating_desc', label: 'Top Rated First' }
    ]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('16. REST API - GET /api/products endpoint structure and filtering', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const url = `http://127.0.0.1:${port}/api/products?categories=Electronics,Footwear&minPrice=500&maxPrice=5000&minRating=4&sort=price_asc`;
    const res = await fetch(url);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(typeof body.count === 'number');
    assert.equal(body.total, 30);
    assert.ok(Array.isArray(body.products));
    assert.equal(body.products.length, body.count);

    for (const item of body.products) {
      assert.ok(item.category === 'Electronics' || item.category === 'Footwear');
      assert.ok(item.price >= 500 && item.price <= 5000);
      assert.ok(item.rating >= 4);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
