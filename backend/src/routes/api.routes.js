import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Quantiphi E-Commerce API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;

