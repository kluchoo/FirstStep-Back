import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existingUser = await prisma.Users.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nickname: email.split('@')[0],
        lastLoginDate: new Date(),
        role: 'STUDENT', // Default role
      },
    });

    const userWithoutPassword = { ...user, haslo: undefined };

    // Konwertuj BigInt na string
    const userResponse = {
      ...userWithoutPassword,

      id: user.id.toString(),
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('email:', email);
  console.log('password:', password);
  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User:', user);
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
