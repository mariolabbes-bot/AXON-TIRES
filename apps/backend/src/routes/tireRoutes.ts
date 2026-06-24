import { Router } from 'express';
import { 
  getTires, 
  updateTireState, 
  massUpdateTires, 
  sendTiresToRetread, 
  receiveTiresFromRetread, 
  disposeTires 
} from '../controllers/tireController';

const router = Router();

router.get('/', getTires);
router.patch('/mass-update', massUpdateTires);
router.post('/retread/send', sendTiresToRetread);
router.post('/retread/receive', receiveTiresFromRetread);
router.post('/dispose', disposeTires);
router.patch('/:fire_mark_id/state', updateTireState);

export default router;
