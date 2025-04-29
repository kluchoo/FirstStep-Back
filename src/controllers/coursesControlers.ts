import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import path from 'path';

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

    // Fetch student count for each course
    const coursesWithStudentCount = await Promise.all(
      serializableCourses.map(async (course) => {
        const studentCount = await getCourseStudentCount(course.id);
        return { ...course, studentCount };
      }),
    );

    // Fetch categories for each course
    const coursesWithCategories = await Promise.all(
      serializableCourses.map(async (course) => {
        const categories = await getCourseCategories(course.id);
        // Serializacja BigInt w kategoriach
        const serializableCategories = categories.map((cat) => {
          return Object.entries(cat).reduce((obj, [key, value]) => {
            obj[key] = typeof value === 'bigint' ? value.toString() : value;
            return obj;
          }, {});
        });
        return { ...course, categories: serializableCategories };
      }),
    );

    const coursesWithStudentCountAndCategories = coursesWithStudentCount.map((course) => {
      const courseWithCategories = coursesWithCategories.find((c) => c.id === course.id);
      return { ...course, categories: courseWithCategories?.categories || [] };
    });

    res.status(200).json(coursesWithStudentCountAndCategories);
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
    const courseElementsIds = courseElements.map((element) => element.id);
    // Fetch all styles for elements
    const styles = await prisma.elementsStyle.findMany({
      where: {
        courseElementId: {
          in: courseElementsIds,
        },
      },
    });

    // Map styles to their respective course elements
    const courseElementsWithStyles = courseElements.map((element) => {
      const elementStyles = styles.filter((style) => style.courseElementId === element.id);
      return { ...element, styles: elementStyles };
    });

    const serializableCourseElements = courseElementsWithStyles.map((element) => {
      // Serializuj BigInt również w tablicy stylów
      const serializableStyles = (element.styles || []).map((style: any) => {
        return Object.entries(style).reduce((obj, [key, value]) => {
          obj[key] = typeof value === 'bigint' ? value.toString() : value;
          return obj;
        }, {});
      });
      // Serializuj BigInt w głównym obiekcie elementu
      const serializableElement = Object.entries(element).reduce(
        (obj: Record<string, unknown>, [key, value]) => {
          if (key === 'styles') {
            obj[key] = serializableStyles;
          } else {
            obj[key] = typeof value === 'bigint' ? value.toString() : value;
          }
          return obj;
        },
        {} as Record<string, unknown>,
      );
      return serializableElement;
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

    // Pobierz istniejące style dla elementów kursu
    const existingStyles = await prisma.elementsStyle.findMany({
      where: {
        courseElementId: {
          in: existingElements.map((element) => element.id),
        },
      },
    });

    // Stwórz mapę istniejących stylów dla szybkiego wyszukiwania
    const existingStylesMap = new Map();
    existingStyles.forEach((style) => {
      existingStylesMap.set(Number(style.courseElementId), style);
    });

    // Identyfikujemy elementy do usunięcia (te, które są w bazie, ale nie w żądaniu)
    const elementIdsToKeep = newElements
      .map((element) => (element.id ? Number(element.id) : undefined))
      .filter((id) => id !== undefined);

    const elementsToDelete = existingElements.filter(
      (element) => !elementIdsToKeep.includes(Number(element.id)),
    );

    // Usuwamy elementy nieobecne w żądaniu
    if (elementsToDelete.length > 0) {
      // Najpierw usuwamy powiązane style dla elementów, które mają zostać usunięte
      await prisma.elementsStyle.deleteMany({
        where: {
          courseElementId: {
            in: elementsToDelete.map((element) => element.id),
          },
        },
      });

      // Następnie usuwamy elementy
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
        let updatedOrCreatedElement;

        if (elementId && existingElementsMap.has(elementId)) {
          // Aktualizacja istniejącego elementu
          console.info(`Updating element with ID: ${elementId}`);
          updatedOrCreatedElement = await prisma.courseElements.update({
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
          updatedOrCreatedElement = await prisma.courseElements.create({
            data: {
              courseId: Number(courseId),
              type: element.type,
              content: element.content,
              order: element.order || 0,
            },
          });
        }

        // Teraz obsługujemy style dla tego elementu
        if (element.styles && element.styles.length > 0) {
          const style = element.styles[0]; // Zakładamy, że jeden element ma jeden styl

          // Sprawdzamy, czy styl istnieje dla tego elementu
          if (existingStylesMap.has(Number(updatedOrCreatedElement.id))) {
            // Aktualizacja istniejącego stylu
            console.info(`Updating style for element ID: ${updatedOrCreatedElement.id}`);
            await prisma.elementsStyle.update({
              where: { id: existingStylesMap.get(Number(updatedOrCreatedElement.id)).id },
              data: {
                isBold: style.isBold,
                isItalic: style.isItalic,
                isUnderline: style.isUnderline,
                hasHighlight: style.hasHighlight,
                color: style.color,
                fontSize: style.fontSize,
              },
            });
          } else {
            // Tworzenie nowego stylu
            console.info(`Creating new style for element ID: ${updatedOrCreatedElement.id}`);
            await prisma.elementsStyle.create({
              data: {
                courseElementId: updatedOrCreatedElement.id,
                isBold: style.isBold || false,
                isItalic: style.isItalic || false,
                isUnderline: style.isUnderline || false,
                hasHighlight: style.hasHighlight || false,
                color: style.color || null,
                fontSize: style.fontSize || null,
              },
            });
          }
        }

        return updatedOrCreatedElement;
      }),
    );

    // Pobierz aktualizowane elementy wraz z ich stylami
    const updatedElements = await prisma.courseElements.findMany({
      where: {
        id: {
          in: processedElements.map((element) => element.id),
        },
      },
      include: {
        elementsStyles: true,
      },
    });

    // Konwersja wartości BigInt na stringi przed wysłaniem odpowiedzi
    const serializableProcessedElements = updatedElements.map((element) => {
      // Konwertuj style
      const serializableStyles = element.elementsStyles.map((style) => {
        return Object.entries(style).reduce((obj, [key, value]) => {
          obj[key] = typeof value === 'bigint' ? value.toString() : value;
          return obj;
        }, {});
      });

      // Konwertuj element główny
      const serializableElement = Object.entries(element).reduce((obj, [key, value]) => {
        if (key === 'elementsStyles') {
          obj['styles'] = serializableStyles; // Zmiana nazwy klucza z elementsStyles na styles dla zgodności z frontendem
        } else {
          obj[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return obj;
      }, {});

      return serializableElement;
    });

    res.status(200).json(serializableProcessedElements);
  } catch (error) {
    console.error('Error setting course elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Nowy kontroler do obsługi zdjęć w elementach kursu
export const uploadImageForCourseElement = async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku do przesłania.' });
    }

    // Sprawdzamy, czy element kursu istnieje
    const courseElement = await prisma.courseElements.findUnique({
      where: { id: BigInt(elementId) },
    });

    if (!courseElement) {
      return res.status(404).json({ error: 'Element kursu nie został znaleziony.' });
    }

    // Sprawdź, czy element jest typu IMAGE
    if (courseElement.type !== 'IMAGE') {
      return res
        .status(400)
        .json({ error: 'Tylko elementy typu IMAGE mogą mieć przypisane zdjęcia.' });
    }

    // Pobieranie informacji o pliku
    const { filename, originalname, mimetype, size, path: filePath } = req.file;

    // Pobieranie ID użytkownika z sesji/tokenu
    const userId = req.userId;

    // Folder uploads znajduje się w głównym katalogu projektu
    const uploadDir = path.join(__dirname, '../../uploads');

    // Względna ścieżka dla dostępu przez API
    const relativePath = path.relative(uploadDir, filePath);
    const apiPath = `/uploads/${relativePath}`;

    // Zapisanie metadanych pliku do bazy danych
    const fileUpload = await prisma.fileUploads.create({
      data: {
        filename,
        originalName: originalname,
        path: apiPath,
        mimeType: mimetype,
        size,
        userId: BigInt(userId),
      },
    });

    // Aktualizujemy element kursu, aby zawierał URL do zdjęcia
    const imageUrl = `${req.protocol}://${req.get('host')}${apiPath}`;

    await prisma.courseElements.update({
      where: { id: BigInt(elementId) },
      data: {
        content: imageUrl,
        additionalData: {
          fileId: fileUpload.id.toString(),
          originalName: originalname,
          mimeType: mimetype,
        },
      },
    });

    // Przygotowanie odpowiedzi z URL do pliku
    const responseData = {
      id: fileUpload.id.toString(),
      elementId,
      url: imageUrl,
      originalName: fileUpload.originalName,
      mimeType: fileUpload.mimeType,
      size: fileUpload.size,
    };

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Error uploading image for course element:', error);
    return res
      .status(500)
      .json({ error: 'Wystąpił błąd podczas przesyłania zdjęcia dla elementu kursu.' });
  }
};

const getCourseCategories = async (courseId: string) => {
  try {
    console.info('Fetching course categories...');
    const categories = await prisma.categories.findMany({
      where: {
        courses: {
          some: {
            id: Number(courseId),
          },
        },
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching course categories:', error);
    throw new Error('Internal server error');
  }
};

const getCourseStudentCount = async (courseId: string) => {
  try {
    console.info('Fetching course student count...');
    const count = await prisma.enrollments.count({
      where: {
        courseId: Number(courseId),
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching course student count:', error);
    throw new Error('Internal server error');
  }
};
