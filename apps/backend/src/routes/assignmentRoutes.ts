import { Router } from 'express';
import { 
  createTireAssignment, endTireAssignment,
  createAssetAssignment, endAssetAssignment
} from '../controllers/assignmentController';

const router = Router();

// Tire Assignments
router.post('/tire', createTireAssignment);
router.post('/tire/:assignment_id/end', endTireAssignment);

// General Asset Assignments
router.post('/asset', createAssetAssignment);
router.post('/asset/:assignment_id/end', endAssetAssignment);

export default router;
