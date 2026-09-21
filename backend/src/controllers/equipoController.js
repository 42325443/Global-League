import pool from '../config/db.js';

export const getEquipos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipo');
    if (rows.length === 0) return res.json(getEquiposMock());

    const equipos = rows.map(row => {
      const idVal = row.idEquipo ?? row.id_equipo ?? row.id;
      const nombreVal = row.nombreEquipo ?? row.nombre_equipo ?? row.nombre;
      return {
        id: idVal, idEquipo: idVal,
        nombre: nombreVal, nombreEquipo: nombreVal,
        escudo: row.escudo || null
      };
    });
    res.json(equipos);
  } catch (error) {
    res.json(getEquiposMock());
  }
};

const getEquiposMock = () => [
  { id: 1, idEquipo: 1, nombre: 'Los Galácticos', nombreEquipo: 'Los Galácticos' },
  { id: 2, idEquipo: 2, nombre: 'Rayo Vallecano', nombreEquipo: 'Rayo Vallecano' },
  { id: 3, idEquipo: 3, nombre: 'Dream Team FC', nombreEquipo: 'Dream Team FC' },
  { id: 4, idEquipo: 4, nombre: 'Deportivo Tapitas', nombreEquipo: 'Deportivo Tapitas' }
];