import { Router } from 'express';
import { getTorneos, createTorneo, deleteTorneo, actualizarEquiposTorneo, generarFixture } from '../controllers/torneoController.js';

const router = Router();

router.get('/torneos', getTorneos);
router.post('/torneos', createTorneo);
router.delete('/torneos/:id', deleteTorneo);
router.put('/torneos/:id/equipos', actualizarEquiposTorneo);
router.post('/torneos/:id/fixture', generarFixture);

export default router;