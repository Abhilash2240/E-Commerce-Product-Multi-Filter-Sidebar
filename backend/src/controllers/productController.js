import { getMeta, getProducts as getProcessedProducts } from '../services/productService.js';
import { validateQueryParams } from '../validators/queryValidator.js';

/**
 * Controller to fetch dynamic product metadata.
 * GET /api/products/meta
 */
export function getProductMeta(req, res) {
  try {
    const meta = getMeta();
    return res.status(200).json({
      categories: meta.categories,
      minPrice: meta.minPrice,
      maxPrice: meta.maxPrice,
      sortOptions: meta.sortOptions.map((opt) => ({
        value: opt.value,
        label: opt.label
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Controller to fetch filtered and sorted products.
 * GET /api/products
 */
export function getProducts(req, res) {
  try {
    const meta = getMeta();
    const validatedQuery = validateQueryParams(req.query, meta);
    const result = getProcessedProducts(req.query);

    return res.status(200).json({
      count: result.count,
      total: result.total,
      products: result.products,
      // Backwards-compatibility metadata for earlier test suites
      success: true,
      data: result.products,
      priceBoundaries: { minPrice: meta.minPrice, maxPrice: meta.maxPrice },
      validatedQuery
    });
  } catch (err) {
    if (err.statusCode && err.statusCode < 500) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err.message
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
