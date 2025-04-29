import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicjalizacja klienta Prisma
const prisma = new PrismaClient();

// Konfiguracja przechowywania plików
const uploadDir = path.join(__dirname, '../../uploads');

// Upewnij się, że katalog uploads istnieje
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfiguracja multer dla przechowywania plików
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generowanie unikalnej nazwy pliku z zachowaniem rozszerzenia
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Filtr dla plików - akceptujemy tylko obrazy
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Niedozwolony typ pliku. Akceptowane są tylko obrazy.'));
  }
};

// Konfiguracja multer z filtrem i limitem wielkości
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Kontroler do przesyłania plików
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku do przesłania.' });
    }

    // Pobieranie informacji o pliku
    const { filename, originalname, mimetype, size, path: filePath } = req.file;

    // Pobieranie ID użytkownika z sesji/tokenu
    const userId = req.user.id; // Z middleware autoryzacji
    console.log('userId', userId);

    // Sprawdzenie czy userId istnieje
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Użytkownik niezalogowany. Aby przesłać plik, musisz być zalogowany.' });
    }

    // Względna ścieżka dla dostępu przez API
    const relativePath = path.relative(uploadDir, filePath);
    const apiPath = `/uploads/${relativePath}`;

    // Zapisanie metadanych pliku do bazy danych
    const fileUpload = await prisma.fileUploads.create({
      data: {
        filename,
        originalName: originalname,
        path: apiPath,
        mimeType: mimetype,
        size,
        userId: BigInt(userId),
      },
    });

    // Przygotowanie odpowiedzi z URL do pliku
    const fileData = {
      id: fileUpload.id.toString(),
      filename: fileUpload.filename,
      originalName: fileUpload.originalName,
      url: `${req.protocol}://${req.get('host')}${apiPath}`,
      mimeType: fileUpload.mimeType,
      size: fileUpload.size,
      uploadDate: fileUpload.uploadDate,
    };

    return res.status(201).json(fileData);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas przesyłania pliku.' });
  }
};

// Kontroler do pobierania listy plików użytkownika
export const getUserFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Z middleware autoryzacji

    // Sprawdzenie czy userId istnieje
    if (!userId) {
      return res.status(401).json({
        error: 'Użytkownik niezalogowany. Aby pobrać listę plików, musisz być zalogowany.',
      });
    }

    const files = await prisma.fileUploads.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: {
        uploadDate: 'desc',
      },
    });

    // Serializacja BigInt i dodanie pełnych URL
    const serializableFiles = files.map((file) => ({
      id: file.id.toString(),
      filename: file.filename,
      originalName: file.originalName,
      url: `${req.protocol}://${req.get('host')}${file.path}`,
      mimeType: file.mimeType,
      size: file.size,
      uploadDate: file.uploadDate,
    }));

    return res.status(200).json(serializableFiles);
  } catch (error) {
    console.error('Error fetching user files:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas pobierania plików.' });
  }
};

// Kontroler do usuwania pliku
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Z middleware autoryzacji

    // Sprawdzenie czy userId istnieje
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Użytkownik niezalogowany. Aby usunąć plik, musisz być zalogowany.' });
    }

    // Znajdź plik, upewniając się, że należy do zalogowanego użytkownika
    const file = await prisma.fileUploads.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId),
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'Plik nie został znaleziony.' });
    }

    // Ścieżka do pliku w systemie plików
    const filePath = path.join(uploadDir, path.basename(file.path));

    // Usunięcie pliku z systemu plików
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Usunięcie rekordu z bazy danych
    await prisma.fileUploads.delete({
      where: {
        id: BigInt(id),
      },
    });

    return res.status(200).json({ message: 'Plik został pomyślnie usunięty.' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas usuwania pliku.' });
  }
};
