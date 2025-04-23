import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isYourCourse = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { id: bigint }; // Zakładam, że `id` użytkownika jest typu bigint
  const { courseId } = req.params;

  if (!user) {
    console.error('User not found in request object.');
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  if (!courseId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Course ID is required' });
  }

  const prisma = new PrismaClient();

  prisma.courses
    .findFirst({
      where: {
        id: courseId,
        creatorId: user.id,
      },
    })
    .then((course) => {
      if (!course) {
        return res.status(StatusCodes.FORBIDDEN).json({ message: ReasonPhrases.FORBIDDEN });
      }
      next();
    })
    .catch((error) => {
      console.error('Error checking course ownership:', error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    });
};
