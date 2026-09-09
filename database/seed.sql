-- =========================================================
-- INSERCIÓN DE DATOS INICIALES (SEED DATA)
-- =========================================================

USE global_league;

-- Deportes
INSERT INTO deporte (nombreDeporte, descripcion, imagen_url) VALUES 
('Fútbol', 'Competencias de fútbol en sus distintas modalidades', NULL),
('Basketball', 'Torneos de básquetbol tradicional y 3x3', NULL),
('Volleyball', 'Ligas de vóley de salón y vóley playa', NULL);

-- Disciplinas asociadas a Deportes
INSERT INTO disciplina (idDeporte, nombreDisciplina, descripcionDisciplina, cantidadJugadores) VALUES 
(1, 'Fútbol 11', 'Modalidad de campo completo', 11),
(1, 'Fútbol 7', 'Modalidad de césped sintético', 7),
(1, 'Fútbol 5', 'Modalidad fútsal / césped reducido', 5),
(2, 'Básquet 5v5', 'Básquet de cancha completa', 5),
(2, 'Básquet 3x3', 'Básquet de media cancha', 3),
(3, 'Vóley 6v6', 'Vóley de salón tradicional', 6),
(3, 'Vóley Playa', 'Vóley 2v2 en arena', 2);

-- Formatos de competencia
INSERT INTO formato (nombreFormato, descripcionFormato, imagen_url) VALUES 
('Liga', 'Fase regular todos contra todos por puntos', NULL),
('Eliminación Directa', 'Llaves eliminatorias a partido único', NULL);