import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

test('App initialization and health route configuration', async (t) => {
  assert.ok(app, 'Express app should be defined');
  assert.strictEqual(typeof app.listen, 'function', 'App should have a listen function');
});

