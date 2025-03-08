import abpUserConfigurationController from '@/controllers/abpUserConfiguration.controller';
import { Router } from 'express';

const abpUserConfigurationRouter: ReturnType<typeof Router> = Router();

abpUserConfigurationRouter.get('/GetAll', abpUserConfigurationController.GetAll);

export default abpUserConfigurationRouter;
