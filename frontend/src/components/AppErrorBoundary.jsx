import React from "react";

// Una excepción de una pantalla no debe convertir toda la aplicación en blanco.
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("TimeFlow: error inesperado al mostrar la interfaz", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-3">
          <h1 className="text-xl font-bold">No se pudo mostrar esta pantalla</h1>
          <p className="text-sm text-slate-300">Ocurrió un error inesperado en la interfaz. No se han borrado tus datos de MySQL.</p>
          <p className="text-xs text-slate-400">Si el problema continúa, abre la consola del navegador (F12) para ver el error.</p>
          <button type="button" onClick={() => window.location.reload()}
            className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
            Recargar TimeFlow
          </button>
        </section>
      </main>
    );
  }
}
