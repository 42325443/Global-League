import pool from '../config/db.js';

export const getDeportes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM deporte');
    const deportes = rows.map(row => {
      const idVal = row.idDeporte ?? row.id_deporte ?? row.id;
      const nombreVal = row.nombreDeporte ?? row.nombre_deporte ?? row.nombre;
      return {
        id: idVal, idDeporte: idVal, id_deporte: idVal,
        nombre: nombreVal, nombreDeporte: nombreVal, nombre_deporte: nombreVal
      };
    });
    res.json(deportes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener deportes', details: error.message });
  }
};

export const getDisciplinas = async (req, res) => {
  const { idDeporte, id_deporte } = req.query;
  const deporteId = idDeporte || id_deporte;

  try {
    let sql = 'SELECT * FROM disciplina';
    const params = [];
    if (deporteId) {
      sql += ' WHERE idDeporte = ? OR id_deporte = ?';
      params.push(deporteId, deporteId);
    }

    const [rows] = await pool.query(sql, params);
    const disciplinas = rows.map(row => {
      const idVal = row.idDisciplina ?? row.id_disciplina ?? row.id;
      const nombreVal = row.nombreDisciplina ?? row.nombre_disciplina ?? row.nombre;
      const idDeporteVal = row.idDeporte ?? row.id_deporte;
      return {
        id: idVal, idDisciplina: idVal, id_disciplina: idVal,
        nombre: nombreVal, nombreDisciplina: nombreVal, nombre_disciplina: nombreVal,
        idDeporte: idDeporteVal, id_deporte: idDeporteVal
      };
    });
    res.json(disciplinas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disciplinas', details: error.message });
  }
};

export const getFormatos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM formato');
    const formatos = rows.map(row => {
      const idVal = row.idFormato ?? row.id_formato ?? row.id;
      const nombreVal = row.nombreFormato ?? row.nombre_formato ?? row.nombre;
      return {
        id: idVal, idFormato: idVal, id_formato: idVal,
        nombre: nombreVal, nombreFormato: nombreVal, nombre_formato: nombreVal,
        descripcion: row.descripcion
      };
    });
    res.json(formatos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener formatos', details: error.message });
  }
};