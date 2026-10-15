-- Semilla de prueba para actas/posiciones.
-- Requiere que database/schema.sql y database/seed.sql estén cargados antes
-- (necesita los catálogos disciplina 1 = 'Fútbol 11' y formato 1 = 'Liga').
-- Inserta un torneo sin propietario (idUsuario NULL): el primer usuario que se
-- registre en la API lo hereda automáticamente (ver authController.registrarUsuario).

INSERT INTO torneo (idDisciplina, idFormato, nombreTorneo, fechaInicio, fechaFin, estadoGestion)
VALUES (1, 1, 'Test Liga', '2026-01-01', '2026-12-31', 'Programado');
