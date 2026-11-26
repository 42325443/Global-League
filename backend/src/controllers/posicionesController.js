import pool from '../config/db.js';
import {
  calcularTablaPosiciones,
  CRITERIOS_PERMITIDOS,
  crearError,
  obtenerCriterios,
  guardarCriterios,
} from '../services/posicionesService.js';

const resolverIdTorneo = async (idTorneoRaw, idUsuario) => {
  const idTorneo = Number(idTorneoRaw);
  if (!Number.isInteger(idTorneo) || idTorneo <= 0) {
    throw crearError('El torneo no es válido.');
  }
  const [[torneo]] = await pool.query(
    'SELECT idTorneo FROM torneo WHERE idTorneo = ? AND idUsuario = ?',
    [idTorneo, idUsuario]
  );
  if (!torneo) throw crearError('No se encontró el torneo.', 404);
  return idTorneo;
};

const fechaActualizacion = () => new Date().toISOString();

export const getTablaPosiciones = async (req, res) => {
  try {
    const idTorneo = await resolverIdTorneo(req.params.idTorneo, req.user.idUsuario);
    const datos = await calcularTablaPosiciones(idTorneo);
    res.json({ ...datos, fechaActualizacion: fechaActualizacion() });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al calcular la tabla de posiciones:', error);
    res.status(500).json({ error: 'No se pudo calcular la tabla de posiciones.' });
  }
};

// Recálculo manual: mismo cálculo, con marca de tiempo fresca para el usuario.
export const actualizarTablaPosiciones = async (req, res) => {
  try {
    const idTorneo = await resolverIdTorneo(req.params.idTorneo, req.user.idUsuario);
    const datos = await calcularTablaPosiciones(idTorneo);
    res.json({ ...datos, fechaActualizacion: fechaActualizacion() });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al actualizar la tabla de posiciones:', error);
    res.status(500).json({ error: 'No se pudo actualizar la tabla de posiciones.' });
  }
};

export const getCriteriosTorneo = async (req, res) => {
  try {
    const idTorneo = await resolverIdTorneo(req.params.idTorneo, req.user.idUsuario);
    const criterios = await obtenerCriterios(idTorneo);
    res.json({ criterios, permitidos: CRITERIOS_PERMITIDOS });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al cargar los criterios:', error);
    res.status(500).json({ error: 'No se pudieron cargar los criterios de desempate.' });
  }
};

export const updateCriteriosTorneo = async (req, res) => {
  try {
    const idTorneo = await resolverIdTorneo(req.params.idTorneo, req.user.idUsuario);
    const criterios = await guardarCriterios(idTorneo, req.body?.criterios, req.user.idUsuario);
    res.json({ message: 'Criterios actualizados correctamente.', criterios });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Los criterios ingresados generan un conflicto de orden.' });
    }
    console.error('Error al guardar los criterios:', error);
    res.status(500).json({ error: 'No se pudieron guardar los criterios de desempate.' });
  }
};
