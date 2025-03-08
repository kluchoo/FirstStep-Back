import { Router } from 'express';
import announcementsDataRouter from './announcementsData/announcementsData';
import buildingsClassroomDataRouter from './buildingsClassroomsData/buildingsClassroomsData';
import dashboardRouter from './dashboard/dashboard';
import licencesDataRouter from './licencesData/licencesData';
import msRouter from './ms/ms';
import scheduleDataRouter from './scheduleData/scheduleData';
import sessionMSRouter from './sessionMS/sessionMS';

const appRouter: ReturnType<typeof Router> = Router();

appRouter.use('/SessionMS', sessionMSRouter);
appRouter.use('/BuildingsClassroomsData', buildingsClassroomDataRouter);
appRouter.use('/MS', msRouter);
appRouter.use('/AnnouncementsData', announcementsDataRouter);
appRouter.use('/Dashboard', dashboardRouter);
appRouter.use('/LicencesData', licencesDataRouter);
appRouter.use('/ScheduleData', scheduleDataRouter);

export default appRouter;
