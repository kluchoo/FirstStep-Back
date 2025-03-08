import authController from '@/controllers/auth.controller';
import { Router } from 'express';

const authRouter: ReturnType<typeof Router> = Router();

authRouter.post('/Authenticate', authController.authenticate);

export default authRouter;
