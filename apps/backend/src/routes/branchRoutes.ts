import { Router } from 'express';
import { getBranches, createBranch } from '../controllers/branchController';

const router = Router();

router.get('/', getBranches);
router.post('/', createBranch);

export default router;
