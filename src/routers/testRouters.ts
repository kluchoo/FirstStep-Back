import { getTestById, getTests } from '@/controllers/testsControlers';
import { authenticateToken } from '@/middlewares/authMiddleware.js';
import { isAnyRoles } from '@/middlewares/roles/isAnyRoles';
import express from 'express';

const router = express.Router();

router.use(authenticateToken, isAnyRoles);

router.get('/', getTests);

router.get('/:id', getTestById);

export default router;
