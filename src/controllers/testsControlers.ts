// import type { RequestWithUser } from '@/types/requestWithUser';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

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
