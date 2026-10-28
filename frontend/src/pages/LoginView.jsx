import React, { useState } from "react";
import { ENDPOINTS } from "../config/api_interaccion_backend";

/* ---------- Iconos SVG inline (trazo, currentColor) ---------- */
const Svg = ({ children, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconLock = (p) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);
const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </Svg>
);
const IconMail = (p) => (
  <Svg {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Svg>
);
const IconShieldCheck = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const IconActivity = (p) => (
  <Svg {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);
const IconFileText = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </Svg>
);
const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);
const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);
const IconSpinner = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

/* ---------- Contenido del panel de marca (izquierda) ---------- */
const FEATURES = [
  {
    Icon: IconActivity,
    title: "Monitoreo espacial",
    text: "Visualiza cada nodo de trabajo en tiempo real.",
  },
  {
    Icon: IconFileText,
    title: "Bitácora con evidencia",
    text: "Registra avances y adjunta pruebas por tarea.",
  },
  {
    Icon: IconShieldCheck,
    title: "Aprobaciones claras",
    text: "Valida y cierra entregables con trazabilidad.",
  },
];

// Correos de demostración
const DEMO_ACCOUNTS = [
  { label: "Trabajador", email: "gabriel@teamflow.com" },
  { label: "Admin", email: "admin@teamflow.com" },
];

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Ingresa tu correo para continuar.");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // manda el correo y la contraseña al backend
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // guarda el token para usarlo en las demas peticiones
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // guarda tambien los datos del usuario que inicio sesion
      const loggedUser = data.user || data;
      localStorage.setItem("currentUser", JSON.stringify(loggedUser));
      onLogin?.(loggedUser);

    } catch (err) {
      setError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-100 font-sans text-slate-900">
      {/* Panel de marca */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 text-white px-12 py-10 border-r border-slate-800">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-40"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-extrabold tracking-tight shadow-sm">
            TF
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight leading-none">TeamFlow</p>
            <p className="mt-1 text-xs text-slate-400">Gestión de trabajo y trazabilidad</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            El trabajo del equipo, bajo control y con trazabilidad total.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Inicia sesión para revisar la jornada, monitorear los nodos y resolver las
            aprobaciones pendientes.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-slate-500">
          <IconLock className="w-3.5 h-3.5" />
          <span>Conectado al servidor backend (`http://localhost:8080`).</span>
        </div>
      </aside>

      {/* Panel de formulario */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Marca en móvil */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-extrabold tracking-tight shadow-sm">
              TF
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight leading-none text-slate-900">
                TeamFlow
              </p>
              <p className="mt-1 text-xs text-slate-500">Gestión de trabajo y trazabilidad</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
                  Iniciar sesión
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Ingresa tus credenciales para continuar al panel.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* Correo */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-600 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <IconMail className="w-4 h-4" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    value={email}
                    maxLength={150}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="tu@correo.com"
                    aria-invalid={error ? "true" : "false"}
                    className="w-full pl-9 pr-3 p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <IconLock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    maxLength={64}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••"
                    aria-invalid={error ? "true" : "false"}
                    className="w-full pl-9 pr-11 p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-indigo-600"
                  >
                    {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700"
                >
                  <IconAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Enviar */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <IconSpinner className="w-4 h-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  <>
                    Ingresar
                    <IconArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Cuentas de demostración */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Cuentas de prueba rápida
              </p>
              <ul className="mt-2 space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <li key={acc.email} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700">{acc.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setError("");
                      }}
                      className="font-mono text-slate-600 hover:text-indigo-600 underline decoration-slate-300 underline-offset-2 focus:outline-none focus-visible:text-indigo-600"
                      title="Rellenar correo automáticamente"
                    >
                      {acc.email}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            TeamFlow · Sistema Integrado
          </p>
        </div>
      </main>
    </div>
  );
}