import cors from 'cors';
import express from 'express';
import fs from 'fs';
// import https from 'https';
import path, { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
// import { generateSwagger } from './autogen';
import type { NextFunction, Request, Response } from 'express';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
// import limiter from './middlewares/rateLimitMiddleware';
import aiRouters from './routers/aiRouters';
import authRoutes from './routers/authRoutes';
import coursesRouters from './routers/coursesRouters.js';
import fileRoutes from './routers/fileRoutes.js';

// Generowanie Swaggera
// generateSwagger();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ścieżka do pliku Swaggera
const swaggerFilePath = path.join(__dirname, 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf-8'));
const theme = new SwaggerTheme();

const options = {
  customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
};
const corsOptions = {
  origin: '*',
  // + FRONT_PORT,
  optionsSuccessStatus: 200,
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
// Zwiększenie limitu rozmiaru ciała żądania
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Konfiguracja dostępu do plików statycznych z katalogu uploads
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Ignorowanie weryfikacji certyfikatu SSL (tylko do testów lokalnych)
// const agent = new https.Agent({
//   rejectUnauthorized: false, // Ignoruj błędy certyfikatu
// });

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('ip:', req.ip);
  next();
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
// app.use(limiter);

// Logowanie i rejestracja
app.use('/auth', authRoutes);

// AI
app.use('/ai', aiRouters);

// kursy
app.use('/courses', coursesRouters);

// pliki
app.use('/files', fileRoutes);

// filepath: /home/dominik/firststep-back/src/index.ts
if (!process.env.PORT) {
  console.error('PORT environment variable is not set. Please set it in your .env file.');
  process.exit(1); // Exit the process with an error code
}

app.listen(`0.0.0.0:${process.env.PORT}`, () => {
  console.log(`Server is running on http://0.0.0.0:${process.env.PORT}`);
});
// ...existing code...
// Uruchom serwer HTTPS
// const PORT = process.env.PORT || 8443; // Domyślny port HTTPS to 443
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`secured server running on https://localhost:${PORT}`);
// });
