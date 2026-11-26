import { Component } from "react";

// Una importación o API no compatible del visor no debe vaciar toda la aplicación.
export default class PreviewBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p role="alert" className="text-xs text-rose-700">El visor no está disponible en este navegador. Puedes descargar el archivo.</p>
      : this.props.children;
  }
}
