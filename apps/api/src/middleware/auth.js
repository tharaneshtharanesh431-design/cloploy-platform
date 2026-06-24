import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = await User.findById(payload.sub).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid session' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
