import { Router } from 'express';
import { getTorneos, createTorneo, deleteTorneo, actualizarEquiposTorneo, actualizarCriteriosDesempate, generarFixture, getPartidosTorneo, getPosicionesTorneo, darDeBajaEquipo } from '../controllers/torneoController.js';

const router = Router();

router.get('/torneos', getTorneos);
router.post('/torneos', createTorneo);
router.delete('/torneos/:id', deleteTorneo);
router.put('/torneos/:id/equipos', actualizarEquiposTorneo);
router.put('/torneos/:id/criterios-desempate', actualizarCriteriosDesempate);
router.get('/torneos/:id/partidos', getPartidosTorneo);
router.get('/torneos/:id/posiciones', getPosicionesTorneo);
router.post('/torneos/:id/bajas', darDeBajaEquipo);
router.post('/torneos/:id/fixture', generarFixture);

export default router;
