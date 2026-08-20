const agregarJugador = (e) => {
  e.preventDefault();

  if (
    !nombreJugador.trim() ||
    !apellidoJugador.trim() ||
    !dniJugador.trim()
  ) {
    alert("Por favor, completá todos los campos.");
    return;
  }

  const nuevoJugador = {
    id: Date.now(),
    nombre: nombreJugador.trim(),
    apellido: apellidoJugador.trim(),
    dni: dniJugador.trim(),
  };

  setEquipos(
    equipos.map((equipo) => {
      if (equipo.id === equipoSeleccionado.id) {
        return {
          ...equipo,
          jugadores: [...(equipo.jugadores || []), nuevoJugador],
        };
      }

      return equipo;
    })
  );

  setNombreJugador("");
  setApellidoJugador("");
  setDniJugador("");
  setMostrarJugador(false);
  setEquipoSeleccionado(null);

  alert("Jugador agregado correctamente.");
};