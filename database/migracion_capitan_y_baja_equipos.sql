-- Ejecutar sobre una base existente para vincular capitanes con el plantel
-- y evitar que la eliminación de un equipo lo quite silenciosamente de torneos.
-- Se puede volver a ejecutar si una ejecución anterior quedó a mitad de camino.
USE global_league;

-- Agrega la columna solo si todavía no existe.
SET @existe_es_capitan = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'jugador'
      AND COLUMN_NAME = 'esCapitan'
);
SET @sql_columna_capitan = IF(
    @existe_es_capitan = 0,
    'ALTER TABLE jugador ADD COLUMN esCapitan TINYINT(1) NOT NULL DEFAULT 0 AFTER dni',
    'SELECT ''La columna esCapitan ya existe; se conserva'' AS mensaje'
);
PREPARE sentencia_columna_capitan FROM @sql_columna_capitan;
EXECUTE sentencia_columna_capitan;
DEALLOCATE PREPARE sentencia_columna_capitan;

-- Vincula automáticamente los casos en que el nombre guardado como capitán
-- coincide con un jugador que ya estaba cargado.
SET @modo_seguro_original = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
UPDATE jugador j
JOIN equipo e ON e.idEquipo = j.idEquipo
SET j.esCapitan = 1
WHERE LOWER(TRIM(CONCAT(j.nombre, ' ', j.apellido))) = LOWER(TRIM(e.capitan));
SET SQL_SAFE_UPDATES = @modo_seguro_original;

-- MySQL puede fallar al reemplazar una clave foránea en un solo ALTER TABLE.
-- La elimina por separado solo si todavía permite cascada.
SET @regla_baja_equipo = (
    SELECT DELETE_RULE
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'torneo_equipo'
      AND CONSTRAINT_NAME = 'fk_torneo_equipo_equipo'
    LIMIT 1
);
SET @sql_eliminar_fk_equipo = IF(
    @regla_baja_equipo = 'CASCADE',
    'ALTER TABLE torneo_equipo DROP FOREIGN KEY fk_torneo_equipo_equipo',
    'SELECT ''La clave foránea de equipo ya es restrictiva o no existe'' AS mensaje'
);
PREPARE sentencia_eliminar_fk_equipo FROM @sql_eliminar_fk_equipo;
EXECUTE sentencia_eliminar_fk_equipo;
DEALLOCATE PREPARE sentencia_eliminar_fk_equipo;

-- La agrega solo cuando no quedó una clave con ese nombre.
SET @existe_fk_equipo = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'torneo_equipo'
      AND CONSTRAINT_NAME = 'fk_torneo_equipo_equipo'
);
SET @sql_agregar_fk_equipo = IF(
    @existe_fk_equipo = 0,
    'ALTER TABLE torneo_equipo ADD CONSTRAINT fk_torneo_equipo_equipo FOREIGN KEY (idEquipo) REFERENCES equipo(idEquipo) ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT ''La clave foránea de equipo ya existe'' AS mensaje'
);
PREPARE sentencia_agregar_fk_equipo FROM @sql_agregar_fk_equipo;
EXECUTE sentencia_agregar_fk_equipo;
DEALLOCATE PREPARE sentencia_agregar_fk_equipo;
