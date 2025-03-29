import { Router } from 'express';
import { askAi } from '../controllers/aiControlers';

const router = Router();

router.post('/ask', askAi);

export default router;
