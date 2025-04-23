import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCourseElements,
  getUserCourses,
  setCoursesElements,
  updateCourse,
} from '@/controllers/coursesControlers';
import { authenticateToken } from '@/middlewares/authMiddleware';
import { isYourCourse } from '@/middlewares/isYourCouse';
import { isAdminRole } from '@/middlewares/roles/isAdmin';
import { isAnyRoles } from '@/middlewares/roles/isAnyRoles';
import { isTeacherRole } from '@/middlewares/roles/isTeacher';
import { Router } from 'express';

const router: Router = Router();
router.use(authenticateToken, isAnyRoles); // Apply authentication and role check middleware to all routes

router.get('/', isTeacherRole, getAllCourses);
router.get('/id/:id', getCourseById);
router.get('/:nickname', getUserCourses);
router.post('/', isTeacherRole, createCourse);
router.put('/:id', isTeacherRole, isYourCourse, updateCourse);
router.delete('/:id', isTeacherRole, isYourCourse, deleteCourse);

router.get('/:courseId/elements', getCourseElements);
router.put('/:courseId/elements', isTeacherRole, isYourCourse, setCoursesElements);

export default router;
