import { Router } from 'express';
import { getTires, createTire, updateTireState } from '../controllers/tireController';

const router = Router();

router.get('/', getTires);
router.post('/', createTire);
router.patch('/:fire_mark_id/state', updateTireState);

export default router;
