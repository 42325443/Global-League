import { Router } from 'express';
import {
  asignarArbitrosPartido,
  getActaPartido,
  getPartidosArbitro,
  getPartidosSinArbitro,
  guardarActaPartido
} from '../controllers/actaController.js';

const router = Router();

router.get('/partidos/sin-arbitro', getPartidosSinArbitro);
router.get('/arbitros/:id/partidos', getPartidosArbitro);
router.put('/partidos/:id/arbitros', asignarArbitrosPartido);
router.get('/partidos/:id/acta', getActaPartido);
router.put('/partidos/:id/acta', guardarActaPartido);

export default router;
