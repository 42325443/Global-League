import { Router } from 'express';
import {
  actualizarEstadoArbitro,
  createArbitro,
  getArbitros
} from '../controllers/arbitroController.js';

const router = Router();

router.get('/arbitros', getArbitros);
router.post('/arbitros', createArbitro);
router.patch('/arbitros/:id/estado', actualizarEstadoArbitro);

export default router;
