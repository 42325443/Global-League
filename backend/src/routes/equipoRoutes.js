import { Router } from 'express';
import { getEquipos } from '../controllers/equipoController.js';

const router = Router();

router.get('/equipos', getEquipos);

export default router;