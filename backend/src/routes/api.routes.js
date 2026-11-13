import { Router } from 'express';
import productRoutes from './productRoutes.js';
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

// Modular product routes: /api/products and /api/products/meta
router.use('/products', productRoutes);

export default router;
