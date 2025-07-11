// filepath: c:\Users\kidi\Desktop\FirstStep\firststep-back\src\middlewares\authMiddleware.ts
import type { RequestWithUser } from '@/types/requestWithUser';
import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
  console.log('Authenticate token middleware is being executed...');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // console.log(authHeader);

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  if (!process.env.JWT_SECRET) {
    return res.sendStatus(500); // Internal Server Error due to missing JWT_SECRET
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403); // Forbidden
    }

    req.user = user;
    next();
  });
};
