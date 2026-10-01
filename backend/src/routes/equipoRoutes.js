import { Router } from 'express';
import {
  addJugador,
  createEquipo,
  deleteEquipo,
  getEquipoById,
  getEquipos,
  setCapitan,
  updateEquipo
} from '../controllers/equipoController.js';

const router = Router();

router.post('/equipos', createEquipo);
router.put('/equipos/:id', updateEquipo);
router.delete('/equipos/:id', deleteEquipo);
router.post('/equipos/:id/jugadores', addJugador);
router.patch('/equipos/:id/capitan', setCapitan);
router.get('/equipos/:id', getEquipoById);
router.get('/equipos', getEquipos);

export default router;
