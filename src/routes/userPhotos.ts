import userPhotosController from '@/controllers/userPhotos.controller';
import { Router } from 'express';

const userPhotosRouter: ReturnType<typeof Router> = Router();

userPhotosRouter.get('/GetPersonPictureAsync', userPhotosController.getPersonPictureAsync);

export default userPhotosRouter;
