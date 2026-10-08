-- Agrega metadatos para generar y mostrar fixtures de Liga y Eliminación Directa.
-- Esta migración conserva los partidos existentes y se ejecuta una sola vez.
USE global_league;

ALTER TABLE partido
    ADD COLUMN tipoEtapa VARCHAR(30) NOT NULL DEFAULT 'Liga' AFTER jornada,
    ADD COLUMN nombreRonda VARCHAR(60) NULL AFTER tipoEtapa,
    ADD COLUMN numeroPartido INT NULL AFTER nombreRonda,
    ADD COLUMN idPartidoOrigenLocal INT NULL AFTER numeroPartido,
    ADD COLUMN idPartidoOrigenVisitante INT NULL AFTER idPartidoOrigenLocal,
    ADD UNIQUE KEY uq_partido_torneo_etapa_orden (idTorneo, tipoEtapa, jornada, numeroPartido),
    ADD INDEX idx_partido_torneo_jornada (idTorneo, jornada);
