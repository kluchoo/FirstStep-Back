import cors from 'cors';
import express from 'express';
import fs from 'fs';
// import https from 'https';
import path, { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
// import { generateSwagger } from './autogen';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import limiter from './middlewares/rateLimitMiddleware';
import aiRouters from './routers/aiRouters';
import authRoutes from './routers/authRoutes';
import coursesRouters from './routers/coursesRouters.js';

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

const app = express();
app.use(cors());
app.use(express.json());

// Ignorowanie weryfikacji certyfikatu SSL (tylko do testów lokalnych)
// const agent = new https.Agent({
//   rejectUnauthorized: false, // Ignoruj błędy certyfikatu
// });

// Wczytaj certyfikaty SSL
// const sslOptions = {
//   key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')), // Ścieżka do klucza prywatnego
//   cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')), // Ścieżka do certyfikatu
// };

// app.use((req, res, next) => {
//   if (!req.secure) {
//     return res.redirect(`http://${req.headers.host}${req.url}`);
//   }
//   next();
// });

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
app.use(limiter);

// Logowanie i rejestracja
app.use('/auth', authRoutes);

// AI
app.use('/ai', aiRouters);

// kursy
app.use('/courses', coursesRouters);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

// Uruchom serwer HTTPS
// const PORT = process.env.PORT || 8443; // Domyślny port HTTPS to 443
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`secured server running on https://localhost:${PORT}`);
// });
