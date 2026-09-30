-- Esquema de la Versión 1.0 de la base de datos de Global League

-- ==========================================================================================
-- Creacion de la base de datos
-- ==========================================================================================

-- 1) Creamos y seleccionamos la base de datos
CREATE DATABASE IF NOT EXISTS global_league;
USE global_league;

-- 2) Eliminamos tablas si existen (en orden inverso a sus dependencias), para evitar errores al correr multiples veces el script
-- Eliminar este bloque cuando el proyecto este en producción y se quiera preservar la información. Borra todas las tablas al ser corrido el script, generando un reinicio, por lo que es necesario eliminarlo o comentarlo al momento de desplegar el proyecto o conectar la API.
DROP TABLE IF EXISTS torneo_equipo;
DROP TABLE IF EXISTS jugador;
DROP TABLE IF EXISTS equipo;
DROP TABLE IF EXISTS torneo;
DROP TABLE IF EXISTS formato;
DROP TABLE IF EXISTS disciplina;
DROP TABLE IF EXISTS deporte;

-- 3) Creamos la Tabla Deporte
CREATE TABLE deporte (
    idDeporte INT AUTO_INCREMENT PRIMARY KEY,
    nombreDeporte VARCHAR(20) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255) NULL -- URL de la imagen representativa del deporte, puede ser NULL si no se tiene una imagen, es necesario para la creacion del wizard de creacion de torneos, ya que se mostrara la imagen del deporte seleccionado en el wizard.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Creamos la Tabla Disciplina
CREATE TABLE disciplina (
    idDisciplina INT AUTO_INCREMENT PRIMARY KEY,
    idDeporte INT NOT NULL,
    nombreDisciplina VARCHAR(30) NOT NULL,
    descripcionDisciplina TEXT,
    cantidadJugadores INT,
    CONSTRAINT fk_disciplina_deporte 
        FOREIGN KEY (idDeporte) 
        REFERENCES deporte(idDeporte) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) Creamos la Tabla Formato
CREATE TABLE formato (
    idFormato INT AUTO_INCREMENT PRIMARY KEY,
    nombreFormato VARCHAR(20) NOT NULL,
    descripcionFormato TEXT,
    imagen_url VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) Creamos la Tabla Torneo
CREATE TABLE torneo (
    idTorneo INT AUTO_INCREMENT PRIMARY KEY,
    idDisciplina INT NOT NULL,
    idFormato INT NOT NULL,
    nombreTorneo VARCHAR(50) NOT NULL,
    descripcionTorneo TEXT,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,
    ubicacion VARCHAR(100),
    cantidadEquipos INT,
    fechaCreacion DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_torneo_disciplina 
        FOREIGN KEY (idDisciplina) 
        REFERENCES disciplina(idDisciplina),
    CONSTRAINT fk_torneo_formato 
        FOREIGN KEY (idFormato) 
        REFERENCES formato(idFormato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) Creamos la Tabla Equipo
-- Cada equipo pertenece a una disciplina. El deporte se obtiene a través de disciplina.
CREATE TABLE equipo (
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

-- 8) Creamos la Tabla Jugador
-- Nombre y apellido se guardan por separado. El DNI es opcional.
CREATE TABLE jugador (
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

-- 9) Creamos la relación entre los equipos inscriptos y sus torneos
CREATE TABLE torneo_equipo (
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
