import pool from '../config/db.js';

export const getTablaPosiciones = async (req, res) => {
  const { idTorneo } = req.params;
  try {
    // Cálculo de tabla basado en partidos cerrados (simplificado)
    const [rows] = await pool.query(`
      SELECT e.idEquipo, e.nombreEquipo, COUNT(p.idPartido) as pj, 
             SUM(p.golesLocal) as gf, SUM(p.golesVisitante) as gc
      FROM equipo e
      JOIN torneo_equipo te ON e.idEquipo = te.idEquipo
      LEFT JOIN partido p ON p.idEquipoLocal = e.idEquipo OR p.idEquipoVisitante = e.idEquipo
      WHERE te.idTorneo = ? AND p.estadoActa = 'cerrada'
      GROUP BY e.idEquipo
    `, [idTorneo]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular posiciones', details: error.message });
  }
};

export const actualizarActa = async (req, res) => {
  const { id } = req.params;
  const { golesLocal, golesVisitante, estadoActa, observaciones } = req.body;
  try {
    await pool.query(
      'UPDATE partido SET golesLocal = ?, golesVisitante = ?, estadoActa = ?, observaciones = ? WHERE idPartido = ?',
      [golesLocal, golesVisitante, estadoActa, observaciones, id]
    );
    res.json({ message: 'Acta digital actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar acta', details: error.message });
  }
};

export const addIncidencia = async (req, res) => {
  const { id } = req.params;
  const { minuto, idEquipo, tipo, idJugador, detalle } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO incidencia (idPartido, minuto, idEquipo, tipo, idJugador, detalle) VALUES (?, ?, ?, ?, ?, ?)',
      [id, minuto, idEquipo, tipo, idJugador, detalle]
    );
    res.status(201).json({ id: result.insertId, message: 'Incidencia registrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar incidencia', details: error.message });
  }
};