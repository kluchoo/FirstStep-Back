import type { RequestWithUser } from '@/types/requestWithUser';
import { PrismaClient } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export const isYourCourse = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const user = req.user as { id: string | bigint }; // Typowanie usera jako obiekt z id
  // Obsługa zarówno courseId, jak i id
  const courseIdParam = req.params.courseId || req.params.id;

  if (!user) {
    console.error('User not found in request object.');
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  if (!courseIdParam) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Course ID is required' });
  }

  try {
    const prisma = new PrismaClient();
    const course = await prisma.courses.findFirst({
      where: {
        id: BigInt(courseIdParam),
        creatorId: BigInt(user.id),
      },
    });
    await prisma.$disconnect();
    if (!course) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: ReasonPhrases.FORBIDDEN });
    }
    next();
  } catch (error) {
    console.error('Error checking course ownership:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
  }
};
