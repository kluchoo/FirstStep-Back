import type { RequestWithUser } from '@/types/requestWithUser';
import { Role } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isAnyRoles = (req: RequestWithUser, res: Response, next: NextFunction) => {
  console.log('isAnyRoles middleware is being executed...');
  const user = req.user as { role: string };
  const allowedRoles = Object.values(Role); // Assuming Role is an enum or object with role values
  if (!user) {
    console.error('User not found in request object.');
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  if (!allowedRoles.includes(user.role as Role)) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: ReasonPhrases.FORBIDDEN });
  }
  console.info('User role is valid');
  next();
};
