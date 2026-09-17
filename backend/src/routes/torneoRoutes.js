import { Router } from 'express';
import { getTorneos, createTorneo } from '../controllers/torneoController.js';

const router = Router();

router.get('/', getTorneos);
router.post('/', createTorneo);

export default router;