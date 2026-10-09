import pool from '../config/db.js';

const normalizarEquipo = (row) => ({
  id: row.idEquipo,
  idEquipo: row.idEquipo,
  nombre: row.nombreEquipo,
  nombreEquipo: row.nombreEquipo,
  idDeporte: row.idDeporte,
  idDisciplina: row.idDisciplina,
  deporte: row.nombreDeporte || '',
  disciplina: row.nombreDisciplina || '',
  localidad: row.localidad,
  capitan: row.capitan,
  cantidadJugadores: Number(row.cantidadJugadores || 0)
});

export const getEquipos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.idEquipo,
        e.nombreEquipo,
        dep.idDeporte,
        e.idDisciplina,
        e.localidad,
        e.capitan,
        d.nombreDisciplina,
        dep.nombreDeporte,
        (SELECT COUNT(*) FROM jugador j WHERE j.idEquipo = e.idEquipo) AS cantidadJugadores
      FROM equipo e
      JOIN disciplina d ON d.idDisciplina = e.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE e.idUsuario = ?
      ORDER BY e.idEquipo DESC
    `, [req.user.idUsuario]);

    res.json(rows.map(normalizarEquipo));
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los equipos.' });
  }
};

export const getEquipoById = async (req, res) => {
  const idEquipo = Number(req.params.id);
  if (!Number.isInteger(idEquipo) || idEquipo <= 0) {
    return res.status(400).json({ error: 'El identificador del equipo no es válido.' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        e.idEquipo,
        e.nombreEquipo,
        dep.idDeporte,
        e.idDisciplina,
        e.localidad,
        e.capitan,
        d.nombreDisciplina,
        dep.nombreDeporte,
        (SELECT COUNT(*) FROM jugador j WHERE j.idEquipo = e.idEquipo) AS cantidadJugadores
      FROM equipo e
      JOIN disciplina d ON d.idDisciplina = e.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE e.idEquipo = ? AND e.idUsuario = ?
    `, [idEquipo, req.user.idUsuario]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el equipo.' });
    }

    const [jugadoresRows] = await pool.query(`
      SELECT idJugador, nombre, apellido, dni, esCapitan
      FROM jugador
      WHERE idEquipo = ?
      ORDER BY apellido, nombre, idJugador
    `, [idEquipo]);

    const nombreCapitanGuardado = String(rows[0].capitan || '').trim().toLocaleLowerCase();
    const capitanMarcado = jugadoresRows.find((jugador) => Number(jugador.esCapitan) === 1);
    let idCapitan = capitanMarcado?.idJugador;
    if (!idCapitan) {
      idCapitan = jugadoresRows.find((jugador) => (
        `${jugador.nombre} ${jugador.apellido}`.trim().toLocaleLowerCase() === nombreCapitanGuardado
      ))?.idJugador;
    }
    const jugadores = jugadoresRows.map((jugador) => {
      return { ...jugador, esCapitan: Number(jugador.idJugador) === Number(idCapitan) };
    });

    const jugadorCapitan = jugadores.find((jugador) => jugador.esCapitan);
    const equipoNormalizado = normalizarEquipo(rows[0]);

    res.json({
      ...equipoNormalizado,
      capitan: jugadorCapitan
        ? `${jugadorCapitan.nombre} ${jugadorCapitan.apellido}`
        : equipoNormalizado.capitan,
      jugadores
    });
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    res.status(500).json({ error: 'No se pudo obtener el equipo.' });
  }
};

