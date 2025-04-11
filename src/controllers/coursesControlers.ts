import { PrismaClient, Role } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    console.info('Fetching all courses...');
    const courses = await prisma.courses.findMany();

    // Konwersja wartości BigInt na stringi
    const serializableCourses = courses.map((course) => {
      // Tworzenie nowego obiektu z przekształconymi wartościami BigInt
      return Object.entries(course).reduce((obj, [key, value]) => {
        obj[key] = typeof value === 'bigint' ? value.toString() : value;
        return obj;
      }, {});
    });

    res.status(200).json(serializableCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserCourses = async (req: Request, res: Response) => {
  const { nickname } = req.params;
  try {
    console.info(`Fetching courses for user with ID: ${nickname}`);
    const courses = await prisma.courses.findMany({
      where: {
        creator: {
          nickname: nickname,
        },
      },
    });

    const serializableCourses = courses.map((course) => {
      return Object.entries(course).reduce((obj, [key, value]) => {
        obj[key] = typeof value === 'bigint' ? value.toString() : value;
        return obj;
      }, {});
    });

    res.status(200).json(serializableCourses);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
