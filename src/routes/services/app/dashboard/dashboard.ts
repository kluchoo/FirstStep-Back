import dashboard from '@/controllers/services/app/dashboard/dashboard.controller';
import { Router } from 'express';

const dashboardRouter: ReturnType<typeof Router> = Router();

dashboardRouter.get('/GetDashboard', dashboard.getDashboard);

export default dashboardRouter;