export const createEquipo = async (req, res) => {
  const {
    nombreEquipo,
    idDisciplina,
    localidad,
    capitan,
    jugadores = []
  } = req.body || {};

  const disciplinaId = Number(idDisciplina);
  let capitanNormalizado;
  if (capitan && typeof capitan === 'object') {
    capitanNormalizado = {
      nombre: typeof capitan.nombre === 'string' ? capitan.nombre.trim() : '',
      apellido: typeof capitan.apellido === 'string' ? capitan.apellido.trim() : '',
      dni: typeof capitan.dni === 'string' ? capitan.dni.trim() : ''
    };
  } else if (typeof capitan === 'string') {
    const partesNombre = capitan.trim().split(/\s+/);
    capitanNormalizado = {
      nombre: partesNombre.shift() || '',
      apellido: partesNombre.join(' '),
      dni: ''
    };
  } else {
    capitanNormalizado = { nombre: '', apellido: '', dni: '' };
  }

  const datosEquipo = {
    nombreEquipo: typeof nombreEquipo === 'string' ? nombreEquipo.trim() : '',
    localidad: typeof localidad === 'string' ? localidad.trim() : '',
    capitan: `${capitanNormalizado.nombre} ${capitanNormalizado.apellido}`.trim()
  };

  if (!datosEquipo.nombreEquipo || datosEquipo.nombreEquipo.length > 100) {
    return res.status(400).json({ error: 'El nombre del equipo es obligatorio y debe tener hasta 100 caracteres.' });
  }
  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    return res.status(400).json({ error: 'Seleccioná una disciplina válida.' });
  }
  if (!datosEquipo.localidad || datosEquipo.localidad.length > 100) {
    return res.status(400).json({ error: 'La localidad es obligatoria y debe tener hasta 100 caracteres.' });
  }
  if (!capitanNormalizado.nombre || capitanNormalizado.nombre.length > 80
    || !capitanNormalizado.apellido || capitanNormalizado.apellido.length > 80
    || datosEquipo.capitan.length > 120 || capitanNormalizado.dni.length > 20) {
    return res.status(400).json({ error: 'El capitán necesita nombre y apellido válidos; el DNI admite hasta 20 caracteres.' });
  }
  if (!Array.isArray(jugadores)) {
    return res.status(400).json({ error: 'La lista de jugadores no es válida.' });
  }

  const jugadoresNormalizados = [];
  for (const jugador of jugadores) {
    const nombre = typeof jugador?.nombre === 'string' ? jugador.nombre.trim() : '';
    const apellido = typeof jugador?.apellido === 'string' ? jugador.apellido.trim() : '';
    const dni = typeof jugador?.dni === 'string' ? jugador.dni.trim() : '';

    if (!nombre || nombre.length > 80 || !apellido || apellido.length > 80 || dni.length > 20) {
      return res.status(400).json({
        error: 'Cada jugador necesita nombre y apellido de hasta 80 caracteres; el DNI admite hasta 20.'
      });
    }

    jugadoresNormalizados.push({ nombre, apellido, dni: dni || null });
  }

  const normalizarTexto = (valor) => valor.trim().toLocaleLowerCase();
  let indiceCapitan = jugadoresNormalizados.findIndex((jugador) => (
    normalizarTexto(jugador.nombre) === normalizarTexto(capitanNormalizado.nombre)
    && normalizarTexto(jugador.apellido) === normalizarTexto(capitanNormalizado.apellido)
  ));

  if (indiceCapitan >= 0) {
    const jugadorCapitan = jugadoresNormalizados[indiceCapitan];
    if (capitanNormalizado.dni && jugadorCapitan.dni && capitanNormalizado.dni !== jugadorCapitan.dni) {
      return res.status(400).json({ error: 'El DNI del capitán no coincide con el DNI cargado para ese jugador.' });
    }
    jugadorCapitan.dni = jugadorCapitan.dni || capitanNormalizado.dni || null;
  } else {
    jugadoresNormalizados.push({
      nombre: capitanNormalizado.nombre,
      apellido: capitanNormalizado.apellido,
      dni: capitanNormalizado.dni || null
    });
    indiceCapitan = jugadoresNormalizados.length - 1;
  }

  if (!jugadoresNormalizados[indiceCapitan].dni) {
    return res.status(400).json({ error: 'El DNI del capitán es obligatorio.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [equipoResult] = await connection.query(`
      INSERT INTO equipo (idUsuario, nombreEquipo, idDisciplina, localidad, capitan)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.idUsuario, datosEquipo.nombreEquipo, disciplinaId, datosEquipo.localidad, datosEquipo.capitan]);

    const nuevoIdEquipo = equipoResult.insertId;

    for (const [index, jugador] of jugadoresNormalizados.entries()) {
      await connection.query(`
        INSERT INTO jugador (idEquipo, nombre, apellido, dni, esCapitan)
        VALUES (?, ?, ?, ?, ?)
      `, [nuevoIdEquipo, jugador.nombre, jugador.apellido, jugador.dni, index === indiceCapitan]);
    }

    await connection.commit();

    res.status(201).json({
      id: nuevoIdEquipo,
      idEquipo: nuevoIdEquipo,
      nombre: datosEquipo.nombreEquipo,
      nombreEquipo: datosEquipo.nombreEquipo,
      idDisciplina: disciplinaId,
      localidad: datosEquipo.localidad,
      capitan: datosEquipo.capitan,
      cantidadJugadores: jugadoresNormalizados.length,
      message: 'Equipo y jugadores guardados correctamente.'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear equipo y jugadores:', error);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'La disciplina seleccionada no existe.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El DNI ingresado ya está registrado en otro equipo.' });
    }

    res.status(500).json({ error: 'No se pudo guardar el equipo y sus jugadores.' });
  } finally {
    connection?.release();
  }
};

