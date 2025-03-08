import scheduleData from '@/controllers/services/app/scheduleData/scheduleData.controller';
import { Router } from 'express';

const scheduleDataRouter: ReturnType<typeof Router> = Router();

scheduleDataRouter.get('/GetMyClassSchedule', scheduleData.getMyClassSchedule);

export default scheduleDataRouter;
