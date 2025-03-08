import ms from '@/controllers/services/app/ms/ms.controller';
import { Router } from 'express';

const msRouter: ReturnType<typeof Router> = Router();

msRouter.get('/GetCoursesOfStudy', ms.getCoursesOfStudy);

export default msRouter;
