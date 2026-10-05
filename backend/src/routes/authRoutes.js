import { Router } from 'express';
import { cerrarSesion, iniciarSesion, obtenerSesion, registrarUsuario } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.post('/logout', cerrarSesion);
router.get('/me', requireAuth, obtenerSesion);

export default router;
