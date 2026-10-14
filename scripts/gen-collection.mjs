// Generador de la colección Postman "Global League APIs" (Postman Collection v2.1).
// Espeja las rutas montadas en backend/src/index.js y los payloads de los controladores.
// Uso: node scripts/gen-collection.mjs -> escribe tests/management.postman_collection.json
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tests', 'management.postman_collection.json');

const json = (raw) => ({ mode: 'raw', raw, options: { raw: { language: 'json' } } });
const hdr = () => [{ key: 'Content-Type', value: 'application/json' }];
const url = (segments) => ({ raw: `{{baseUrl}}/${segments.join('/')}`, host: ['{{baseUrl}}'], path: segments });
const req = (method, segments, body) => ({
  method,
  ...(body ? { header: hdr(), body: json(body) } : {}),
  url: url(segments),
});
const folder = (name, items) => ({ name, item: items });
const item = (name, request) => ({ name, request });

const auth = folder('Auth', [
  item('POST Registrar usuario', req('POST', ['auth', 'registro'], '{"nombre":"Juana","email":"juana@global-league.com","password":"Secreta123"}')),
  item('POST Iniciar sesion', req('POST', ['auth', 'login'], '{"email":"juana@global-league.com","password":"Secreta123"}')),
  item('GET Sesion actual', req('GET', ['auth', 'me'])),
  item('POST Cerrar sesion', req('POST', ['auth', 'logout'])),
]);

const catalogos = folder('Catalogos', [
  item('GET Deportes', req('GET', ['catalogos', 'deportes'])),
  item('GET Disciplinas', req('GET', ['catalogos', 'disciplinas'])),
  item('GET Formatos', req('GET', ['catalogos', 'formatos'])),
]);

const torneos = folder('Torneos', [
  item('GET Torneos', req('GET', ['torneos'])),
  item('POST Crear torneo', req('POST', ['torneos'], '{"nombreTorneo":"Liga Apertura 2026","idDisciplina":1,"idFormato":1,"fechaInicio":"2026-11-01","descripcionTorneo":"Torneo de apertura","fechaFin":"2026-12-20","ubicacion":"Estadio Municipal","cantidadEquipos":8,"cantidadEquiposMax":16,"equiposIds":[1,2,3,4]}')),
  item('PUT Actualizar equipos del torneo', req('PUT', ['torneos', '1', 'equipos'], '{"idsEquipos":[1,2,3,4]}')),
  item('PUT Actualizar criterios de desempate', req('PUT', ['torneos', '1', 'criterios-desempate'], '{"criteriosDesempate":["Diferencia","MarcadorAFavor","ResultadoDirecto"]}')),
  item('GET Partidos del torneo', req('GET', ['torneos', '1', 'partidos'])),
  item('GET Posiciones del torneo', req('GET', ['torneos', '1', 'posiciones'])),
  item('POST Generar fixture', req('POST', ['torneos', '1', 'fixture'], '{"jornadaBase":"2026-11-01","fechaBase":"2026-11-01"}')),
  item('POST Registrar baja de equipo', req('POST', ['torneos', '1', 'bajas'], '{"idEquipo":4,"politicaBaja":"Anular"}')),
  item('DELETE Torneo', req('DELETE', ['torneos', '1'])),
]);

const posiciones = folder('Posiciones', [
  item('GET Criterios del torneo', req('GET', ['torneos', '1', 'criterios'])),
  item('PUT Actualizar criterios', req('PUT', ['torneos', '1', 'criterios'], '{"criterios":["Diferencia","MarcadorAFavor","ResultadoDirecto"]}')),
  item('POST Recalcular posiciones', req('POST', ['torneos', '1', 'posiciones', 'actualizar'])),
]);

const calendario = folder('Calendario', [
  item('GET Calendario (partidos del usuario)', req('GET', ['calendario'])),
  item('GET Canchas', req('GET', ['canchas'])),
  item('POST Crear cancha', req('POST', ['canchas'], '{"nombreCancha":"Cancha Central","ubicacion":"Predio Norte","descripcion":"Cesped natural"}')),
  item('PUT Programar partido', req('PUT', ['partidos', '10', 'programacion'], '{"idCancha":1,"fecha":"2026-11-05","horaInicio":"20:30","horaFin":"22:30"}')),
]);

