import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../src/lib/api', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '../src/lib/api';
import TablaPosiciones from '../src/views/TablaPosiciones.jsx';

const ok = (data) => ({ ok: true, status: 200, json: async () => data });
const fail = (status, error) => ({ ok: false, status, json: async () => ({ error }) });

const torneos = [
  { idTorneo: 1, nombreTorneo: 'Liga Primera', modalidad: 'Liga' },
  { idTorneo: 2, nombreTorneo: 'Copa Verano', modalidad: 'Eliminación directa' },
];

const posiciones = (fechaActualizacion = '2026-10-10T20:00:00.000Z') => ({
  torneo: { id: 1, nombre: 'Liga Primera' },
  criteriosDesempate: ['Puntos', 'Diferencia', 'MarcadorAFavor'],
  fechaActualizacion,
  posiciones: [
    { posicion: 1, equipo: 'Atlas', pj: 3, pg: 3, pe: 0, pp: 0, gf: 7, gc: 2, diferencia: 5, puntos: 9 },
    { posicion: 2, equipo: 'Boca', pj: 3, pg: 1, pe: 1, pp: 1, gf: 3, gc: 3, diferencia: 0, puntos: 4 },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TablaPosiciones', () => {
  it('carga el listado de torneos al montar', async () => {
    apiFetch.mockResolvedValueOnce(ok(torneos));
    render(<TablaPosiciones />);
    const select = await screen.findByRole('combobox');
    await waitFor(() => {
      expect(within(select).getAllByRole('option').length).toBeGreaterThan(1);
    });
    expect(within(select).getByText(/Liga Primera/)).toBeInTheDocument();
  });

  it('muestra error cuando no se pueden cargar los torneos', async () => {
    apiFetch.mockResolvedValueOnce(fail(500, 'No se pudieron cargar los torneos.'));
    render(<TablaPosiciones />);
    expect(await screen.findByText(/no se pudieron cargar los torneos/i)).toBeInTheDocument();
  });

  it('calcula la tabla al seleccionar un torneo', async () => {
    apiFetch
      .mockResolvedValueOnce(ok(torneos))         // GET /torneos
      .mockResolvedValueOnce(ok(posiciones()));   // GET /torneos/1/posiciones
    render(<TablaPosiciones />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '1');
    expect(await screen.findAllByText('Atlas')).toHaveLength(2);
    expect(apiFetch).toHaveBeenCalledWith('/torneos/1/posiciones');
    // Encabezados reales de la tabla: '#', 'Equipo', 'PJ'… 'PTS'
    expect(screen.getByRole('columnheader', { name: 'PTS' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Equipo' })).toBeInTheDocument();
  });

  it('refresca la tabla con el botón Actualizar', async () => {
    apiFetch
      .mockResolvedValueOnce(ok(torneos))
      .mockResolvedValueOnce(ok(posiciones('2026-10-10T20:00:00.000Z')))
      .mockResolvedValueOnce(ok(posiciones('2026-10-11T10:30:00.000Z')));
    render(<TablaPosiciones />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '1');
    await screen.findAllByText('Atlas');

    await userEvent.click(screen.getByRole('button', { name: /actualizar/i }));
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(3);
    });
    expect(apiFetch).toHaveBeenLastCalledWith('/torneos/1/posiciones');
  });

  it('muestra alerta de error de red al fallar la actualización', async () => {
    apiFetch
      .mockResolvedValueOnce(ok(torneos))
      .mockResolvedValueOnce(ok(posiciones()))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<TablaPosiciones />);
    await userEvent.selectOptions(await screen.findByRole('combobox'), '1');
    await screen.findAllByText('Atlas');

    await userEvent.click(screen.getByRole('button', { name: /actualizar/i }));
    expect(await screen.findByText(/No se pudo mostrar la competencia/i)).toBeInTheDocument();
  });
});
