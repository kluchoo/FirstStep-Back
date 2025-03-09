// src/index.ts
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
// import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { generateSwagger } from './autogen';

//swager opcje
generateSwagger();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//swager opcje

const swaggerFilePath = path.join(__dirname, 'swagger.json');

// Read the Swagger JSON file
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf-8'));

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.post('/api/users', async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.create({
    data: {
      email,
    },
  });
  res.json(user);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
