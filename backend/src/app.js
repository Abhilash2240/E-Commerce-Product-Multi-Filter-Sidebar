import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRouter from './routes/api.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

