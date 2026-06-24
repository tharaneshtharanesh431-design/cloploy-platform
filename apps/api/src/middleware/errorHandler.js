import { logger } from '../config/logger.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    route: req.originalUrl,
    method: req.method
  });
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error'
  });
};
