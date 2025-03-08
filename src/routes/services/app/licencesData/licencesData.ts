import licencesData from '@/controllers/services/app/licencesData/licencesData.controller';
import { Router } from 'express';

const licencesDataRouter: ReturnType<typeof Router> = Router();

licencesDataRouter.get('/GetAllLicences', licencesData.getAllLicences);

export default licencesDataRouter;
