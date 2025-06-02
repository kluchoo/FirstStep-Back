import { authenticateToken } from '@/middlewares/authMiddleware';
import type { RequestWithUser } from '@/types/requestWithUser';
import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/authenticate', authenticateToken, async (req: RequestWithUser, res) => {
  res.json(req.user);
});

export default router;
