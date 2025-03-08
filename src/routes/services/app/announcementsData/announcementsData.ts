import getAnnouncements from '@/controllers/services/app/getAnnouncements/getAnnouncements.controller';
import { Router } from 'express';

const annoucementsDataRouter: ReturnType<typeof Router> = Router();

annoucementsDataRouter.get('/GetAnnouncementsList', getAnnouncements.getAnnouncementsList);
annoucementsDataRouter.get('/GetAnnouncement', getAnnouncements.getAnnouncement);
annoucementsDataRouter.get('/GetAttachmentBytes', getAnnouncements.getAttachmentBytes);

export default annoucementsDataRouter;
