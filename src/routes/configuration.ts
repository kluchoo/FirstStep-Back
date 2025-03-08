import configurationController from '@/controllers/configuration.controller';
import { Router } from 'express';

const configurationRouter: ReturnType<typeof Router> = Router();

configurationRouter.get('/GetMsConf', configurationController.getMsConf);

export default configurationRouter;
