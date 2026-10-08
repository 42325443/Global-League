import { Router } from 'express';
import { getTorneos, createTorneo, deleteTorneo, actualizarEquiposTorneo, generarFixture, getPartidosTorneo } from '../controllers/torneoController.js';

const router = Router();

router.get('/torneos', getTorneos);
router.post('/torneos', createTorneo);
router.delete('/torneos/:id', deleteTorneo);
router.put('/torneos/:id/equipos', actualizarEquiposTorneo);
router.get('/torneos/:id/partidos', getPartidosTorneo);
router.post('/torneos/:id/fixture', generarFixture);

export default router;
