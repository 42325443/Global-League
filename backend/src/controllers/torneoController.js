import pool from '../config/db.js';

export const getTorneos = async (req, res) => {
  try {
    let query = `
      SELECT 
        t.idTorneo, t.nombreTorneo, t.idDisciplina, t.idFormato, t.fechaInicio, 
        t.fechaFin, t.ubicacion, t.cantidadEquipos, t.descripcionTorneo,
        d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
        (SELECT COUNT(*) FROM torneo_equipo te WHERE te.idTorneo = t.idTorneo) AS equiposInscriptos
      FROM torneo t
      LEFT JOIN disciplina d ON t.idDisciplina = d.idDisciplina
      LEFT JOIN deporte dep ON d.idDeporte = dep.idDeporte
      LEFT JOIN formato f ON t.idFormato = f.idFormato
      ORDER BY t.idTorneo DESC
    `;

    let rows;
    try {
      [rows] = await pool.query(query);
    } catch (dbError) {
      const fallbackQuery = `
        SELECT 
          t.idTorneo, t.nombreTorneo, t.idDisciplina, t.idFormato, t.fechaInicio, 
          t.fechaFin, t.ubicacion, t.cantidadEquipos, t.descripcionTorneo,
          d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
          0 AS equiposInscriptos
        FROM torneo t
        LEFT JOIN disciplina d ON t.idDisciplina = d.idDisciplina
        LEFT JOIN deporte dep ON d.idDeporte = dep.idDeporte
        LEFT JOIN formato f ON t.idFormato = f.idFormato
        ORDER BY t.idTorneo DESC
      `;
      [rows] = await pool.query(fallbackQuery);
    }

    const torneosNormalizados = rows.map(row => {
      const idVal = row.idTorneo ?? row.id_torneo ?? row.id;
      const nombreVal = row.nombreTorneo ?? row.nombre_torneo ?? row.nombre ?? '';
      const limiteVal = row.cantidadEquipos ?? row.cantidadEquiposMax ?? 'Sin limite';

      return {
        ...row,
        id: idVal, idTorneo: idVal,
        nombre: nombreVal, nombreTorneo: nombreVal,
        deporte: row.nombreDeporte ?? 'Sin deporte',
        disciplina: row.nombreDisciplina ?? 'Sin disciplina',
        modalidad: row.nombreFormato ?? 'Liga',
        ubicacion: row.ubicacion || 'Sin asignar',
        cantidadEquiposMax: limiteVal,
        equiposInscriptos: row.equiposInscriptos || 0,
        estado: 'Próximo'
      };
    });
    res.json(torneosNormalizados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener torneos', details: error.message });
  }
};

export const createTorneo = async (req, res) => {
  const { nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos, cantidadEquiposMax, equiposIds } = req.body;
  
  const limiteEquipos = cantidadEquiposMax === 'Sin limite' ? null : (cantidadEquiposMax || cantidadEquipos || null);

  try {
    const [result] = await pool.query(
      `INSERT INTO torneo (nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo || null, fechaFin || null, ubicacion || null, limiteEquipos]
    );

    const nuevoIdTorneo = result.insertId;

    if (Array.isArray(equiposIds) && equiposIds.length > 0) {
      for (const idEquipo of equiposIds) {
        await pool.query('INSERT INTO torneo_equipo (idTorneo, idEquipo) VALUES (?, ?)', [nuevoIdTorneo, idEquipo]).catch(() => {});
      }
    }

    res.status(201).json({ id: nuevoIdTorneo, message: 'Torneo creado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el torneo', details: error.message });
  }
};

export const deleteTorneo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM torneo WHERE idTorneo = ?', [id]);
    res.json({ message: 'Torneo eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar torneo', details: error.message });
  }
};

export const actualizarEquiposTorneo = async (req, res) => {
  const { id } = req.params;
  const { equiposIds } = req.body;

  try {
    await pool.query('DELETE FROM torneo_equipo WHERE idTorneo = ?', [id]);
    if (Array.isArray(equiposIds) && equiposIds.length > 0) {
      for (const idEquipo of equiposIds) {
        await pool.query('INSERT INTO torneo_equipo (idTorneo, idEquipo) VALUES (?, ?)', [id, idEquipo]);
      }
    }
    res.json({ message: 'Equipos actualizados correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar equipos', details: error.message });
  }
};

export const generarFixture = async (req, res) => {
  const { id } = req.params;

  try {
    const [equipos] = await pool.query('SELECT idEquipo FROM torneo_equipo WHERE idTorneo = ?', [id]);
    if (equipos.length < 2) return res.status(400).json({ error: 'Se necesitan al menos 2 equipos.' });

    let ids = equipos.map(e => e.idEquipo);
    if (ids.length % 2 !== 0) ids.push(null);

    const totalJornadas = ids.length - 1;
    const mitad = ids.length / 2;
    const partidos = [];

    for (let i = 0; i < totalJornadas; i++) {
      for (let j = 0; j < mitad; j++) {
        const local = ids[j];
        const visitante = ids[ids.length - 1 - j];
        if (local !== null && visitante !== null) {
          partidos.push([id, local, visitante, i + 1]);
        }
      }
      ids.splice(1, 0, ids.pop());
    }

    await pool.query('INSERT INTO partido (idTorneo, idEquipoLocal, idEquipoVisitante, jornada) VALUES ?', [partidos]);
    res.json({ message: 'Fixture generado con éxito', totalPartidos: partidos.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar fixture', details: error.message });
  }
};