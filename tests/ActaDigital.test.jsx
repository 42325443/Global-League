import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../src/lib/api', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '../src/lib/api';
import ActaDigital from '../src/views/ActaDigital.jsx';

const ok = (data) => ({ ok: true, status: 200, json: async () => data });
const fail = (status, error) => ({ ok: false, status, json: async () => ({ error }) });

const partido = {
  idPartido: 10,
  equipoLocal: 'Atlas',
  equipoVisitante: 'Boca',
  estado: 'Pendiente',
  marcadorLocal: null,
  marcadorVisitante: null,
  fechaHoraInicio: '2026-10-10T20:00:00',
};

const actaBorrador = {
  partido,
  acta: { idActa: 1, estado: 'Borrador', observaciones: null, idArbitro: null },
  incidencias: [],
  tiposEvento: ['Gol', 'Tarjeta Amarilla', 'Tarjeta Roja', 'Asistencia', 'Sanción', 'Otro'],
  arbitros: [{ idArbitro: 1, nombre: 'Juan', apellido: 'Pérez', estado: 'Activo' }],
};

const calendarioOk = () => apiFetch.mockResolvedValueOnce(ok([partido]));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActaDigital', () => {
  it('muestra el estado de carga inicial', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    render(<ActaDigital />);
    expect(screen.getByText(/cargando partidos/i)).toBeInTheDocument();
  });

  it('carga el calendario y muestra el selector de partidos', async () => {
    calendarioOk();
    render(<ActaDigital />);
    await waitFor(() => {
      expect(screen.getByText(/seleccioná un partido/i)).toBeInTheDocument();
    });
    expect(apiFetch).toHaveBeenCalledWith('/calendario');
    const opciones = await screen.findAllByRole('option');
    expect(opciones.some((o) => o.textContent.includes('Atlas'))).toBe(true);
  });

  it('muestra error cuando el calendario falla', async () => {
    apiFetch.mockResolvedValueOnce(fail(500, 'No se pudo cargar el calendario.'));
    render(<ActaDigital />);
    expect(await screen.findByText(/no se pudo cargar el calendario/i)).toBeInTheDocument();
  });

  it('carga el acta al seleccionar un partido', async () => {
    calendarioOk();
    apiFetch.mockResolvedValueOnce(ok(actaBorrador));
    render(<ActaDigital />);
    const select = await screen.findByRole('combobox');
    await userEvent.selectOptions(select, '10');
    // El heading parte el texto con un <span> para "vs": se busca por rol.
    expect(await screen.findByRole('heading', { name: /Atlas\s*vs\s*Boca/ })).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/partidos/10/acta');
  });

  it('deshabilita "Firmar y Finalizar Acta" sin declarar conformidad', async () => {
    calendarioOk();
    apiFetch.mockResolvedValueOnce(ok(actaBorrador));
    render(<ActaDigital />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '10');
    const botonFirmar = await screen.findByRole('button', { name: /firmar y finalizar acta/i });
    expect(botonFirmar).toBeDisabled();
  });

  it('habilita el firmado al marcar el checkbox de conformidad', async () => {
    calendarioOk();
    apiFetch.mockResolvedValueOnce(ok(actaBorrador));
    render(<ActaDigital />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '10');
    const botonFirmar = await screen.findByRole('button', { name: /firmar y finalizar acta/i });
    await userEvent.click(screen.getByRole('checkbox'));
    expect(botonFirmar).toBeEnabled();
  });

  it('guarda borrador con el payload correcto (POST /acta/borrador)', async () => {
    calendarioOk();
    apiFetch.mockResolvedValueOnce(ok(actaBorrador)); // GET acta inicial
    render(<ActaDigital />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '10');

    apiFetch.mockResolvedValueOnce(ok({ ...actaBorrador, message: 'Borrador guardado correctamente.' }));
    await userEvent.click(await screen.findByRole('button', { name: /guardar borrador/i }));

    await waitFor(() => {
      expect(screen.getByText(/borrador guardado correctamente/i)).toBeInTheDocument();
    });
    const llamada = apiFetch.mock.calls.at(-1);
    expect(llamada[0]).toBe('/partidos/10/acta/borrador');
    expect(llamada[1].method).toBe('POST');
    const body = JSON.parse(llamada[1].body);
    expect(body).toHaveProperty('marcadorLocal');
    expect(body).toHaveProperty('marcadorVisitante');
    expect(body).toHaveProperty('idArbitro');
    expect(body).toHaveProperty('observaciones');
  });

  it('envía conformidad: true al firmar el acta', async () => {
    calendarioOk();
    apiFetch.mockResolvedValueOnce(ok(actaBorrador));
    render(<ActaDigital />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '10');
    await userEvent.click(screen.getByRole('checkbox'));

    apiFetch.mockResolvedValueOnce(ok({ ...actaBorrador, acta: { ...actaBorrador.acta, estado: 'Firmada' } }));
    await userEvent.click(await screen.findByRole('button', { name: /firmar y finalizar acta/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenLastCalledWith(
        '/partidos/10/acta/firmar',
        expect.objectContaining({ method: 'POST' })
      );
    });
    const body = JSON.parse(apiFetch.mock.calls.at(-1)[1].body);
    expect(body.conformidad).toBe(true);
  });
});
