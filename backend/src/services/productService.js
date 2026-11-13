import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePriceBoundaries } from '../utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.resolve(__dirname, '../data/products.json');

// Read products synchronously on startup
const rawProducts = fs.readFileSync(dataFilePath, 'utf-8');
export const products = JSON.parse(rawProducts);

/**
 * Returns all products without filtering (filtering to be implemented in a subsequent milestone)
 */
export function getAllProducts() {
  return products;
}

/**
 * Computes min and max price dynamically from the products dataset
 */
export function getProductPriceBoundaries() {
  return computePriceBoundaries(products);
}
