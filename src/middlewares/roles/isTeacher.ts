import { PrismaClient, Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isTeacherRole = (req: Request, res: Response, next: NextFunction) => {
  console.log('isTeacherRole middleware is being executed...');
  const user = req.user as { role: string };
  const allowedRoles = [Role.TEACHER, Role.ADMIN]; // Assuming Role is an enum or object with role values
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
