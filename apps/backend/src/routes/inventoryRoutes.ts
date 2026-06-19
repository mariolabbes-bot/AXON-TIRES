import { Router } from 'express';
import { createInventoryAudit, getInventoryBreakdown } from '../controllers/inventoryController';

const router = Router();

router.get('/breakdown/:branch_id', getInventoryBreakdown);
router.post('/', createInventoryAudit);

export default router;
