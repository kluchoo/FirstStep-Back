import { Router } from 'express';
import abpUserConfigurationRouter from './abpUserConfigurationRouter';
import configurationRouter from './configuration';
import servicesRouter from './services/services';
import tokenAuthRouter from './tokenAuth';
import userPhotosRouter from './userPhotos';

const router: ReturnType<typeof Router> = Router();

router.use('/api/TokenAuth', tokenAuthRouter);
router.use('/api/services', servicesRouter);
router.use('/api/UserPhotos', userPhotosRouter);
router.use('/api/Configuration', configurationRouter);
router.use('/AbpUserConfiguration', abpUserConfigurationRouter);

export default router;
