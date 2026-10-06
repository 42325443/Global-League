import { Router } from 'express';
import {
  createCancha,
  getCalendario,
  getCanchas,
  programarPartido,
} from '../controllers/calendarioController.js';

const router = Router();

router.get('/calendario', getCalendario);
router.get('/canchas', getCanchas);
router.post('/canchas', createCancha);
router.put('/partidos/:id/programacion', programarPartido);

export default router;
