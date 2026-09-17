import pool from '../config/db.js';

// 1. Obtener todos los torneos
export const getTorneos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM torneo');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los torneos', details: error.message });
  }
};

// 2. Crear un nuevo torneo
export const createTorneo = async (req, res) => {
  const { 
    nombreTorneo, 
    idDisciplina, 
    idFormato, 
    fechaInicio, 
    descripcionTorneo, 
    fechaFin, 
    ubicacion, 
    cantidadEquipos 
  } = req.body;

  if (!nombreTorneo || !idDisciplina || !idFormato || !fechaInicio) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios (nombreTorneo, idDisciplina, idFormato, fechaInicio)' 
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO torneo (nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombreTorneo, 
        idDisciplina, 
        idFormato, 
        fechaInicio, 
        descripcionTorneo || null, 
        fechaFin || null, 
        ubicacion || null, 
        cantidadEquipos || null
      ]
    );

    res.status(201).json({
      message: 'Torneo creado con éxito',
      idTorneo: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el torneo', details: error.message });
  }
};