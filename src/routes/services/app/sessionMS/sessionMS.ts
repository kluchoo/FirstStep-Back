import SessionMSController from '@/controllers/services/app/sessionMS/sessionMS.controller';
import { Router } from 'express';

const sessionMSRouter: ReturnType<typeof Router> = Router();

sessionMSRouter.get(
  '/GetCurrentLoginInformationsMS',
  SessionMSController.getCurrentLoginInformation,
);

export default sessionMSRouter;
