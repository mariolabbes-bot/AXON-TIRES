import { Router } from 'express';
import { createCheckpoint, getVehicleCheckpoints } from '../controllers/checkpointController';

const router = Router();

router.post('/', createCheckpoint);
router.get('/vehicle/:vehicle_id', getVehicleCheckpoints);

export default router;
