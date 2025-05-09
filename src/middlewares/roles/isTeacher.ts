import type { RequestWithUser } from '@/types/requestWithUser';
import { Role } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isTeacherRole = (req: RequestWithUser, res: Response, next: NextFunction) => {
  console.log('isTeacherRole middleware is being executed...');
  const user = req.user;
  const allowedRoles: Role[] = [Role.TEACHER, Role.ADMIN];
  if (!user) {
    console.error('User not found in request object.');
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  const role = user.role as Role;

  if (!allowedRoles.includes(role)) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: ReasonPhrases.FORBIDDEN });
  }
  console.info('User role is valid');
  next();
};
