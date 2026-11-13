import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import {
  products,
  sortProducts,
  getProducts
} from '../src/services/productService.js';
import { SORT_OPTIONS } from '../src/utils/constants.js';

test('Product Sorting - relevance orders by ID ascending', () => {
  const sorted = sortProducts(products, SORT_OPTIONS.RELEVANCE);
  assert.strictEqual(sorted.length, products.length);
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(sorted[i].id < sorted[i + 1].id, `Expected id ${sorted[i].id} < ${sorted[i + 1].id}`);
  }
});

test('Product Sorting - price_asc with tie-breakers (rating desc, id asc)', () => {
  const sorted = sortProducts(products, SORT_OPTIONS.PRICE_ASC);
  assert.strictEqual(sorted.length, products.length);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.price === next.price) {
      if (current.rating === next.rating) {
        assert.ok(current.id < next.id, 'Tie-breaker: identical price & rating must sort by id ascending');
      } else {
        assert.ok(current.rating > next.rating, 'Tie-breaker: identical price must sort by rating descending');
      }
    } else {
      assert.ok(current.price < next.price, 'Price must be ascending');
    }
  }

  // Check specific duplicate price items: id 6 (199, 1.8) vs id 27 (199, 1.2)
  const price199Items = sorted.filter((p) => p.price === 199);
  assert.strictEqual(price199Items.length, 2);
  assert.strictEqual(price199Items[0].id, 6);
  assert.strictEqual(price199Items[1].id, 27);
});

test('Product Sorting - price_desc with tie-breakers (rating desc, id asc)', () => {
  const sorted = sortProducts(products, SORT_OPTIONS.PRICE_DESC);
  assert.strictEqual(sorted.length, products.length);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.price === next.price) {
      if (current.rating === next.rating) {
        assert.ok(current.id < next.id, 'Tie-breaker: identical price & rating must sort by id ascending');
      } else {
        assert.ok(current.rating > next.rating, 'Tie-breaker: identical price must sort by rating descending');
      }
    } else {
      assert.ok(current.price > next.price, 'Price must be descending');
    }
  }
});

test('Product Sorting - rating_desc with tie-breakers (price asc, id asc)', () => {
  const sorted = sortProducts(products, SORT_OPTIONS.RATING_DESC);
  assert.strictEqual(sorted.length, products.length);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.rating === next.rating) {
      if (current.price === next.price) {
        assert.ok(current.id < next.id, 'Tie-breaker: identical rating & price must sort by id ascending');
      } else {
        assert.ok(current.price < next.price, 'Tie-breaker: identical rating must sort by price ascending');
      }
    } else {
      assert.ok(current.rating > next.rating, 'Rating must be descending');
    }
  }

  // Check specific duplicate rating 4.8 items:
  // id 1 (8999), id 15 (4999), id 24 (5999)
  // Should sort by price ascending: id 15 (4999), id 24 (5999), id 1 (8999)
  const rating4_8Items = sorted.filter((p) => p.rating === 4.8);
  assert.strictEqual(rating4_8Items[0].id, 15);
  assert.strictEqual(rating4_8Items[1].id, 24);
  assert.strictEqual(rating4_8Items[2].id, 1);
});

test('Product Sorting - unknown sort defaults to relevance', () => {
  const sorted = sortProducts(products, 'invalid_key');
  assert.strictEqual(sorted[0].id, 1);
  assert.strictEqual(sorted[sorted.length - 1].id, 30);
});

test('Product Pipeline - getProducts returns { count, total, products }', () => {
  // Empty query -> full dataset sorted by relevance
  const res1 = getProducts({});
  assert.strictEqual(res1.count, 30);
  assert.strictEqual(res1.total, 30);
  assert.strictEqual(res1.products.length, 30);
  assert.strictEqual(res1.products[0].id, 1);

  // Filtered query: categories=Footwear, minRating=4, sort=price_asc
  const res2 = getProducts({
    categories: 'Footwear',
    minRating: '4',
    sort: 'price_asc'
  });

  assert.strictEqual(res2.total, 30);
  assert.ok(res2.count > 0 && res2.count <= 10);
  res2.products.forEach((p) => {
    assert.strictEqual(p.category, 'Footwear');
    assert.ok(p.rating >= 4);
  });
  // Check sorted by price_asc
  for (let i = 0; i < res2.products.length - 1; i++) {
    assert.ok(res2.products[i].price <= res2.products[i + 1].price);
  }
});

test('HTTP API - Complete filter and sort pipeline on /api/products', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/products?categories=Electronics,Footwear&minPrice=1000&maxPrice=10000&minRating=4&sort=rating_desc`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(data.total, 30);
    assert.ok(data.count > 0);
    assert.strictEqual(data.products.length, data.count);

    data.products.forEach((p) => {
      assert.ok(p.category === 'Electronics' || p.category === 'Footwear');
      assert.ok(p.price >= 1000 && p.price <= 10000);
      assert.ok(p.rating >= 4);
    });

    for (let i = 0; i < data.products.length - 1; i++) {
      assert.ok(data.products[i].rating >= data.products[i + 1].rating);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
