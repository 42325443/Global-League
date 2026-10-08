import { Router } from 'express';
import {
  actualizarTablaPosiciones,
  getCriteriosTorneo,
  getTablaPosiciones,
  updateCriteriosTorneo,
} from '../controllers/posicionesController.js';

const router = Router();

router.get('/torneos/:idTorneo/posiciones', getTablaPosiciones);
router.post('/torneos/:idTorneo/posiciones/actualizar', actualizarTablaPosiciones);
router.get('/torneos/:idTorneo/criterios', getCriteriosTorneo);
router.put('/torneos/:idTorneo/criterios', updateCriteriosTorneo);

export default router;
