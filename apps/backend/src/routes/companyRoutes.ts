import { Router } from 'express';
import { bulkOnboard } from '../controllers/companyController';

const router = Router();

router.post('/onboard', bulkOnboard);

export default router;
