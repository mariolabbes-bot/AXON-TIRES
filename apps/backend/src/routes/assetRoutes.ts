import { Router } from 'express';
import { getAssets, updateAssetState } from '../controllers/assetController';

const router = Router();

router.get('/', getAssets);
router.patch('/:id/state', updateAssetState);

export default router;