const equipos = folder('Equipos', [
  item('GET Equipos', req('GET', ['equipos'])),
  item('POST Crear equipo', req('POST', ['equipos'], '{"nombreEquipo":"Atlas","idDeporte":1,"idDisciplina":1,"localidad":"Rosario","capitan":"Juan Perez","jugadores":[{"nombre":"Juan","apellido":"Perez","dni":"30111222"},{"nombre":"Luis","apellido":"Gomez","dni":"30222333"}]}')),
  item('GET Equipo por ID', req('GET', ['equipos', '1'])),
  item('PUT Actualizar equipo', req('PUT', ['equipos', '1'], '{"nombreEquipo":"Atlas FC","idDeporte":1,"idDisciplina":1,"localidad":"Rosario","capitan":"Juan Perez"}')),
  item('POST Agregar jugador', req('POST', ['equipos', '1', 'jugadores'], '{"nombre":"Pedro","apellido":"Diaz","dni":"30333444"}')),
  item('PATCH Definir capitan', req('PATCH', ['equipos', '1', 'capitan'], '{"idJugador":5}')),
  item('DELETE Equipo', req('DELETE', ['equipos', '1'])),
]);

const arbitros = folder('Arbitros', [
  item('GET Arbitros', req('GET', ['arbitros'])),
  item('POST Crear arbitro', req('POST', ['arbitros'], '{"nombre":"Juana","apellido":"Lopez","dni":"28999888","email":"juana@global-league.com","telefono":"3415558899","localidad":"Rosario","idDisciplina":1}')),
  item('PATCH Actualizar estado de arbitro', req('PATCH', ['arbitros', '1', 'estado'], '{"estado":"Inactivo"}')),
]);

const estadisticas = folder('Estadisticas', [
  item('GET Estadisticas globales', req('GET', ['estadisticas'])),
  item('GET Estadisticas del torneo', req('GET', ['torneos', '1', 'estadisticas'])),
]);

const actas = folder('Actas digitales', [
  item('GET Partidos sin arbitro', req('GET', ['partidos', 'sin-arbitro'])),
  item('GET Partidos del arbitro', req('GET', ['arbitros', '1', 'partidos'])),
  item('PUT Asignar arbitros al partido', req('PUT', ['partidos', '10', 'arbitros'], '{"idsArbitros":[1],"rolPrincipal":"Principal"}')),
  item('GET Acta del partido', req('GET', ['partidos', '10', 'acta'])),
  item('PUT Guardar borrador de acta', req('PUT', ['partidos', '10', 'acta'], '{"marcadorLocal":0,"marcadorVisitante":0,"periodos":[],"eventos":[],"participantes":[],"observaciones":"Primer intento","idGanador":null,"cerrar":false,"idArbitro":1}')),
  item('PUT Firmar acta (cerrar)', req('PUT', ['partidos', '10', 'acta'], '{"marcadorLocal":1,"marcadorVisitante":1,"periodos":[],"eventos":[],"participantes":[],"observaciones":"Finalizado","idGanador":1,"cerrar":true,"idArbitro":1}')),
  item('PUT Actualizar acta (legacy)', req('PUT', ['partidos', '10', 'acta'], '{"golesLocal":1,"golesVisitante":1,"estadoActa":"cerrada","observaciones":"Finalizado"}')),
  item('POST Registrar incidencia (legacy)', req('POST', ['partidos', '10', 'incidencias'], '{"minuto":23,"idEquipo":1,"tipo":"Gol","idJugador":5,"detalle":"Gol de cabeza"}')),
]);

const collection = {
  info: {
    _name: 'Global League APIs',
    description: 'Coleccion de tests de la API de Global League. Espeja backend/src/index.js y controladores. Variables: baseUrl.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [auth, catalogos, torneos, posiciones, calendario, equipos, arbitros, estadisticas, actas],
};

writeFileSync(out, JSON.stringify(collection, null, 2) + '\n');
console.log(`Coleccion escrita en ${out} (${collection.item.length} carpetas)`);
