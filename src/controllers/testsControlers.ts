// import type { RequestWithUser } from '@/types/requestWithUser';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { Pool } from 'pg';

const prisma = new PrismaClient();

// Konfiguracja połączenia z PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(/^"|"$/g, ''),
});

export const getTests = async (req: Request, res: Response) => {
  try {
    const tests = await prisma.tests.findMany({});
    if (tests.length === 0) {
      return res.status(404).json({ message: 'No tests found' });
    }

    // Konwersja BigInt na string
    const serializedTests = tests.map((test) => {
      return JSON.parse(
        JSON.stringify(test, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
    });

    res.status(200).json(serializedTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTestById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const test = await prisma.tests.findUnique({
      where: { id: Number(id) },
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Konwersja BigInt na string
    const serializedTest = JSON.parse(
      JSON.stringify(test, (key, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );

    res.status(200).json(serializedTest);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTestRaw = async (req: Request, res: Response) => {
  const { creatorId, courseId, title, duration } = req.body;
  if (!creatorId || !courseId || !title || !duration) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO "Tests" ("creatorId", "courseId", title, duration)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [creatorId, courseId, title, duration];
    const result = await pool.query(query, values);
    const test = result.rows[0];

    // Aktualizuj Courses o nowy test
    await pool.query('UPDATE "Courses" SET "testId" = $1 WHERE id = $2', [test.id, courseId]);

    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test (raw):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQuestionsByTestId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT * FROM "TestQuestions" WHERE "testId" = $1;
    `;
    const values = [Number(id)];
    const result = await pool.query(query, values);
    const questions = result.rows;

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this test' });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions (raw):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTestAnswersByTestId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT a.* FROM "TestAnswers" a
      JOIN "TestQuestions" q ON a."questionId" = q.id
      WHERE q."testId" = $1;
    `;
    const values = [Number(id)];
    const result = await pool.query(query, values);
    const answers = result.rows;

    if (answers.length === 0) {
      return res.status(404).json({ message: 'No answers found for this test' });
    }

    res.status(200).json(answers);
  } catch (error) {
    console.error('Error fetching answers (raw):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateQuestionsForTest = async (req: Request, res: Response) => {
  const { id } = req.params; // id testu
  const { questions } = req.body; // lista pytań (każde: id?, content, questionType, points, order)

  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Pobierz istniejące pytania dla testu
    const existingRes = await client.query('SELECT id FROM "TestQuestions" WHERE "testId" = $1', [
      Number(id),
    ]);
    const existingIds = existingRes.rows.map((row) => String(row.id));
    const sentIds = questions.filter((q) => q.id).map((q) => String(q.id));

    // Usuń pytania, których nie ma w nowej liście
    const toDelete = existingIds.filter((qid) => !sentIds.includes(qid));
    if (toDelete.length > 0) {
      // Usuń powiązane odpowiedzi do usuwanych pytań
      await client.query(`DELETE FROM "TestAnswers" WHERE "questionId" = ANY($1::bigint[])`, [
        toDelete,
      ]);
      await client.query(`DELETE FROM "TestQuestions" WHERE id = ANY($1::bigint[])`, [toDelete]);
    }

    // Aktualizuj istniejące i dodaj nowe pytania
    for (const q of questions) {
      if (q.id && existingIds.includes(String(q.id))) {
        // Aktualizacja
        await client.query(
          `UPDATE "TestQuestions" SET content = $1, "questionType" = $2, points = $3, "order" = $4 WHERE id = $5`,
          [q.content, q.questionType, q.points, q.order, q.id],
        );
      } else {
        // Dodanie nowego pytania
        await client.query(
          `INSERT INTO "TestQuestions" ("testId", content, "questionType", points, "order") VALUES ($1, $2, $3, $4, $5)`,
          [Number(id), q.content, q.questionType, q.points, q.order],
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Questions updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateAnswersForTest = async (req: Request, res: Response) => {
  const { id } = req.params; // id testu
  const { answers } = req.body; // lista odpowiedzi (każda: id?, questionId, content, isCorrect, order)

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Pobierz wszystkie id pytań dla testu
    const questionsRes = await client.query('SELECT id FROM "TestQuestions" WHERE "testId" = $1', [
      Number(id),
    ]);
    const questionIds = questionsRes.rows.map((row) => String(row.id));

    // Pobierz istniejące odpowiedzi dla tych pytań
    const existingRes = await client.query(
      'SELECT id FROM "TestAnswers" WHERE "questionId" = ANY($1::bigint[])',
      [questionIds],
    );
    const existingIds = existingRes.rows.map((row) => String(row.id));
    const sentIds = answers.filter((a) => a.id).map((a) => String(a.id));

    // Usuń odpowiedzi, których nie ma w nowej liście
    const toDelete = existingIds.filter((aid) => !sentIds.includes(aid));
    if (toDelete.length > 0) {
      await client.query('DELETE FROM "TestAnswers" WHERE id = ANY($1::bigint[])', [toDelete]);
    }

    // Aktualizuj istniejące i dodaj nowe odpowiedzi
    for (const a of answers) {
      if (a.id && existingIds.includes(String(a.id))) {
        // Aktualizacja
        await client.query(
          'UPDATE "TestAnswers" SET "questionId" = $1, content = $2, "isCorrect" = $3, "order" = $4 WHERE id = $5',
          [a.questionId, a.content, a.isCorrect, a.order, a.id],
        );
      } else {
        // Dodanie nowej odpowiedzi
        await client.query(
          'INSERT INTO "TestAnswers" ("questionId", content, "isCorrect", "order") VALUES ($1, $2, $3, $4)',
          [a.questionId, a.content, a.isCorrect, a.order],
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Answers updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
