import { Router } from 'express';
import { getEstadisticas, getEstadisticasTorneo } from '../controllers/estadisticasController.js';

const router = Router();

router.get('/estadisticas', getEstadisticas);
router.get('/torneos/:id/estadisticas', getEstadisticasTorneo);

export default router;
