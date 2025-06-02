import { authenticateToken } from '@/middlewares/authMiddleware.js';
import { isAnyRoles } from '@/middlewares/roles/isAnyRoles';
import express from 'express';
import { deleteFile, getUserFiles, upload, uploadFile } from '../controllers/fileController.js';

const router = express.Router();

router.use(authenticateToken, isAnyRoles);

router.post('/upload', isAnyRoles, upload.single('file'), uploadFile);

router.get('/', isAnyRoles, getUserFiles);

router.delete('/:id', isAnyRoles, deleteFile);

export default router;
