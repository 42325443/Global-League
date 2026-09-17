import pool from '../config/db.js';

// Obtener todas las disciplinas
export const getDisciplinas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM disciplina');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disciplinas', details: error.message });
  }
};

// Obtener todos los formatos
export const getFormatos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM formato');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener formatos', details: error.message });
  }
};