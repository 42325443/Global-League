-- Agrega las tablas del módulo Equipos y su relación con Torneos sin borrar ni recrear tablas existentes.
-- Ejecutar sobre la base global_league después de tener creados disciplina y torneo.

USE global_league;

CREATE TABLE IF NOT EXISTS equipo (
    idEquipo INT AUTO_INCREMENT PRIMARY KEY,
    idDisciplina INT NOT NULL,
    nombreEquipo VARCHAR(100) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    capitan VARCHAR(120) NOT NULL,
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_equipo_disciplina (idDisciplina),
    CONSTRAINT fk_equipo_disciplina
        FOREIGN KEY (idDisciplina)
        REFERENCES disciplina(idDisciplina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jugador (
    idJugador INT AUTO_INCREMENT PRIMARY KEY,
    idEquipo INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    dni VARCHAR(20) NULL,
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_jugador_equipo (idEquipo),
    INDEX idx_jugador_dni (dni),
    CONSTRAINT fk_jugador_equipo
        FOREIGN KEY (idEquipo)
        REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relaciona equipos ya creados con los torneos en los que participan.
CREATE TABLE IF NOT EXISTS torneo_equipo (
    idTorneo INT NOT NULL,
    idEquipo INT NOT NULL,
    fechaInscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idTorneo, idEquipo),
    INDEX idx_torneo_equipo_equipo (idEquipo),
    CONSTRAINT fk_torneo_equipo_torneo
        FOREIGN KEY (idTorneo)
        REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_torneo_equipo_equipo
        FOREIGN KEY (idEquipo)
        REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
