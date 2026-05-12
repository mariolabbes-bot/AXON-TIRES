import { Router } from 'express';
import { createAssignment, endAssignment } from '../controllers/assignmentController';

const router = Router();

router.post('/', createAssignment);
router.post('/:assignment_id/end', endAssignment);

export default router;
