import express from 'express';
import { getDeportes, getDisciplinas, getFormatos } from '../controllers/catalogosController.js';

const router = express.Router();

router.get('/deportes', getDeportes);
router.get('/disciplinas', getDisciplinas);
router.get('/formatos', getFormatos);

export default router;