const obtenerIdValido = (valor) => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const updateEquipo = async (req, res) => {
  const idEquipo = obtenerIdValido(req.params.id);
  if (!idEquipo) return res.status(400).json({ error: 'El identificador del equipo no es válido.' });

  const { nombreEquipo, idDisciplina, localidad } = req.body || {};
  const nombre = typeof nombreEquipo === 'string' ? nombreEquipo.trim() : '';
  const disciplinaId = Number(idDisciplina);
  const localidadNormalizada = typeof localidad === 'string' ? localidad.trim() : '';

  if (!nombre || nombre.length > 100) {
    return res.status(400).json({ error: 'El nombre del equipo es obligatorio y debe tener hasta 100 caracteres.' });
  }
  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    return res.status(400).json({ error: 'Seleccioná una disciplina válida.' });
  }
  if (!localidadNormalizada || localidadNormalizada.length > 100) {
    return res.status(400).json({ error: 'La localidad es obligatoria y debe tener hasta 100 caracteres.' });
  }

  try {
    const [equipos] = await pool.query(
      'SELECT idEquipo, idDisciplina FROM equipo WHERE idEquipo = ? AND idUsuario = ?',
      [idEquipo, req.user.idUsuario]
    );
    if (equipos.length === 0) return res.status(404).json({ error: 'No se encontró el equipo.' });

    if (Number(equipos[0].idDisciplina) !== disciplinaId) {
      const [inscripciones] = await pool.query(
        'SELECT COUNT(*) AS total FROM torneo_equipo WHERE idEquipo = ?',
        [idEquipo]
      );
      if (Number(inscripciones[0].total) > 0) {
        return res.status(409).json({ error: 'No se puede cambiar la disciplina de un equipo inscripto en un torneo.' });
      }
    }

    await pool.query(`
      UPDATE equipo
      SET nombreEquipo = ?, idDisciplina = ?, localidad = ?
      WHERE idEquipo = ? AND idUsuario = ?
    `, [nombre, disciplinaId, localidadNormalizada, idEquipo, req.user.idUsuario]);

    res.json({ message: 'Equipo actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'La disciplina seleccionada no existe.' });
    }
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({ error: 'No se pudo actualizar el equipo.' });
  }
};

