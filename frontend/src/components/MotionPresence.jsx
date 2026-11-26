import { useEffect, useState } from "react";

// Conservar 150 ms para el cierre visual, pero desactivar interacción desde el primer render.
// Cada apertura remonta el contenido: una confirmación cancelada nunca conserva su paso previo.
export default function MotionPresence({ show, children, duration = 150 }) {
  const [retained, setRetained] = useState(children);
  const [previousShow, setPreviousShow] = useState(show);
  const [generation, setGeneration] = useState(0);
  if (show !== previousShow) {
    setPreviousShow(show);
    if (show) setGeneration(value => value + 1);
  }
  if (show && retained !== children) setRetained(children);
  const leaving = !show;
  useEffect(() => {
    if (show || retained == null) return;
    const timer = window.setTimeout(() => setRetained(null), duration);
    return () => window.clearTimeout(timer);
  }, [show, retained, duration]);
  if (!show && retained == null) return null;
  return <div key={generation}
    className={`tf-presence-overlay ${leaving ? "tf-presence-leaving" : "tf-presence-entering"}`}
    aria-hidden={leaving ? "true" : undefined} inert={leaving ? true : undefined}>
    {show ? children : retained}
  </div>;
}
