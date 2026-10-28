import React, { useState, useEffect } from "react";
import { ENDPOINTS, apiFetch } from "./config/api_interaccion_backend";
import WorkdayView from "./pages/WorkdayView";
import MonitoringView from "./pages/MonitoringView";
import TaskTypesView from "./pages/TaskTypesView";
import ChatView from "./pages/ChatView";
import Usuarios from "./pages/Usuarios";
import TaskModal from "./components/TaskModal";
import LoginView from "./pages/LoginView";

export default function App() {
  const [collaborators, setCollaborators] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("currentUser");
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState("jornada");
  const [tasks, setTasks] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("token") && localStorage.getItem("currentUser")));
  const [jornada, setJornada] = useState(null);
  const [jornadaCargando, setJornadaCargando] = useState(true);
  const [jornadaGuardando, setJornadaGuardando] = useState(false);
  const [jornadaError, setJornadaError] = useState("");

  // carga los datos principales despues de iniciar sesion
  const cargarDatosServidor = async () => {
    try {
      const resTareas = await apiFetch(ENDPOINTS.TAREAS);
      if (resTareas.ok) {
        const dataTareas = await resTareas.json();
        setTasks(dataTareas);
      } else {
        console.warn("hubo un error al obtener tareas del servidor.");
      }
    } catch (err) {
      console.error("hubo un error de conexión con tareas:", err);
    }

    try {
      const resUsuarios = await apiFetch(ENDPOINTS.USUARIOS);
      if (resUsuarios.ok) {
        const dataUsuarios = await resUsuarios.json();
        setCollaborators(dataUsuarios);
      } else {
        console.warn("hubo un error al obtener usuarios del servidor.");
      }
    } catch (err) {
      console.warn("hubo un error al cargar colaboradores:", err);
    }

    try {
      const resTipos = await apiFetch(ENDPOINTS.TIPOS_TAREA);
      if (resTipos.ok) {
        const dataTipos = await resTipos.json();
        setTaskTypes(dataTipos);
      } else {
        console.warn("hubo un error al obtener tipos de tarea del servidor.");
      }
    } catch (err) {
      console.warn("hubo un error al cargar tipos de tareas:", err);
    }

    try {
      const resMensajes = await apiFetch(ENDPOINTS.MENSAJES);
      if (resMensajes.ok) {
        const dataMensajes = await resMensajes.json();
        setMessages(dataMensajes);
      } else {
        console.warn("hubo un error al obtener mensajes del servidor.");
      }
    } catch (err) {
      console.warn("hubo un error al cargar mensajes:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatosServidor();
    }
  }, [isAuthenticated]);

  // La jornada se obtiene de MySQL; no se infiere de un reloj o estado local.
  useEffect(() => {
    let cancelado = false;
    if (!isAuthenticated || !currentUser?.id) {
      setJornada(null);
      setJornadaCargando(false);
      return;
    }
    setJornada(null);
    setJornadaCargando(true);
    setJornadaError("");
    apiFetch(`${ENDPOINTS.JORNADAS}/actual`)
      .then(async (res) => {
        // Una version nueva puede invalidar el JWT guardado por una instalacion anterior.
        // En ese caso vuelve al login, en vez de bloquear permanentemente Check In.
        if (res.status === 401) {
          if (!cancelado) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            setIsAuthenticated(false);
            setCurrentUser(null);
            setSelectedTask(null);
            setJornada(null);
          }
          return null;
        }
        if (!res.ok) throw new Error("No se pudo consultar la jornada. Comprueba el backend.");
        return res.status === 204 ? null : res.json();
      })
      .then((data) => { if (!cancelado) setJornada(data); })
      .catch((err) => { if (!cancelado) setJornadaError(err.message); })
      .finally(() => { if (!cancelado) setJornadaCargando(false); });
    return () => { cancelado = true; };
  }, [isAuthenticated, currentUser?.id]);

  const actualizarJornadaDesdeServidor = async () => {
    const res = await apiFetch(`${ENDPOINTS.JORNADAS}/actual`);
    if (!res.ok) throw new Error("No se pudo actualizar el estado de la jornada.");
    setJornada(res.status === 204 ? null : await res.json());
  };

  const operarJornada = async (accion) => {
    if (!currentUser || jornadaGuardando || jornadaCargando || jornadaError) return;
    setJornadaGuardando(true);
    setJornadaError("");
    try {
      const res = await apiFetch(`${ENDPOINTS.JORNADAS}/${accion}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Un segundo dispositivo puede haber modificado la jornada.
        if (res.status === 409) {
          try { await actualizarJornadaDesdeServidor(); } catch { /* Se muestra el error original. */ }
        }
        throw new Error(data.message || "No se pudo registrar la jornada.");
      }
      setJornada(data);
    } catch (err) {
      setJornadaError(err.message || "Error al comunicarse con el backend.");
    } finally {
      setJornadaGuardando(false);
    }
  };

  const handleCheckIn = () => operarJornada("check-in");
  const handleCheckOut = () => {
    const pendientes = tasks.filter((t) => t.asignadoA === currentUser?.nombre && t.estado !== "Finalizada");
    if (pendientes.length && !window.confirm(`Tienes ${pendientes.length} tarea(s) sin finalizar. ¿Registrar salida igualmente?`)) return;
    return operarJornada("check-out");
  };

  const handleAddTask = async (newTask) => {
    if (!jornada?.activa || jornadaCargando || jornadaError) {
      throw new Error("Debes registrar Check In antes de crear una tarea.");
    }
    try {
      const res = await apiFetch(ENDPOINTS.TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          try { await actualizarJornadaDesdeServidor(); } catch { /* El backend ya rechazó la tarea. */ }
        }
        throw new Error(data.message || "No se pudo guardar la tarea en MySQL.");
      }
      setTasks((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("No se creó la tarea:", err);
      throw err;
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (res.ok) {
        const tareaActualizada = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t))
        );
        if (selectedTask && selectedTask.id === tareaActualizada.id) {
          setSelectedTask(tareaActualizada);
        }
        return tareaActualizada;
      } else {
        console.error("hubo un error al actualizar la tarea en el backend.");
        return null;
      }
    } catch (err) {
      console.error("hubo un error en la solicitud de actualización:", err);
      return null;
    }
  };

  const handleMoveTask = async (taskId, posicionX, posicionY) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${taskId}/posicion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posicionX, posicionY }),
      });

      if (!res.ok) {
        console.error("hubo un error al guardar la posición de la tarea.");
        return null;
      }

      const tareaActualizada = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t))
      );
      if (selectedTask && selectedTask.id === tareaActualizada.id) {
        setSelectedTask(tareaActualizada);
      }
      return tareaActualizada;
    } catch (err) {
      console.error("hubo un error al guardar la posición de la tarea:", err);
      return null;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null);
        }
      } else {
        console.error("hubo un error al eliminar la tarea.");
      }
    } catch (err) {
      console.error("hubo un error en la solicitud de eliminación:", err);
    }
  };

  const handleSendToReview = (taskId) => {
    const tarea = tasks.find((t) => t.id === taskId);
    if (tarea) {
      handleUpdateTask({ ...tarea, estado: "En Revisión" });
    }
  };

  const handleApproveTask = (taskId) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const tarea = tasks.find((t) => t.id === taskId);
    if (tarea) {
      handleUpdateTask({ ...tarea, estado: "Finalizada", fechaFin: time });
    }
  };

  const handleRejectTask = (taskId) => {
    const tarea = tasks.find((t) => t.id === taskId);
    if (tarea) {
      handleUpdateTask({ ...tarea, estado: "En Progreso" });
    }
  };

  const handleAddType = async (newTypeObj) => {
    try {
      const res = await apiFetch(ENDPOINTS.TIPOS_TAREA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTypeObj),
      });
      if (res.ok) {
        const guardado = await res.json();
        setTaskTypes((prev) => [...prev, guardado]);
      } else {
        console.error("hubo un error al guardar el tipo de tarea.");
      }
    } catch (err) {
      console.error("hubo un error en la creación del tipo de tarea:", err);
    }
  };

  const handleUpdateType = async (id, fields) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const actualizado = await res.json();
        setTaskTypes((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
      } else {
        console.error("hubo un error al actualizar el tipo de tarea.");
      }
    } catch (err) {
      console.error("hubo un error en la actualización del tipo de tarea:", err);
    }
  };

  const handleDeleteType = async (id) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTaskTypes((prev) => prev.filter((item) => item.id !== id));
      } else {
        console.error("hubo un error al eliminar el tipo de tarea.");
      }
    } catch (err) {
      console.error("hubo un error en la eliminación del tipo de tarea:", err);
    }
  };

  const handleSendMessage = async (newMsg) => {
    try {
      const res = await apiFetch(ENDPOINTS.MENSAJES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (res.ok) {
        const guardado = await res.json();
        setMessages((prev) => [...prev, guardado]);
      } else {
        console.error("hubo un error al guardar el mensaje.");
      }
    } catch (err) {
      console.error("hubo un error al enviar el mensaje:", err);
    }
  };

  // deja guardado el usuario que devolvio el login
  const handleLogin = (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setJornada(null);
    setIsAuthenticated(true);
  };

  // al cerrar sesion borra el jwt y limpia el usuario actual
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setSelectedTask(null);
    setCurrentUser(null);
    setJornada(null);
    setJornadaError("");
  };

  const userTasks = tasks.filter((t) => t.asignadoA === currentUser?.nombre);

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center border-b border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm tracking-wider">
            TF
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">TeamFlow</h1>
            <span className="text-[10px] text-slate-400">Sistema Conectado a BD</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser?.nombre ? currentUser.nombre.substring(0, 2).toUpperCase() : "US"}
            </div>
            <div className="text-xs leading-tight">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Usuario en Sesión:</span>
              <span className="text-slate-100 font-semibold">
                {currentUser?.nombre} ({currentUser?.rol === "admin" ? "Admin" : "Trabajador"})
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="h-9 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            title="Cerrar sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <nav className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("monitoreo")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "monitoreo"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Monitoreo Espacial & Nodos
          </button>
          <button
            onClick={() => setActiveTab("jornada")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "jornada"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Mi Jornada & Bitácora ({userTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Chat & Anuncios
          </button>
          {currentUser?.rol === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("tipos")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "tipos"
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tipos de Tareas (Admin)
              </button>
              <button
                onClick={() => setActiveTab("usuarios")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "usuarios"
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Gestión Usuarios (Admin)
              </button>
            </>
          )}
        </nav>

        <main>
          {activeTab === "monitoreo" && (
            <MonitoringView
              collaborators={collaborators.filter((c) => c.rol !== "admin")}
              tasks={tasks}
              currentUser={currentUser}
              onSelectTask={setSelectedTask}
              onMoveTask={handleMoveTask}
            />
          )}

          {activeTab === "jornada" && (
            <WorkdayView
              currentUser={currentUser}
              tareasPreestablecidas={taskTypes}
              userTasks={userTasks}
              jornada={jornada}
              jornadaCargando={jornadaCargando}
              jornadaGuardando={jornadaGuardando}
              jornadaError={jornadaError}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onSendToReview={handleSendToReview}
            />
          )}

          {activeTab === "chat" && (
            <ChatView
              currentUser={currentUser}
              collaborators={collaborators}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "tipos" && currentUser?.rol === "admin" && (
            <TaskTypesView
              taskTypes={taskTypes}
              onAddType={handleAddType}
              onUpdateType={handleUpdateType}
              onDeleteType={handleDeleteType}
            />
          )}

          {activeTab === "usuarios" && currentUser?.rol === "admin" && (
            <Usuarios onUsuariosChange={setCollaborators} />
          )}
        </main>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onApproveTask={handleApproveTask}
          onRejectTask={handleRejectTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
}