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
import { isAnyRoles } from '@/middlewares/isAnyRoles';
import { Router } from 'express';

const router: Router = Router();

router.get('/', authenticateToken, isAnyRoles, getAllCourses);
router.get('/id/:id', authenticateToken, isAnyRoles, getCourseById);
router.get('/:nickname', authenticateToken, isAnyRoles, getUserCourses);
router.post('/', authenticateToken, isAnyRoles, createCourse);
router.put('/:id', authenticateToken, isAnyRoles, updateCourse);
router.delete('/:id', authenticateToken, isAnyRoles, deleteCourse);

router.get('/:courseId/elements', authenticateToken, isAnyRoles, getCourseElements);
router.put('/:courseId/elements', authenticateToken, isAnyRoles, setCoursesElements);

export default router;
