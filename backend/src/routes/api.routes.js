import { Router } from 'express';
import { getMeta, getProducts } from '../services/productService.js';
import { CATEGORIES, SORT_OPTIONS_LIST } from '../utils/constants.js';
import { validateQueryParams } from '../validators/queryValidator.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Quantiphi E-Commerce API is running',
    timestamp: new Date().toISOString()
  });
});

// Product metadata endpoints
router.get('/categories', (req, res) => {
  res.status(200).json({
    success: true,
    data: CATEGORIES
  });
});

router.get('/sort-options', (req, res) => {
  res.status(200).json({
    success: true,
    data: SORT_OPTIONS_LIST
  });
});

// Products endpoint (executes pipeline: validate -> filter -> sort)
router.get('/products', (req, res, next) => {
  try {
    const meta = getMeta();
    const validatedQuery = validateQueryParams(req.query, meta);
    const result = getProducts(req.query);

    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      priceBoundaries: { minPrice: meta.minPrice, maxPrice: meta.maxPrice },
      validatedQuery,
      meta,
      products: result.products,
      data: result.products
    });
  } catch (err) {
    next(err);
  }
});

export default router;
