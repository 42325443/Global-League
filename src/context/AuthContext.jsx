import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { AuthContext } from './authContextStore';

const obtenerDatos = async (response, mensajePredeterminado) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensajePredeterminado);
  return data;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    const manejarSesionVencida = () => setUser(null);
    window.addEventListener('global-league:session-expired', manejarSesionVencida);

    apiFetch('/auth/me')
      .then((response) => obtenerDatos(response, 'No se pudo validar la sesión.'))
      .then((data) => {
        if (activo) setUser(data.usuario || null);
      })
      .catch(() => {
        if (activo) setUser(null);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
      window.removeEventListener('global-league:session-expired', manejarSesionVencida);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await obtenerDatos(response, 'No se pudo iniciar sesión.');
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const register = useCallback(async (account) => {
    const response = await apiFetch('/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    const data = await obtenerDatos(response, 'No se pudo crear la cuenta.');
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Se limpia el estado local aunque el servidor no responda.
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