export const deleteEquipo = async (req, res) => {
  const idEquipo = obtenerIdValido(req.params.id);
  if (!idEquipo) return res.status(400).json({ error: 'El identificador del equipo no es válido.' });

  try {
    const [equipos] = await pool.query(
      'SELECT idEquipo FROM equipo WHERE idEquipo = ? AND idUsuario = ?',
      [idEquipo, req.user.idUsuario]
    );
    if (equipos.length === 0) return res.status(404).json({ error: 'No se encontró el equipo.' });

    const [inscripciones] = await pool.query(
      'SELECT COUNT(*) AS total FROM torneo_equipo WHERE idEquipo = ?',
      [idEquipo]
    );
    if (Number(inscripciones[0].total) > 0) {
      return res.status(409).json({ error: 'Este equipo está inscripto en uno o más torneos y no se puede eliminar.' });
    }

    await pool.query('DELETE FROM equipo WHERE idEquipo = ? AND idUsuario = ?', [idEquipo, req.user.idUsuario]);
    res.json({ message: 'Equipo eliminado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Este equipo está vinculado a un torneo y no se puede eliminar.' });
    }
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: 'No se pudo eliminar el equipo.' });
  }
};

export const addJugador = async (req, res) => {
  const idEquipo = obtenerIdValido(req.params.id);
  if (!idEquipo) return res.status(400).json({ error: 'El identificador del equipo no es válido.' });

  const { nombre, apellido, dni = '' } = req.body || {};
  const jugador = {
    nombre: typeof nombre === 'string' ? nombre.trim() : '',
    apellido: typeof apellido === 'string' ? apellido.trim() : '',
    dni: typeof dni === 'string' ? dni.trim() : ''
  };

  if (!jugador.nombre || jugador.nombre.length > 80 || !jugador.apellido || jugador.apellido.length > 80 || jugador.dni.length > 20) {
    return res.status(400).json({ error: 'El jugador necesita nombre y apellido de hasta 80 caracteres; el DNI admite hasta 20.' });
  }

  try {
    const [[equipo]] = await pool.query(
      'SELECT idEquipo FROM equipo WHERE idEquipo = ? AND idUsuario = ?',
      [idEquipo, req.user.idUsuario]
    );
    if (!equipo) return res.status(404).json({ error: 'No se encontró el equipo.' });

    const [result] = await pool.query(`
      INSERT INTO jugador (idEquipo, nombre, apellido, dni)
      VALUES (?, ?, ?, ?)
    `, [idEquipo, jugador.nombre, jugador.apellido, jugador.dni || null]);

    res.status(201).json({
      idJugador: result.insertId,
      ...jugador,
      dni: jugador.dni || null,
      esCapitan: false,
      message: 'Jugador agregado al equipo.'
    });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'No se encontró el equipo.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese DNI ya está registrado en otro equipo.' });
    }
    console.error('Error al agregar jugador:', error);
    res.status(500).json({ error: 'No se pudo agregar el jugador.' });
  }
};

export const setCapitan = async (req, res) => {
  const idEquipo = obtenerIdValido(req.params.id);
  const idJugador = obtenerIdValido(req.body?.idJugador);
  if (!idEquipo || !idJugador) {
    return res.status(400).json({ error: 'El identificador del equipo o del jugador no es válido.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [jugadores] = await connection.query(`
      SELECT j.idJugador, j.nombre, j.apellido
      FROM jugador j
      JOIN equipo e ON e.idEquipo = j.idEquipo
      WHERE j.idJugador = ? AND j.idEquipo = ? AND e.idUsuario = ?
      FOR UPDATE
    `, [idJugador, idEquipo, req.user.idUsuario]);
    if (jugadores.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'El jugador seleccionado no pertenece a este equipo.' });
    }

    const nombreCapitan = `${jugadores[0].nombre} ${jugadores[0].apellido}`;
    if (nombreCapitan.length > 120) {
      await connection.rollback();
      return res.status(400).json({ error: 'El nombre completo del capitán no puede superar 120 caracteres.' });
    }

    await connection.query('UPDATE jugador SET esCapitan = 0 WHERE idEquipo = ?', [idEquipo]);
    await connection.query('UPDATE jugador SET esCapitan = 1 WHERE idJugador = ?', [idJugador]);
    await connection.query('UPDATE equipo SET capitan = ? WHERE idEquipo = ?', [nombreCapitan, idEquipo]);

    await connection.commit();
    res.json({ message: 'Capitán actualizado correctamente.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar capitán:', error);
    res.status(500).json({ error: 'No se pudo actualizar el capitán.' });
  } finally {
    connection?.release();
  }
};
