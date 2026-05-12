import { Router } from 'express';
import { createTelemetryReading, getTireTelemetry } from '../controllers/telemetryController';

const router = Router();

router.post('/', createTelemetryReading);
router.get('/tire/:tire_fire_mark', getTireTelemetry);

export default router;
