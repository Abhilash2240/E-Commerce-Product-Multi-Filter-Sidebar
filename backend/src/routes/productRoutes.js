import { Router } from 'express';
import { getProductMeta, getProducts } from '../controllers/productController.js';

const router = Router();

// GET /api/products/meta
router.get('/meta', getProductMeta);

// GET /api/products
router.get('/', getProducts);

export default router;

