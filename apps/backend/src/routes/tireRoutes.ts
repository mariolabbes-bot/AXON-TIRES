import { Router } from 'express';
import { getTires, updateTireState, massUpdateTires } from '../controllers/tireController';

const router = Router();

router.get('/', getTires);
router.patch('/mass-update', massUpdateTires);
router.patch('/:fire_mark_id/state', updateTireState);

export default router;
