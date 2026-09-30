import { Router } from 'express';
import { createEquipo, getEquipoById, getEquipos } from '../controllers/equipoController.js';

const router = Router();

router.post('/equipos', createEquipo);
router.get('/equipos/:id', getEquipoById);
router.get('/equipos', getEquipos);

export default router;
