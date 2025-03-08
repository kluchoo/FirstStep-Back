import type { Request, Response } from 'express';

export const errorNotFound = (req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found!' });
  return;
};
