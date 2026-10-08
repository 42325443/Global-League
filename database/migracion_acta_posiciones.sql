-- Migración incremental: Acta Digital y Tabla de Posiciones.
-- Idempotente: solo crea las tablas si aún no existen y siembra los
-- criterios de desempate por defecto para torneos que no tengan.

USE global_league;

CREATE TABLE IF NOT EXISTS acta_partido (
    idActa INT AUTO_INCREMENT PRIMARY KEY,
    idPartido INT NOT NULL,
    idUsuarioCarga INT NOT NULL,
    idArbitro INT NULL COMMENT 'NULL cuando el partido no tenía árbitro asignado',
    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador',
    observaciones TEXT NULL,
    fechaCarga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaCierre DATETIME NULL,
    UNIQUE KEY uq_acta_partido (idPartido),
    CONSTRAINT fk_acta_partido_partido
        FOREIGN KEY (idPartido) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_acta_partido_usuario
        FOREIGN KEY (idUsuarioCarga) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_acta_partido_arbitro
        FOREIGN KEY (idArbitro) REFERENCES arbitro(idArbitro)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partido_evento (
    idEvento INT AUTO_INCREMENT PRIMARY KEY,
    idActa INT NOT NULL,
    idJugador INT NULL,
    tipoEvento VARCHAR(30) NOT NULL COMMENT 'Gol, tarjeta, asistencia, punto u otro evento de la disciplina',
    numeroPeriodo SMALLINT UNSIGNED NULL,
    minuto SMALLINT UNSIGNED NULL,
    valor SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    observaciones VARCHAR(300) NULL,
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partido_evento_acta_tipo (idActa, tipoEvento),
    INDEX idx_partido_evento_jugador (idJugador),
    CONSTRAINT fk_partido_evento_acta
        FOREIGN KEY (idActa) REFERENCES acta_partido(idActa)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_partido_evento_jugador
        FOREIGN KEY (idJugador) REFERENCES jugador(idJugador)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS torneo_criterio_desempate (
    idCriterio INT AUTO_INCREMENT PRIMARY KEY,
    idTorneo INT NOT NULL,
    orden TINYINT UNSIGNED NOT NULL,
    criterio VARCHAR(40) NOT NULL COMMENT 'Puntos, resultado directo, diferencia, marcador a favor, fair play u otro',
    UNIQUE KEY uq_torneo_criterio_orden (idTorneo, orden),
    UNIQUE KEY uq_torneo_criterio_tipo (idTorneo, criterio),
    CONSTRAINT fk_torneo_criterio_torneo
        FOREIGN KEY (idTorneo) REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Criterios por defecto para torneos que todavía no tienen criterios propios.
INSERT INTO torneo_criterio_desempate (idTorneo, orden, criterio)
SELECT t.idTorneo, defecto.orden, defecto.criterio
FROM torneo t
JOIN (
    SELECT 1 AS orden, 'Puntos' AS criterio
    UNION ALL SELECT 2, 'Diferencia de goles'
    UNION ALL SELECT 3, 'Marcador a favor'
    UNION ALL SELECT 4, 'Resultado directo'
) defecto
WHERE NOT EXISTS (
    SELECT 1
    FROM torneo_criterio_desempate c
    WHERE c.idTorneo = t.idTorneo
);
