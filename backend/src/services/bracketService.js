export const propagarResultadoEliminatoria = async (connection, idTorneo, idPartidoOrigen, idEquipoGanador) => {
  const [destinos] = await connection.query(`
    SELECT idPartido, idPartidoOrigenLocal, idPartidoOrigenVisitante,
      idEquipoLocal, idEquipoVisitante, fechaCierre
    FROM partido
    WHERE idTorneo = ? AND (idPartidoOrigenLocal = ? OR idPartidoOrigenVisitante = ?)
    FOR UPDATE
  `, [idTorneo, idPartidoOrigen, idPartidoOrigen]);

  for (const destino of destinos) {
    if (destino.fechaCierre) continue;
    const [[origenLocal]] = destino.idPartidoOrigenLocal
      ? await connection.query('SELECT estado, tipoResolucion FROM partido WHERE idPartido = ?', [destino.idPartidoOrigenLocal])
      : [[null]];
    const [[origenVisitante]] = destino.idPartidoOrigenVisitante
      ? await connection.query('SELECT estado, tipoResolucion FROM partido WHERE idPartido = ?', [destino.idPartidoOrigenVisitante])
      : [[null]];
    const localEsAnulado = origenLocal?.estado === 'Anulado' && origenLocal?.tipoResolucion === 'Anulado';
    const visitanteEsAnulado = origenVisitante?.estado === 'Anulado' && origenVisitante?.tipoResolucion === 'Anulado';
    const local = Number(destino.idPartidoOrigenLocal) === Number(idPartidoOrigen)
      ? (idEquipoGanador == null ? null : Number(idEquipoGanador))
      : (destino.idEquipoLocal == null ? null : Number(destino.idEquipoLocal));
    const visitante = Number(destino.idPartidoOrigenVisitante) === Number(idPartidoOrigen)
      ? (idEquipoGanador == null ? null : Number(idEquipoGanador))
      : (destino.idEquipoVisitante == null ? null : Number(destino.idEquipoVisitante));

    let ganadorAutomatico = null;
    let anuladoAutomaticamente = false;
    if (local == null && localEsAnulado && visitante != null) ganadorAutomatico = visitante;
    else if (visitante == null && visitanteEsAnulado && local != null) ganadorAutomatico = local;
    else if (local == null && visitante == null && localEsAnulado && visitanteEsAnulado) anuladoAutomaticamente = true;

    const estado = ganadorAutomatico != null
      ? 'Pase libre'
      : anuladoAutomaticamente
        ? 'Anulado'
        : local != null && visitante != null ? 'Pendiente' : 'Esperando equipos';
    const tipoResolucion = ganadorAutomatico != null ? 'PaseRival' : anuladoAutomaticamente ? 'Anulado' : null;
    await connection.query(`
      UPDATE partido
      SET idEquipoLocal = ?, idEquipoVisitante = ?,
        idEquipoGanador = ?, tipoResolucion = ?, estado = ?,
        marcadorLocal = NULL, marcadorVisitante = NULL,
        fechaCierre = NULL,
        idCancha = CASE WHEN ? IS NOT NULL OR ? = 'Anulado' THEN NULL ELSE idCancha END,
        fechaHoraInicio = CASE WHEN ? IS NOT NULL OR ? = 'Anulado' THEN NULL ELSE fechaHoraInicio END,
        fechaHoraFin = CASE WHEN ? IS NOT NULL OR ? = 'Anulado' THEN NULL ELSE fechaHoraFin END
      WHERE idPartido = ?
    `, [
      local, visitante, ganadorAutomatico, tipoResolucion, estado,
      ganadorAutomatico, estado, ganadorAutomatico, estado, ganadorAutomatico, estado, destino.idPartido
    ]);

    if (ganadorAutomatico != null || anuladoAutomaticamente) {
      await connection.query("UPDATE reserva_cancha SET estado = 'Cancelada' WHERE idPartido = ? AND estado <> 'Cancelada'", [destino.idPartido]);
      await connection.query('DELETE FROM partido_arbitro WHERE idPartido = ?', [destino.idPartido]);
      await propagarResultadoEliminatoria(
        connection,
        idTorneo,
        destino.idPartido,
        ganadorAutomatico
      );
    }
  }
};
