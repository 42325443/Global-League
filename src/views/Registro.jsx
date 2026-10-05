import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Registro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmacion: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await register({ nombre: form.nombre, email: form.email, password: form.password });
      navigate('/inicio', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold text-lime-700">Global League</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Cada organizador administra sus propios torneos y equipos.</p>

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Nombre
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contraseña
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">Usá al menos 8 caracteres.</span>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Repetir contraseña
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={form.confirmacion}
              onChange={(event) => setForm((current) => ({ ...current, confirmacion: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tenés cuenta? <Link to="/login" className="font-semibold text-blue-700 hover:underline">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
