import { authenticateToken } from '@/middlewares/authMiddleware';
import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/authenticate', authenticateToken, async (req, res) => {
  res.json(req.user);
});

export default router;
