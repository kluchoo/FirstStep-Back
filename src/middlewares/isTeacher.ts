import type { NextFunction, Request, Response } from 'express';

export const isTeacher = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { role: string };

  if (user.role !== 'teacher') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  console.info('User role is teacher, proceeding to next middleware.');
  next();
};
export default isTeacher;
