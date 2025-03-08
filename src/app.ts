import { errorNotFound } from '@/errorHandling';
import { morganCustomDevFormatMiddleware } from '@/middleware/morgan';
import apiRouter from '@/routes/router';
import express from 'express';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a',
});

export const app: ReturnType<typeof express> = express();

app.use(morganCustomDevFormatMiddleware);
app.use(morgan('combined', { stream: logStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', apiRouter);
app.use(errorNotFound);
