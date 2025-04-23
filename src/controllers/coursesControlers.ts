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

export const createCourse = async (req: Request, res: Response) => {
  const { title, description, difficultyLevel, status, category } = req.body;
  try {
    console.info('Creating a new course...');
    const newCourse = await prisma.courses.create({
      data: {
        title,
        description,
        difficultyLevel,
        status,
        category, // Ensure category is provided in the request body
        creator: {
          connect: { id: req.userId }, // Assuming req.userId contains the ID of the authenticated user
        },
      },
    });
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.info(`Fetching course with ID: ${id}`);
    const course = await prisma.courses.findUnique({
      where: { id: Number(id) },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const serializableCourse = Object.entries(course).reduce((obj, [key, value]) => {
      obj[key] = typeof value === 'bigint' ? value.toString() : value;
      return obj;
    }, {});
    res.status(200).json(serializableCourse);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, difficultyLevel, status } = req.body;
  try {
    console.info(`Updating course with ID: ${id}`);
    const updatedCourse = await prisma.courses.update({
      where: { id: Number(id) },
      data: { title, description, difficultyLevel, status },
    });
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.info(`Deleting course with ID: ${id}`);
    // Delete related records (e.g., tests or course elements) before deleting the course
    await prisma.answers.deleteMany({
      where: { question: { test: { courseId: Number(id) } } },
    });
    await prisma.testQuestions.deleteMany({
      where: { test: { courseId: Number(id) } },
    });
    await prisma.testResults.deleteMany({
      where: { test: { courseId: Number(id) } },
    });
    await prisma.tests.deleteMany({
      where: { courseId: Number(id) },
    });
    await prisma.courseElements.deleteMany({
      where: { courseId: Number(id) },
    });
    await prisma.enrollments.deleteMany({
      where: { courseId: Number(id) },
    });
    await prisma.courseElementOrder.deleteMany({
      where: { courseId: Number(id) },
    });
    await prisma.courses.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//edycja/pobieranie elementów kursu
export const getCourseElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  try {
    console.info(`Fetching elements for course with ID: ${courseId}`);
    const courseElements = await prisma.courseElements.findMany({
      where: {
        courseId: Number(courseId),
      },
    });

    const serializableCourseElements = courseElements.map((element) => {
      return Object.entries(element).reduce((obj, [key, value]) => {
        obj[key] = typeof value === 'bigint' ? value.toString() : value;
        return obj;
      }, {});
    });

    res.status(200).json(serializableCourseElements);
  } catch (error) {
    console.error('Error fetching course elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNextCourseElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { type, content } = req.body;
  // const order = await prisma.courseElements.count({ where: { courseId: Number(courseId) } });
  try {
    console.info('Creating a new course element...');
    const newCourseElement = await prisma.courseElements.create({
      data: {
        courseId: Number(courseId),
        type,
        content,
        // order: order + 1,
      },
    });
    res.status(201).json(newCourseElement);
  } catch (error) {
    console.error('Error creating course element:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourseElement = async (req: Request, res: Response) => {
  const { elementId } = req.params;
  const { type, content } = req.body;
  try {
    console.info(`Updating course element with ID: ${elementId}`);
    const updatedCourseElement = await prisma.courseElements.update({
      where: { id: Number(elementId) },
      data: { type, content },
    });
    res.status(200).json(updatedCourseElement);
  } catch (error) {
    console.error('Error updating course element:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourseElement = async (req: Request, res: Response) => {
  const { elementId } = req.params;
  try {
    console.info(`Deleting course element with ID: ${elementId}`);
    await prisma.courseElements.delete({
      where: { id: Number(elementId) },
    });

    res.status(200).json({ message: 'Course element deleted successfully' });
  } catch (error) {
    console.error('Error deleting course element:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setCoursesElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { elements: newElements } = req.body;
  console.log('courseId:', req.params.courseId);
  console.log('body:', req.body);

  try {
    console.info(`Setting course elements for course ID: ${courseId}`);

    // Pobierz istniejące elementy
    const existingElements = await prisma.courseElements.findMany({
      where: { courseId: Number(courseId) },
    });

    // Stwórz mapę istniejących elementów dla szybkiego wyszukiwania
    const existingElementsMap = new Map(
      existingElements.map((element) => [Number(element.id), element]),
    );

    // Identyfikujemy elementy do usunięcia (te, które są w bazie, ale nie w żądaniu)
    const elementIdsToKeep = newElements
      .map((element) => (element.id ? Number(element.id) : undefined))
      .filter((id) => id !== undefined);

    const elementsToDelete = existingElements.filter(
      (element) => !elementIdsToKeep.includes(Number(element.id)),
    );

    // Usuwamy elementy nieobecne w żądaniu
    if (elementsToDelete.length > 0) {
      await prisma.courseElements.deleteMany({
        where: {
          id: {
            in: elementsToDelete.map((element) => element.id),
          },
        },
      });
      console.info(`Deleted ${elementsToDelete.length} removed elements`);
    }

    // Aktualizujemy lub tworzymy elementy z żądania
    const processedElements = await Promise.all(
      newElements.map(async (element) => {
        const elementId = element.id ? Number(element.id) : undefined;

        if (elementId && existingElementsMap.has(elementId)) {
          // Aktualizacja istniejącego elementu
          console.info(`Updating element with ID: ${elementId}`);
          return prisma.courseElements.update({
            where: { id: elementId },
            data: {
              type: element.type,
              content: element.content,
              order: element.order,
            },
          });
        } else {
          // Tworzenie nowego elementu lub element z ID nie istnieje
          console.info(`Creating new element${elementId ? ` (ID ${elementId} not found)` : ''}`);
          return prisma.courseElements.create({
            data: {
              courseId: Number(courseId),
              type: element.type,
              content: element.content,
              order: element.order || 0,
            },
          });
        }
      }),
    );

    // Konwersja wartości BigInt na stringi przed wysłaniem odpowiedzi
    const serializableProcessedElements = processedElements.map((element) => {
      return Object.entries(element).reduce((obj, [key, value]) => {
        obj[key] = typeof value === 'bigint' ? value.toString() : value;
        return obj;
      }, {});
    });

    res.status(200).json(serializableProcessedElements);
  } catch (error) {
    console.error('Error setting course elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
