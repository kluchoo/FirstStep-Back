import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  throw new Error('SECRET_KEY is not configured');
}
const iv = Buffer.alloc(16, 0);

export const decryptPassword = (encryptedPassword: string): string => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey as string), iv);
  let decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const register = async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // const hashedPassword = await bcrypt.hash(decryptPassword(password), 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname,
        lastLoginDate: new Date(),
        role: 'STUDENT', // Default role
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    // Konwertuj BigInt na string
    const userPayload = {
      ...userWithoutPassword,
      id: user.id.toString(),
    };

    res.status(201).json(userPayload);
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('email:', email);

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // const decoded = decryptPassword(password);
    const decoded = password;

    const isPasswordValid = await bcrypt.compare(decoded, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    // Konwertuj BigInt na string
    const userPayload = {
      ...userWithoutPassword,
      id: user.id.toString(),
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage,
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
};
