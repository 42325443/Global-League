import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function IconoCorreo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 6.75h16a1.25 1.25 0 0 1 1.25 1.25v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m3.5 7.5 8.5 6.25 8.5-6.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="4.25" y="10" width="15.5" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoVisibilidad({ visible }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.5 9.5 6-.3.6-1.2 1.8-2.6 2.9M6.2 6.3C3.9 7.7 2.7 10 2.5 11c.8 1.5 4.3 6 9.5 6 1 0 1.9-.2 2.8-.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconoEscudo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3.25 19 6v5.2c0 4.55-2.92 7.77-7 9.55-4.08-1.78-7-5-7-9.55V6l7-2.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(form);
      navigate('/inicio', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-11 xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-[24rem] w-[24rem] rounded-full border border-lime-400/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -left-28 h-[34rem] w-[34rem] rounded-full bg-lime-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-slate-950 shadow-lg shadow-lime-950/30">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M7 4.5h10v5.1a5 5 0 0 1-10 0V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M7 6H4.5v2A4.5 4.5 0 0 0 9 12.5M17 6h2.5v2a4.5 4.5 0 0 1-4.5 4.5M12 14.5v4m-4 1h8m-6-1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-montserrat text-base font-extrabold tracking-tight">Global League</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Gestión deportiva</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 max-w-xl sm:mt-9 lg:mt-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300 sm:text-xs sm:tracking-[0.24em]">Tu competencia, en buenas manos</p>
          <h2 className="mt-2 max-w-lg font-montserrat text-2xl font-extrabold leading-tight tracking-tight sm:mt-4 sm:text-4xl xl:text-5xl">
            Organizá el torneo. Disfrutá el juego.
          </h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
            Equipos, partidos y calendario en un mismo lugar, para que cada jornada empiece con todo en orden.
          </p>
          <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
            {['Fútbol', 'Básquet', 'Vóley'].map((deporte) => (
              <span key={deporte} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                {deporte}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Fútbol · Básquet · Vóley
          </p>
        </div>

        <div className="relative z-10 mt-9 hidden lg:block">
          <div className="relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:p-7">
            <svg aria-hidden="true" viewBox="0 0 520 230" fill="none" className="absolute inset-0 h-full w-full text-lime-300/25">
              <rect x="22" y="20" width="476" height="190" rx="18" stroke="currentColor" strokeWidth="1.5" />
              <path d="M260 20v190M22 115h62a38 38 0 0 0 0-76H22m0 152h62a38 38 0 0 0 0-76H22m476-76h-62a38 38 0 0 0 0 76h62m0 76h-62a38 38 0 0 1 0-76h62" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="260" cy="115" r="34" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="260" cy="115" r="2.5" fill="currentColor" />
            </svg>
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-900/85 p-4 shadow-2xl backdrop-blur xl:bottom-7 xl:left-7 xl:right-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">Todo listo para la próxima fecha</p>
                  <p className="mt-1 text-sm font-semibold text-white">Fixture, equipos y horarios conectados.</p>
                </div>
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-300 xl:flex">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <path d="M4 7.5h16M7.5 4v7m9-7v7M5.5 4.75h13A1.75 1.75 0 0 1 20.25 6.5v12A1.75 1.75 0 0 1 18.5 20.25h-13A1.75 1.75 0 0 1 3.75 18.5v-12A1.75 1.75 0 0 1 5.5 4.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m8.5 14 2.25 2.25L16 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-8 hidden text-xs text-slate-500 lg:block">Una plataforma para que el deporte sea protagonista.</p>
      </section>

      <section className="relative z-10 -mt-5 flex min-h-[530px] items-center justify-center overflow-hidden rounded-t-[28px] border-t border-slate-100 bg-white px-5 py-9 shadow-[0_-12px_45px_rgba(15,23,42,0.08)] sm:px-8 lg:z-auto lg:mt-0 lg:min-h-screen lg:rounded-none lg:border-0 lg:px-12 lg:py-10 lg:shadow-none">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 h-72 w-72 rounded-full bg-lime-100/70 blur-3xl lg:hidden" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 lg:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-700">Acceso de organizador</p>
            <h1 className="mt-3 font-montserrat text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Qué bueno tenerte de vuelta</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Ingresá a tu cuenta para continuar organizando tus competencias.</p>
          </div>

          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Correo electrónico
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <IconoCorreo />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="nombre@ejemplo.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
              </span>
            </label>

            <div className="block text-sm font-semibold text-slate-700">
              <label htmlFor="login-password">Contraseña</label>
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <IconoCandado />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Ingresá tu contraseña"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-100"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:text-lime-700"
                >
                  <IconoVisibilidad visible={showPassword} />
                </button>
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-lime-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-lime-900/15 transition hover:bg-lime-700 focus:outline-none focus:ring-4 focus:ring-lime-200 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? 'Ingresando…' : 'Ingresar a mi cuenta'}
              {!submitting && (
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 transition-transform group-hover:translate-x-1">
                  <path d="M3.5 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
            <IconoEscudo />
            <span>Tu cuenta y tus datos están protegidos.</span>
          </div>

          <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
            ¿Todavía no tenés cuenta?{' '}
            <Link to="/registro" className="font-bold text-lime-700 decoration-2 underline-offset-4 hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
