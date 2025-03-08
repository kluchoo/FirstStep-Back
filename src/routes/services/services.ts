import { Router } from 'express';
import appRouter from './app/app';

const servicesRouter: ReturnType<typeof Router> = Router();

servicesRouter.use('/app', appRouter);

export default servicesRouter;
