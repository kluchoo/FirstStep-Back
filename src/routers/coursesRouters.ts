import {
  createCourse,
  deleteCourse,
  getAllCategories,
  getAllCourses,
  getCourseById,
  getCourseElements,
  getUserCourses,
  setCoursesElements,
  updateCourse,
  uploadImageForCourseElement,
} from '@/controllers/coursesControlers';
import { authenticateToken } from '@/middlewares/authMiddleware.js';
import { isYourCourse } from '@/middlewares/isYourCouse';
// import { isAdminRole } from '@/middlewares/roles/isAdmin';
import { isAnyRoles } from '@/middlewares/roles/isAnyRoles';
import { isTeacherRole } from '@/middlewares/roles/isTeacher';
import { Router } from 'express';
import { upload } from '../controllers/fileController.js';

const router: Router = Router();
router.use(authenticateToken, isAnyRoles); // Apply isAnyRoles and isAdminRole middleware to all routes

router.get('/', getAllCourses);
router.get('/id/:id', getCourseById);
router.get('/categories', getAllCategories);
router.get('/:nickname', getUserCourses);
router.post('/', isTeacherRole, createCourse);
router.put('/:id', isTeacherRole, isYourCourse, updateCourse);
router.delete('/:id', isTeacherRole, isYourCourse, deleteCourse);

router.get('/:courseId/elements', getCourseElements);
router.put('/:courseId/elements', isTeacherRole, isYourCourse, setCoursesElements);

// Nowy endpoint do przesyłania zdjęć dla elementów kursu
router.post(
  '/elements/:elementId/image',
  isTeacherRole,
  upload.single('image'),
  uploadImageForCourseElement,
);

export default router;
