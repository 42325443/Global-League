import { Router } from 'express';
import { getDisciplinas, getFormatos } from '../controllers/catalogosController.js';

const router = Router();

router.get('/disciplinas', getDisciplinas);
router.get('/formatos', getFormatos);

export default router;