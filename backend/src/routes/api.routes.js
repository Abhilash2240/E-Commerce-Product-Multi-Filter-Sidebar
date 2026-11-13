import { Router } from 'express';
import { getAllProducts, getProductPriceBoundaries } from '../services/productService.js';
import { CATEGORIES, SORT_OPTIONS_LIST } from '../utils/constants.js';

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

// Products endpoint (retrieves dataset and dynamic price boundaries; filtering not implemented yet)
router.get('/products', (req, res) => {
  const allProducts = getAllProducts();
  const priceBoundaries = getProductPriceBoundaries();

  res.status(200).json({
    success: true,
    count: allProducts.length,
    priceBoundaries,
    data: allProducts
  });
});

export default router;
