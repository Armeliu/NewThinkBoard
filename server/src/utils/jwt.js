import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};
