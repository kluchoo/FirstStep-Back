import {
  createTestRaw,
  getQuestionsByTestId,
  getTestAnswersByTestId,
  getTestById,
  getTests,
  updateAnswersForTest,
  updateQuestionsForTest,
} from '@/controllers/testsControlers';
import { authenticateToken } from '@/middlewares/authMiddleware.js';
import { isAnyRoles } from '@/middlewares/roles/isAnyRoles';
import express from 'express';

const router = express.Router();

router.use(authenticateToken, isAnyRoles);

router.get('/', getTests);

router.get('/:id', getTestById);

router.post('/', createTestRaw);

router.get('/:id/questions', getQuestionsByTestId);
router.get('/:id/answers', getTestAnswersByTestId);
router.put('/:id/questions', updateQuestionsForTest);
router.put('/:id/answers', updateAnswersForTest);

export default router;
