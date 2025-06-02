import type { RequestWithUser } from '@/types/requestWithUser';
import type { Request, Response } from 'express';
import path from 'path';
import { Pool } from 'pg';

// Konfiguracja połączenia z PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(/^"|"$/g, ''),
});

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    console.info('Fetching all courses...');
    const result = await pool.query(`SELECT * FROM "Courses"`);
    const courses = result.rows;

    // Serializacja już nie jest potrzebna, ponieważ pg konwertuje BigInt na string

    // Pobierz liczbę studentów dla każdego kursu
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await getCourseStudentCount(course.id);
        return { ...course, studentCount };
      }),
    );

    // Pobierz kategorie dla każdego kursu
    const coursesWithCategories = await Promise.all(
      courses.map(async (course) => {
        const categories = await getCourseCategories(course.id);
        return { ...course, categories };
      }),
    );

    const coursesWithStudentCountAndCategories = coursesWithStudentCount.map((course) => {
      const courseWithCategories = coursesWithCategories.find((c) => c.id === course.id);
      return { ...course, categories: courseWithCategories?.categories || [] };
    });

    res.status(200).json(coursesWithStudentCountAndCategories);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserCourses = async (req: Request, res: Response) => {
  const { nickname } = req.params;
  try {
    console.info(`Fetching courses for user with nickname: ${nickname}`);
    const result = await pool.query(
      `
      SELECT c.* FROM "Courses" c
      INNER JOIN "Users" u ON c."creatorId" = u.id
      WHERE u.nickname = $1
    `,
      [nickname],
    );
    const courses = result.rows;

    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await getCourseStudentCount(course.id);
        return { ...course, studentCount };
      }),
    );

    const coursesWithCategories = await Promise.all(
      courses.map(async (course) => {
        const categories = await getCourseCategories(course.id);
        return { ...course, categories };
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

export const createCourse = async (req: RequestWithUser, res: Response) => {
  const { title, description, difficultyLevel, status } = req.body;
  try {
    console.info('Creating a new course...');
    const user = req.user as { id: string | number | bigint };

    const result = await pool.query(
      `
      INSERT INTO "Courses" (title, description, "difficultyLevel", status, "creatorId") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `,
      [title, description, difficultyLevel, status, user.id.toString()],
    );

    const newCourse = result.rows[0];

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
    const result = await pool.query(
      `
      SELECT * FROM "Courses" WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];
    res.status(200).json(course);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, difficultyLevel, status, categories } = req.body;

  const client = await pool.connect();
  try {
    console.info(`Updating course with ID: ${id}`);

    await client.query('BEGIN');

    // Aktualizacja głównych danych kursu
    const result = await client.query(
      `
      UPDATE "Courses" 
      SET title = $1, description = $2, "difficultyLevel" = $3, status = $4 
      WHERE id = $5 
      RETURNING *
    `,
      [title, description, difficultyLevel, status, id],
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = result.rows[0];

    // Aktualizacja kategorii jeśli zostały podane
    if (Array.isArray(categories)) {
      // Najpierw usuń wszystkie obecne powiązania
      await client.query(
        `
        DELETE FROM "_CourseCategories" 
        WHERE "B" = $1
      `,
        [id],
      );

      // Następnie dodaj nowe powiązania
      for (const category of categories) {
        await client.query(
          `
          INSERT INTO "_CourseCategories" ("A", "B") 
          VALUES ($1, $2)
        `,
          [category.id, id],
        );
      }
    }

    await client.query('COMMIT');

    // Pobierz aktualizowany kurs z kategoriami
    if (id === undefined) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Course ID is required.' });
    }
    const courseCategories = await getCourseCategories(id);
    res.status(200).json({ ...updatedCourse, categories: courseCategories });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.info(`Deleting course with ID: ${id} using procedure`);

    // Użycie procedury do kaskadowego usuwania kursu
    await pool.query(`CALL obscure_cleanup_proc($1)`, [id]);

    res.status(200).json({ message: 'Course deleted successfully (via procedure)' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  try {
    console.info(`Fetching elements for course with ID: ${courseId}`);

    // Pobierz elementy kursu
    const elementsResult = await pool.query(
      `
      SELECT * FROM "CourseElements" 
      WHERE "courseId" = $1
      ORDER BY "order"
    `,
      [courseId],
    );

    const courseElements = elementsResult.rows;

    // Jeśli nie ma elementów, zwróć pustą tablicę
    if (courseElements.length === 0) {
      return res.status(200).json([]);
    }

    // Pobierz style dla tych elementów
    const elementIds = courseElements.map((el) => el.id);
    const stylesResult = await pool.query(
      `
      SELECT * FROM "ElementsStyle" 
      WHERE "courseElementId" = ANY($1::bigint[])
    `,
      [elementIds],
    );

    const styles = stylesResult.rows;

    // Mapuj style do odpowiednich elementów
    const courseElementsWithStyles = courseElements.map((element) => {
      const elementStyles = styles.filter((style) => style.courseElementId === element.id);
      return { ...element, styles: elementStyles };
    });

    res.status(200).json(courseElementsWithStyles);
  } catch (error) {
    console.error('Error fetching course elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNextCourseElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { type, content, order } = req.body;
  try {
    console.info('Creating a new course element...');

    const result = await pool.query(
      `
      INSERT INTO "CourseElements" ("courseId", type, content, "order") 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `,
      [courseId, type, content, order || 0],
    );

    const newElement = result.rows[0];
    res.status(201).json(newElement);
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

    const result = await pool.query(
      `
      UPDATE "CourseElements" 
      SET type = $1, content = $2 
      WHERE id = $3 
      RETURNING *
    `,
      [type, content, elementId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course element not found' });
    }

    const updatedElement = result.rows[0];
    res.status(200).json(updatedElement);
  } catch (error) {
    console.error('Error updating course element:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourseElement = async (req: Request, res: Response) => {
  const { elementId } = req.params;
  const client = await pool.connect();
  try {
    console.info(`Deleting course element with ID: ${elementId}`);

    await client.query('BEGIN');

    // Najpierw usuń powiązane style
    await client.query(
      `
      DELETE FROM "ElementsStyle" 
      WHERE "courseElementId" = $1
    `,
      [elementId],
    );

    // Następnie usuń element
    const result = await client.query(
      `
      DELETE FROM "CourseElements" 
      WHERE id = $1 
      RETURNING id
    `,
      [elementId],
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course element not found' });
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Course element deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting course element:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const setCoursesElements = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { elements: newElements } = req.body;

  const client = await pool.connect();
  try {
    console.info(`Setting course elements for course ID: ${courseId}`);

    await client.query('BEGIN');

    // Pobierz istniejące elementy kursu
    const existingResult = await client.query(
      `
      SELECT id FROM "CourseElements" 
      WHERE "courseId" = $1
    `,
      [courseId],
    );

    const existingElementIds = existingResult.rows.map((row) => row.id);

    // Identyfikuj elementy do usunięcia (te, które są w bazie, ale nie w żądaniu)
    const newElementIds = newElements
      .filter((e: { id?: string | number }) => e.id)
      .map((e: { id?: string | number }) => e.id!.toString());

    const elementsToDelete = existingElementIds.filter(
      (id) => !newElementIds.includes(id.toString()),
    );

    // Usuń elementy nieobecne w żądaniu
    if (elementsToDelete.length > 0) {
      // Usuń powiązane style
      await client.query(
        `
        DELETE FROM "ElementsStyle" 
        WHERE "courseElementId" = ANY($1::bigint[])
      `,
        [elementsToDelete],
      );

      // Usuń elementy
      await client.query(
        `
        DELETE FROM "CourseElements" 
        WHERE id = ANY($1::bigint[])
      `,
        [elementsToDelete],
      );
    }

    // Aktualizuj lub dodaj nowe elementy
    const processedElements = [];
    for (const element of newElements) {
      let result;

      if (element.id && existingElementIds.includes(Number(element.id))) {
        // Aktualizacja istniejącego elementu
        result = await client.query(
          `
          UPDATE "CourseElements" 
          SET type = $1, content = $2, "order" = $3 
          WHERE id = $4 
          RETURNING *
        `,
          [element.type, element.content, element.order || 0, element.id],
        );
      } else {
        // Dodanie nowego elementu
        result = await client.query(
          `
          INSERT INTO "CourseElements" ("courseId", type, content, "order") 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `,
          [courseId, element.type, element.content, element.order || 0],
        );
      }

      const processedElement = result.rows[0];
      processedElements.push(processedElement);

      // Obsługa stylów dla tego elementu
      if (element.styles && element.styles.length > 0) {
        const style = element.styles[0];

        // Sprawdź czy styl już istnieje dla tego elementu
        const styleResult = await client.query(
          `
          SELECT id FROM "ElementsStyle" 
          WHERE "courseElementId" = $1
        `,
          [processedElement.id],
        );

        if (styleResult.rows.length > 0) {
          // Aktualizacja stylu
          await client.query(
            `
            UPDATE "ElementsStyle" 
            SET "isBold" = $1, "isItalic" = $2, "isUnderline" = $3, 
                "hasHighlight" = $4, "color" = $5, "fontSize" = $6 
            WHERE id = $7
          `,
            [
              style.isBold || false,
              style.isItalic || false,
              style.isUnderline || false,
              style.hasHighlight || false,
              style.color || null,
              style.fontSize || null,
              styleResult.rows[0].id,
            ],
          );
        } else {
          // Utworzenie nowego stylu
          await client.query(
            `
            INSERT INTO "ElementsStyle" 
            ("courseElementId", "isBold", "isItalic", "isUnderline", "hasHighlight", "color", "fontSize") 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
            [
              processedElement.id,
              style.isBold || false,
              style.isItalic || false,
              style.isUnderline || false,
              style.hasHighlight || false,
              style.color || null,
              style.fontSize || null,
            ],
          );
        }
      }
    }

    await client.query('COMMIT');

    // Pobierz zaktualizowane elementy wraz ze stylami
    if (!courseId) {
      throw new Error('courseId is required');
    }
    const response = await getCourseElementsWithStyles(courseId);
    res.status(200).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting course elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const uploadImageForCourseElement = async (req: RequestWithUser, res: Response) => {
  const { elementId } = req.params;
  const client = await pool.connect();

  try {
    if (!elementId) {
      return res.status(400).json({ error: 'Brak ID elementu kursu.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku do przesłania.' });
    }

    await client.query('BEGIN');

    // Sprawdź czy element istnieje i czy jest typu IMAGE
    const elementResult = await client.query(
      `
      SELECT * FROM "CourseElements" 
      WHERE id = $1
    `,
      [elementId],
    );

    if (elementResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Element kursu nie został znaleziony.' });
    }

    const element = elementResult.rows[0];

    if (element.type !== 'IMAGE') {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'Tylko elementy typu IMAGE mogą mieć przypisane zdjęcia.' });
    }

    // Pobieranie informacji o pliku
    const { filename, originalname, mimetype, size, path: filePath } = req.file;

    // Pobieranie ID użytkownika z sesji/tokenu
    const user = req.user as { id: string | number | bigint };
    const userId = user.id;

    // Folder uploads znajduje się w głównym katalogu projektu
    const uploadDir = path.join(__dirname, '../../uploads');

    // Względna ścieżka dla dostępu przez API
    const relativePath = path.relative(uploadDir, filePath);
    const apiPath = `/uploads/${relativePath}`;

    // Zapisanie metadanych pliku do bazy danych
    const fileUploadResult = await client.query(
      `
      INSERT INTO "FileUploads" (filename, "originalName", path, "mimeType", size, "userId")
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `,
      [filename, originalname, apiPath, mimetype, size, userId],
    );

    const fileUpload = fileUploadResult.rows[0];

    // Aktualizujemy element kursu, aby zawierał URL do zdjęcia
    const imageUrl = `${req.protocol}://${req.get('host')}${apiPath}`;

    const additionalData = JSON.stringify({
      fileId: fileUpload.id.toString(),
      originalName: originalname,
      mimeType: mimetype,
    });

    await client.query(
      `
      UPDATE "CourseElements" 
      SET content = $1, "additionalData" = $2::jsonb 
      WHERE id = $3
    `,
      [imageUrl, additionalData, elementId],
    );

    await client.query('COMMIT');

    // Przygotowanie odpowiedzi z URL do pliku
    const responseData = {
      id: fileUpload.id,
      elementId,
      url: imageUrl,
      originalName: fileUpload.originalName,
      mimeType: fileUpload.mimeType,
      size: fileUpload.size,
    };

    return res.status(201).json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading image for course element:', error);
    return res
      .status(500)
      .json({ error: 'Wystąpił błąd podczas przesyłania zdjęcia dla elementu kursu.' });
  } finally {
    client.release();
  }
};

