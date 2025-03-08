import getBuildings from '@/controllers/services/app/buildingsClassroomData/buildingsClassroomData.controller';
import { Router } from 'express';

const buildingsClassroomDataRouter: ReturnType<typeof Router> = Router();

buildingsClassroomDataRouter.get('/GetBuildings', getBuildings.getBuildings);

export default buildingsClassroomDataRouter;
