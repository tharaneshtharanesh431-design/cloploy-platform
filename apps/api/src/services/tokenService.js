import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  });
}
