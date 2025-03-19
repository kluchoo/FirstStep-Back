import { Router } from 'express';
import { askAi } from '../controllers/aiControlers';

const router = Router();

router.get('/ask', askAi);

export default router;
