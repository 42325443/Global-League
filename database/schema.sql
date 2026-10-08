-- Esquema base de Global League.
-- Este archivo recrea la base completa y elimina sus datos existentes.
-- Para actualizar una base con datos, usar una migración incremental.

CREATE DATABASE IF NOT EXISTS global_league;
USE global_league;

-- Eliminar primero tablas dependientes.
DROP TABLE IF EXISTS jugador_sancion;
DROP TABLE IF EXISTS torneo_regla_sancion;
DROP TABLE IF EXISTS partido_evento;
DROP TABLE IF EXISTS acta_partido;
DROP TABLE IF EXISTS partido_periodo;
DROP TABLE IF EXISTS partido_arbitro;
DROP TABLE IF EXISTS reserva_cancha;
DROP TABLE IF EXISTS cancha_disciplina;
DROP TABLE IF EXISTS torneo_regla_puntuacion;
DROP TABLE IF EXISTS torneo_criterio_desempate;
DROP TABLE IF EXISTS torneo_jugador;
DROP TABLE IF EXISTS arbitro_disciplina;
DROP TABLE IF EXISTS torneo_equipo;
DROP TABLE IF EXISTS partido;
DROP TABLE IF EXISTS jugador;
DROP TABLE IF EXISTS cancha;
DROP TABLE IF EXISTS arbitro;
DROP TABLE IF EXISTS equipo;
DROP TABLE IF EXISTS torneo;
DROP TABLE IF EXISTS formato;
DROP TABLE IF EXISTS disciplina;
DROP TABLE IF EXISTS deporte;
DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'Organizador',
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE deporte (
    idDeporte INT AUTO_INCREMENT PRIMARY KEY,
    nombreDeporte VARCHAR(40) NOT NULL,
    descripcion TEXT NULL,
    imagen_url VARCHAR(255) NULL,
    UNIQUE KEY uq_deporte_nombre (nombreDeporte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE disciplina (
    idDisciplina INT AUTO_INCREMENT PRIMARY KEY,
    idDeporte INT NOT NULL,
    nombreDisciplina VARCHAR(60) NOT NULL,
    descripcionDisciplina TEXT NULL,
    cantidadJugadores SMALLINT UNSIGNED NULL COMMENT 'Jugadores de cada equipo en cancha',
    maxIntegrantesPlantel SMALLINT UNSIGNED NULL COMMENT 'Máximo configurable de jugadores registrados por equipo',
    tipoPuntuacion VARCHAR(20) NOT NULL DEFAULT 'Goles' COMMENT 'Goles, Puntos o Sets',
    cantidadPeriodos SMALLINT UNSIGNED NULL COMMENT 'Cuartos, sets u otros períodos habituales',
    UNIQUE KEY uq_disciplina_deporte_nombre (idDeporte, nombreDisciplina),
    CONSTRAINT fk_disciplina_deporte
        FOREIGN KEY (idDeporte) REFERENCES deporte(idDeporte)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE formato (
    idFormato INT AUTO_INCREMENT PRIMARY KEY,
    nombreFormato VARCHAR(60) NOT NULL,
    descripcionFormato TEXT NULL,
    imagen_url VARCHAR(255) NULL,
    UNIQUE KEY uq_formato_nombre (nombreFormato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE torneo (
    idTorneo INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NULL COMMENT 'Admite registros heredados hasta activar autenticación obligatoria',
    idDisciplina INT NOT NULL,
    idFormato INT NOT NULL,
    nombreTorneo VARCHAR(100) NOT NULL,
    descripcionTorneo TEXT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE NULL,
    ubicacion VARCHAR(150) NULL,
    cantidadEquipos INT UNSIGNED NULL,
    maxIntegrantesEquipo SMALLINT UNSIGNED NULL COMMENT 'Anula el máximo definido en la disciplina para este torneo',
    estadoGestion VARCHAR(20) NOT NULL DEFAULT 'Programado' COMMENT 'Programado, Suspendido, Cancelado o Cerrado; Próximo/En curso se calcula',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaCierre DATETIME NULL,
    INDEX idx_torneo_usuario (idUsuario),
    INDEX idx_torneo_disciplina_formato (idDisciplina, idFormato),
    INDEX idx_torneo_fechas (fechaInicio, fechaFin),
    CONSTRAINT fk_torneo_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_torneo_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES disciplina(idDisciplina)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_torneo_formato
        FOREIGN KEY (idFormato) REFERENCES formato(idFormato)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE equipo (
    idEquipo INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NULL COMMENT 'Admite registros heredados hasta activar autenticación obligatoria',
    idDisciplina INT NOT NULL,
    nombreEquipo VARCHAR(100) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    capitan VARCHAR(120) NOT NULL COMMENT 'Nombre de compatibilidad; el capitán también se identifica en jugador.esCapitan',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_equipo_usuario (idUsuario),
    INDEX idx_equipo_disciplina (idDisciplina),
    CONSTRAINT fk_equipo_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_equipo_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES disciplina(idDisciplina)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE jugador (
    idJugador INT AUTO_INCREMENT PRIMARY KEY,
    idEquipo INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    dni VARCHAR(20) NULL,
    esCapitan TINYINT(1) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_jugador_equipo (idEquipo),
    UNIQUE KEY uq_jugador_dni (dni),
    UNIQUE KEY uq_jugador_equipo_id (idJugador, idEquipo),
    CONSTRAINT fk_jugador_equipo
        FOREIGN KEY (idEquipo) REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE torneo_equipo (
    idTorneo INT NOT NULL,
    idEquipo INT NOT NULL,
    fechaInscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estadoParticipacion VARCHAR(20) NOT NULL DEFAULT 'Inscripto',
    fechaBaja DATETIME NULL,
    motivoBaja VARCHAR(500) NULL,
    politicaBaja VARCHAR(30) NULL COMMENT 'VictoriaAdministrativa, SinPuntos, PaseRival o Pendiente',
    PRIMARY KEY (idTorneo, idEquipo),
    INDEX idx_torneo_equipo_equipo (idEquipo),
    CONSTRAINT fk_torneo_equipo_torneo
        FOREIGN KEY (idTorneo) REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_torneo_equipo_equipo
        FOREIGN KEY (idEquipo) REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inscripción de jugadores a un torneo. La PK impide que un jugador represente
-- a dos equipos distintos dentro de la misma competencia.
CREATE TABLE torneo_jugador (
    idTorneo INT NOT NULL,
    idJugador INT NOT NULL,
    idEquipo INT NOT NULL,
    fechaInscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'Habilitado',
    PRIMARY KEY (idTorneo, idJugador),
    INDEX idx_torneo_jugador_equipo (idTorneo, idEquipo),
    CONSTRAINT fk_torneo_jugador_equipo
        FOREIGN KEY (idTorneo, idEquipo) REFERENCES torneo_equipo(idTorneo, idEquipo)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_torneo_jugador_jugador
        FOREIGN KEY (idJugador, idEquipo) REFERENCES jugador(idJugador, idEquipo)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE arbitro (
    idArbitro INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NULL COMMENT 'Admite registros heredados hasta activar autenticación obligatoria',
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_arbitro_usuario (idUsuario),
    UNIQUE KEY uq_arbitro_dni (dni),
    UNIQUE KEY uq_arbitro_email (email),
    CONSTRAINT fk_arbitro_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE arbitro_disciplina (
    idArbitro INT NOT NULL,
    idDisciplina INT NOT NULL,
    PRIMARY KEY (idArbitro, idDisciplina),
    CONSTRAINT fk_arbitro_disciplina_arbitro
        FOREIGN KEY (idArbitro) REFERENCES arbitro(idArbitro)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_arbitro_disciplina_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES disciplina(idDisciplina)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE cancha (
    idCancha INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NULL COMMENT 'Admite registros heredados hasta activar autenticación obligatoria',
    nombreCancha VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activa',
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cancha_usuario_nombre (idUsuario, nombreCancha),
    CONSTRAINT fk_cancha_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE cancha_disciplina (
    idCancha INT NOT NULL,
    idDisciplina INT NOT NULL,
    PRIMARY KEY (idCancha, idDisciplina),
    CONSTRAINT fk_cancha_disciplina_cancha
        FOREIGN KEY (idCancha) REFERENCES cancha(idCancha)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cancha_disciplina_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES disciplina(idDisciplina)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE partido (
    idPartido INT AUTO_INCREMENT PRIMARY KEY,
    idTorneo INT NOT NULL,
    idEquipoLocal INT NULL,
    idEquipoVisitante INT NULL,
    marcadorLocal INT UNSIGNED NULL,
    marcadorVisitante INT UNSIGNED NULL,
    jornada INT NOT NULL,
    tipoEtapa VARCHAR(30) NOT NULL DEFAULT 'Liga',
    nombreRonda VARCHAR(60) NULL,
    numeroPartido INT NULL,
    idPartidoOrigenLocal INT NULL,
    idPartidoOrigenVisitante INT NULL,
    idEquipoGanador INT NULL,
    idCancha INT NULL,
    fechaHoraInicio DATETIME NULL,
    fechaHoraFin DATETIME NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'Pendiente',
    tipoResolucion VARCHAR(30) NULL COMMENT 'Normal, VictoriaAdministrativa, SinPuntos, PaseRival o Anulado',
    fechaCierre DATETIME NULL,
    INDEX idx_partido_torneo_jornada (idTorneo, jornada),
    INDEX idx_partido_fecha_hora (fechaHoraInicio),
    INDEX idx_partido_cancha_horario (idCancha, fechaHoraInicio, fechaHoraFin),
    INDEX idx_partido_equipo_local_horario (idEquipoLocal, fechaHoraInicio, fechaHoraFin),
    INDEX idx_partido_equipo_visitante_horario (idEquipoVisitante, fechaHoraInicio, fechaHoraFin),
    UNIQUE KEY uq_partido_torneo_etapa_orden (idTorneo, tipoEtapa, jornada, numeroPartido),
    CONSTRAINT fk_partido_torneo
        FOREIGN KEY (idTorneo) REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_partido_equipo_local
        FOREIGN KEY (idEquipoLocal) REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_partido_equipo_visitante
        FOREIGN KEY (idEquipoVisitante) REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_partido_ganador
        FOREIGN KEY (idEquipoGanador) REFERENCES equipo(idEquipo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_partido_cancha
        FOREIGN KEY (idCancha) REFERENCES cancha(idCancha)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_partido_origen_local
        FOREIGN KEY (idPartidoOrigenLocal) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_partido_origen_visitante
        FOREIGN KEY (idPartidoOrigenVisitante) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE partido_periodo (
    idPeriodo INT AUTO_INCREMENT PRIMARY KEY,
    idPartido INT NOT NULL,
    numeroPeriodo SMALLINT UNSIGNED NOT NULL,
    nombrePeriodo VARCHAR(40) NOT NULL,
    marcadorLocal INT UNSIGNED NOT NULL,
    marcadorVisitante INT UNSIGNED NOT NULL,
    UNIQUE KEY uq_partido_periodo_orden (idPartido, numeroPeriodo),
    CONSTRAINT fk_partido_periodo_partido
        FOREIGN KEY (idPartido) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Un partido puede tener cero, uno o varios árbitros.
CREATE TABLE partido_arbitro (
    idPartido INT NOT NULL,
    idArbitro INT NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'Principal',
    idUsuarioAsignador INT NOT NULL,
    fechaAsignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idPartido, idArbitro),
    INDEX idx_partido_arbitro_arbitro (idArbitro),
    CONSTRAINT fk_partido_arbitro_partido
        FOREIGN KEY (idPartido) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_partido_arbitro_arbitro
        FOREIGN KEY (idArbitro) REFERENCES arbitro(idArbitro)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_partido_arbitro_asignador
        FOREIGN KEY (idUsuarioAsignador) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE reserva_cancha (
    idReserva INT AUTO_INCREMENT PRIMARY KEY,
    idCancha INT NOT NULL,
    idUsuario INT NOT NULL,
    idPartido INT NULL,
    fechaHoraInicio DATETIME NOT NULL,
    fechaHoraFin DATETIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Confirmada',
    motivo VARCHAR(300) NULL,
    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reserva_cancha_horario (idCancha, fechaHoraInicio, fechaHoraFin, estado),
    UNIQUE KEY uq_reserva_partido (idPartido),
    CONSTRAINT fk_reserva_cancha_cancha
        FOREIGN KEY (idCancha) REFERENCES cancha(idCancha)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_cancha_usuario
        FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_cancha_partido
        FOREIGN KEY (idPartido) REFERENCES partido(idPartido)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE acta_partido (
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

CREATE TABLE partido_evento (
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

CREATE TABLE torneo_criterio_desempate (
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

-- Las reglas se evalúan por prioridad y admiten condiciones basadas en sets.
CREATE TABLE torneo_regla_puntuacion (
    idReglaPuntuacion INT AUTO_INCREMENT PRIMARY KEY,
    idTorneo INT NOT NULL,
    prioridad SMALLINT UNSIGNED NOT NULL,
    tipoResultado VARCHAR(30) NOT NULL COMMENT 'Victoria, Empate, Derrota o resolución administrativa',
    setsFavorMin SMALLINT UNSIGNED NULL,
    setsFavorMax SMALLINT UNSIGNED NULL,
    setsContraMin SMALLINT UNSIGNED NULL,
    setsContraMax SMALLINT UNSIGNED NULL,
    puntosTabla SMALLINT NOT NULL,
    UNIQUE KEY uq_torneo_regla_puntuacion_prioridad (idTorneo, prioridad),
    CONSTRAINT fk_torneo_regla_puntuacion_torneo
        FOREIGN KEY (idTorneo) REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE torneo_regla_sancion (
    idReglaSancion INT AUTO_INCREMENT PRIMARY KEY,
    idTorneo INT NOT NULL,
    tipoEvento VARCHAR(30) NOT NULL,
    cantidadAcumulada SMALLINT UNSIGNED NOT NULL,
    partidosSuspension SMALLINT UNSIGNED NOT NULL,
    reiniciarAcumulacion TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY uq_torneo_regla_sancion (idTorneo, tipoEvento, cantidadAcumulada),
    CONSTRAINT fk_torneo_regla_sancion_torneo
        FOREIGN KEY (idTorneo) REFERENCES torneo(idTorneo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE jugador_sancion (
    idSancion INT AUTO_INCREMENT PRIMARY KEY,
    idTorneo INT NOT NULL,
    idJugador INT NOT NULL,
    idReglaSancion INT NULL,
    idEventoOrigen INT NULL,
    motivo VARCHAR(300) NOT NULL,
    partidosPendientes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activa',
    fechaInicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaFin DATETIME NULL,
    INDEX idx_sancion_jugador_torneo (idTorneo, idJugador, estado),
    CONSTRAINT fk_jugador_sancion_inscripcion
        FOREIGN KEY (idTorneo, idJugador) REFERENCES torneo_jugador(idTorneo, idJugador)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_jugador_sancion_regla
        FOREIGN KEY (idReglaSancion) REFERENCES torneo_regla_sancion(idReglaSancion)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_jugador_sancion_evento
        FOREIGN KEY (idEventoOrigen) REFERENCES partido_evento(idEvento)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