// Funkcja pomocnicza do pobierania elementów kursu wraz ze stylami
async function getCourseElementsWithStyles(courseId: string | number) {
  // Pobierz elementy kursu
  const elementsResult = await pool.query(
    `
    SELECT * FROM "CourseElements" 
    WHERE "courseId" = $1
    ORDER BY "order"
  `,
    [courseId],
  );

  const courseElements = elementsResult.rows;

  // Jeśli nie ma elementów, zwróć pustą tablicę
  if (courseElements.length === 0) {
    return [];
  }

  // Pobierz style dla tych elementów
  const elementIds = courseElements.map((el) => el.id);
  const stylesResult = await pool.query(
    `
    SELECT * FROM "ElementsStyle" 
    WHERE "courseElementId" = ANY($1::bigint[])
  `,
    [elementIds],
  );

  const styles = stylesResult.rows;

  // Mapuj style do odpowiednich elementów
  return courseElements.map((element) => {
    const elementStyles = styles.filter((style) => style.courseElementId === element.id);
    return { ...element, styles: elementStyles };
  });
}

const getCourseCategories = async (courseId: string | number) => {
  try {
    console.info('Fetching course categories...');
    const result = await pool.query(
      `
      SELECT c.* FROM "Categories" c
      JOIN "_CourseCategories" cc ON cc."A" = c.id
      WHERE cc."B" = $1
    `,
      [courseId],
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching course categories:', error);
    return [];
  }
};

const getCourseStudentCount = async (courseId: string | number) => {
  try {
    console.info('Fetching course student count...');
    const result = await pool.query(
      `
      SELECT COUNT(*)::int as count 
      FROM "Enrollments" 
      WHERE "courseId" = $1
    `,
      [courseId],
    );

    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching course student count:', error);
    return 0;
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    console.info('Fetching all categories...');
    const result = await pool.query(`SELECT * FROM "Categories"`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
