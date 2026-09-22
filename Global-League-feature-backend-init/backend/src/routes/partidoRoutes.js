import { Router } from 'express';
import { getTablaPosiciones, actualizarActa, addIncidencia } from '../controllers/partidoController.js';

const router = Router();

// Rutas para Tablas y Actas Digitales
router.get('/torneos/:idTorneo/posiciones', getTablaPosiciones);
router.put('/partidos/:id/acta', actualizarActa);
router.post('/partidos/:id/incidencias', addIncidencia);

export default router;