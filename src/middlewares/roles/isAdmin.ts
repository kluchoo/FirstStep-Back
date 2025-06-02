import type { RequestWithUser } from '@/types/requestWithUser';
import { Role } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isAdminRole = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const user = req.user as { role: string };
  const allowedRoles = [Role.ADMIN as string]; // Ensure allowedRoles is string[]
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
