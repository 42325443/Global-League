import { Router } from 'express';
import {
  agregarIncidenciaActa,
  eliminarIncidenciaActa,
  firmarActa,
  getActaDePartido,
  guardarBorradorActa,
} from '../controllers/actaController.js';

const router = Router();

router.get('/partidos/:idPartido/acta', getActaDePartido);
router.post('/partidos/:idPartido/acta/borrador', guardarBorradorActa);
router.post('/partidos/:idPartido/acta/incidencias', agregarIncidenciaActa);
router.delete('/partidos/:idPartido/acta/incidencias/:idEvento', eliminarIncidenciaActa);
router.post('/partidos/:idPartido/acta/firmar', firmarActa);

export default router;
