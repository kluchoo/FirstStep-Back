import { PrismaClient, Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isAdminRole = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { role: string };
  const allowedRoles = [Role.ADMIN]; // Assuming Role is an enum or object with role values
  console.info('User role:', user.role);
  if (!user) {
    console.error('User not found in request object.');
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  if (!allowedRoles.includes(user.role)) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: ReasonPhrases.FORBIDDEN });
  }
  console.info('User role is valid');
  next();
};
