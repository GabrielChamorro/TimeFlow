import React, { useState, useEffect, useRef, useCallback } from "react";
import { clearSession, restoreSession, logoutSession } from "./config/session.js";
import { ENDPOINTS, apiFetch } from "./config/api_interaccion_backend";
import { ensureListPayload, sessionIsCurrent } from "./utils/sessionData.js";
import useTaskSync from "./hooks/useTaskSync.js";
import { TaskClockContext } from "./config/taskClockContext.js";
import { newerJornada, taskRefreshNeeded } from "./utils/taskClock.js";
import WorkdayView from "./pages/WorkdayView";
import useTeamPresence from "./hooks/useTeamPresence.js";
import { reuseUnchangedTasks, completedTaskSignature } from "./utils/taskSyncState.js";
import HistoryView from "./pages/HistoryView.jsx";
import MonitoringView from "./pages/MonitoringView";
import TaskTypesView from "./pages/TaskTypesView";
import ChatView from "./pages/ChatView";
import Usuarios from "./pages/Usuarios";
import TaskModal from "./components/TaskModal";
import MotionPresence from "./components/MotionPresence.jsx";
import DemoTaskModal from "./components/DemoTaskModal";
import LoginView from "./pages/LoginView";
import { createSprint5DemoTasks } from "./data/sprint5DemoTasks";

export default function App() {
  const [collaborators, setCollaborators] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  // ?demoSprint5=100 funciona solo en npm run dev. No altera tareas reales.
  const demoSprint5 = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get("demoSprint5") === "100";
  const demoTasks = useState(() => createSprint5DemoTasks(100))[0];
  const [activeTab, setActiveTab] = useState("jornada");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [tasks, storeTasks] = useState([]);
  const lastTaskWrite = useRef(0);
  const setTasks = useCallback(value => { lastTaskWrite.current = performance.now(); storeTasks(value); }, []);
  const [tasksReady, setTasksReady] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const lastMessageMutation = useRef(0);
  // Las peticiones iniciadas por otra sesión nunca deben poblar una sesión nueva.
  const sessionEpoch = useRef(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [selectedDemoTask, setSelectedDemoTask] = useState(null);
  const closeDemoTask = useCallback(() => setSelectedDemoTask(null), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jornada, setJornada] = useState(null);
  const [jornadaCargando, setJornadaCargando] = useState(true);
  const [jornadaGuardando, setJornadaGuardando] = useState(false);
  const [jornadaError, setJornadaError] = useState("");
  const [presenceRefresh, setPresenceRefresh] = useState(0);
  const taskSync = useTaskSync(isAuthenticated, currentUser?.id, presenceRefresh);
  const presence = useTeamPresence(isAuthenticated && activeTab === "monitoreo", currentUser?.id, presenceRefresh);

  useEffect(() => {
    let active = true;
    setSessionLoading(true); setSessionError("");
    restoreSession().then(data => {
      if (active && data) { setCurrentUser(data.user); setIsAuthenticated(true); }
    }).catch(() => { if (active) setSessionError("No se pudo comprobar tu sesión. Comprueba la conexión y reintenta."); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, [sessionRetry]);
  useEffect(() => {
    const expired = () => {
      sessionEpoch.current += 1; setIsAuthenticated(false); setCurrentUser(null);
      setTasks([]); setTasksReady(false); setCollaborators([]); setTaskTypes([]); setMessages([]); setSelectedTask(null);
    };
    window.addEventListener("timeflow-session-ended", expired);
    return () => window.removeEventListener("timeflow-session-ended", expired);
  }, [setTasks]);

  // carga los datos principales despues de iniciar sesion
  const cargarDatosServidor = useCallback(async (epoch) => {
    const started = performance.now();
    try {
      const resTareas = await apiFetch(ENDPOINTS.TAREAS);
      if (resTareas.ok) {
        const dataTareas = await resTareas.json();
        if (sessionIsCurrent(epoch, sessionEpoch.current)) {
          if (lastTaskWrite.current <= started) setTasks(previous => reuseUnchangedTasks(previous, ensureListPayload(dataTareas, "dataTareas")));
          setTasksReady(true);
        }
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
        if (sessionIsCurrent(epoch, sessionEpoch.current)) setCollaborators(ensureListPayload(dataUsuarios, "dataUsuarios"));
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
        if (sessionIsCurrent(epoch, sessionEpoch.current)) setTaskTypes(ensureListPayload(dataTipos, "dataTipos"));
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
        if (sessionIsCurrent(epoch, sessionEpoch.current)) setMessages(ensureListPayload(dataMensajes, "dataMensajes"));
      } else {
        console.warn("hubo un error al obtener mensajes del servidor.");
      }
    } catch (err) {
      console.warn("hubo un error al cargar mensajes:", err);
    }
  }, [setTasks]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const epoch = ++sessionEpoch.current;
    cargarDatosServidor(epoch);
    return () => {
      if (sessionIsCurrent(epoch, sessionEpoch.current)) sessionEpoch.current += 1;
    };
  }, [isAuthenticated, currentUser?.id, cargarDatosServidor]);

  useEffect(() => {
    if (!taskSync?.available || !tasksReady) return;
    setJornada(current => newerJornada(current, taskSync.ownJornada));
    if (taskSync.receivedMono < lastTaskWrite.current) return;
    if (!taskRefreshNeeded(tasks, taskSync.tasks)) {
      const records = new Map(taskSync.tasks.map(t => [String(t.id), t.ultimoRegistroId]));
      if (tasks.some(t => t.ultimoRegistroId !== records.get(String(t.id))))
        setTasks(previous => previous.map(t => t.ultimoRegistroId === records.get(String(t.id)) ? t : { ...t, ultimoRegistroId: records.get(String(t.id)) }));
      return;
    }
    let cancelled = false;
    const controller = new AbortController(), epoch = sessionEpoch.current, started = performance.now();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    apiFetch(ENDPOINTS.TAREAS, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = ensureListPayload(await response.json(), "tareas");
      if (!cancelled && sessionIsCurrent(epoch, sessionEpoch.current) && lastTaskWrite.current <= started) setTasks(previous => reuseUnchangedTasks(previous, data));
    }).catch(() => { /* Mantener datos y borradores; el siguiente intervalo reintenta. */ })
      .finally(() => window.clearTimeout(timeout));
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timeout); };
  }, [taskSync, tasksReady, tasks, setTasks]);

  // Solo se consultan mensajes mientras la pestaña chat está visible.
  // No recarga la página ni solicita reiteradamente tareas con imágenes grandes.
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "chat") return;
    let cancelled = false;
    const epoch = sessionEpoch.current;
    let busy = false;
    const refreshMessages = async () => {
      if (cancelled || busy || document.hidden) return;
      busy = true;
      const started = Date.now();
      try {
        const response = await apiFetch(ENDPOINTS.MENSAJES);
        if (response.ok) {
          const next = await response.json();
          // No sobrescribir un mensaje enviado mientras la consulta estaba pendiente.
          if (!cancelled && sessionIsCurrent(epoch, sessionEpoch.current) && lastMessageMutation.current < started)
            setMessages(ensureListPayload(next, "mensajes"));
        }
      } catch (error) {
        if (!cancelled) console.warn("No se pudieron actualizar los mensajes", error);
      } finally {
        busy = false;
      }
    };
    refreshMessages();
    const intervalId = window.setInterval(refreshMessages, 30000);
    const onVisible = () => { if (!document.hidden) refreshMessages(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeTab, isAuthenticated]);

  // Actualizar desde la API sin recargar toda la aplicación.
  const refreshActiveTab = async () => {
    if (refreshing) return;
    if (activeTab === "historial") { setHistoryRefresh(value => value + 1); return; }
    const epoch = sessionEpoch.current;
    setRefreshing(true);
    const started = performance.now();
    try {
      const url = activeTab === "chat" ? ENDPOINTS.MENSAJES
        : activeTab === "usuarios" ? ENDPOINTS.USUARIOS
        : activeTab === "tipos" ? ENDPOINTS.TIPOS_TAREA
        : ENDPOINTS.TAREAS;
      const response = await apiFetch(url);
      if (!response.ok) throw new Error("No se pudieron cargar los datos del servidor");
      const data = ensureListPayload(await response.json(), activeTab);
      if (!sessionIsCurrent(epoch, sessionEpoch.current)) return;
      if (activeTab === "chat") setMessages(data);
      else if (activeTab === "usuarios") setCollaborators(data);
      else if (activeTab === "tipos") setTaskTypes(data);
      else if (lastTaskWrite.current <= started) { setTasks(previous => reuseUnchangedTasks(previous, data)); setTasksReady(true); }
    } catch (error) {
      console.warn("No se pudieron actualizar los datos:", error);
    } finally {
      setRefreshing(false);
    }
  };

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
            clearSession();
            
            sessionEpoch.current += 1;
            setTasks([]); setTasksReady(false);
            setCollaborators([]);
            setTaskTypes([]);
            setMessages([]);
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
      .then((data) => { if (!cancelado) setJornada(current => newerJornada(current, data)); })
      .catch((err) => { if (!cancelado) setJornadaError(err.message); })
      .finally(() => { if (!cancelado) setJornadaCargando(false); });
    return () => { cancelado = true; };
  }, [isAuthenticated, currentUser?.id, setTasks]);

  const actualizarJornadaDesdeServidor = async () => {
    const res = await apiFetch(`${ENDPOINTS.JORNADAS}/actual`);
    if (!res.ok) throw new Error("No se pudo actualizar el estado de la jornada.");
    const data = res.status === 204 ? null : await res.json();
    setJornada(current => newerJornada(current, data));
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
      setPresenceRefresh(value => value + 1);
    } catch (err) {
      setJornadaError(err.message || "Error al comunicarse con el backend.");
    } finally {
      setJornadaGuardando(false);
    }
  };

  const handleCheckIn = () => operarJornada("check-in");
  const handleCheckOut = () => operarJornada("check-out");

  const handleAddTask = async (newTask) => {
    const epoch = sessionEpoch.current;
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
      if (sessionIsCurrent(epoch, sessionEpoch.current)) setTasks((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("No se creó la tarea:", err);
      throw err;
    }
  };

  const handleSelectTaskOnMap = (task) => {
    setHighlightedTaskId(task?.id ?? null);
    setSelectedTask(task);
  };

  const handleUploadEvidence = async (taskId, file) => {
    const body = new FormData();
    body.append("archivo", file);
    const res = await apiFetch(`${ENDPOINTS.TAREAS}/${taskId}/evidencias`, { method: "POST", body });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Error ${res.status}`);
    }
    return res.json();
  };

  const handleUpdateTask = async (updatedTask) => {
    const epoch = sessionEpoch.current;
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (res.ok) {
        const tareaActualizada = await res.json();
        if (!sessionIsCurrent(epoch, sessionEpoch.current)) return null;
        setTasks((prev) =>
          prev.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t))
        );
        if (selectedTask && selectedTask.id === tareaActualizada.id) {
          setSelectedTask(tareaActualizada);
        }
        return tareaActualizada;
      } else {
        const details = await res.json().catch(() => ({}));
        if (res.status === 409) {
          return { conflict: true, message: details.message || "Otra sesión modificó la tarea." };
        }
        return null;
      }
    } catch (err) {
      console.error("hubo un error en la solicitud de actualización:", err);
      return null;
    }
  };

  const handleMoveTask = async (taskId, posicionX, posicionY, anteriorX, anteriorY) => {
    const epoch = sessionEpoch.current;
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${taskId}/posicion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posicionX, posicionY, anteriorX, anteriorY }),
      });

      if (!res.ok) {
        console.error("hubo un error al guardar la posición de la tarea.");
        return null;
      }

      const tareaActualizada = await res.json();
      if (!sessionIsCurrent(epoch, sessionEpoch.current)) return null;
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

  // Una autoorganización se guarda en una transacción, nunca con PATCH por nodo.
  const handleApplyAutoLayout = async (propuestas) => {
    const epoch = sessionEpoch.current;
    const response = await apiFetch(`${ENDPOINTS.TAREAS}/posiciones`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propuestas),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || `No se pudieron guardar las posiciones (HTTP ${response.status}).`);
    }
    const saved = await response.json();
    if (!sessionIsCurrent(epoch, sessionEpoch.current)) {
      throw new Error("La sesión cambió mientras se guardaba. Actualiza el mapa.");
    }
    if (!Array.isArray(saved) || saved.length !== propuestas.length) {
      throw new Error("El servidor no confirmó todas las posiciones. Actualiza el mapa.");
    }
    const byId = new Map(saved.map(row => [String(row.id), row]));
    if (new Set(saved.map(row => String(row.id))).size !== saved.length
        || propuestas.some(row => !byId.has(String(row.id)))) {
      throw new Error("El servidor devolvió un resultado de posiciones incompleto.");
    }
    const update = task => {
      const position = byId.get(String(task.id));
      return position ? { ...task, posicionX: position.posicionX, posicionY: position.posicionY } : task;
    };
    setTasks(previous => previous.map(update));
    setSelectedTask(previous => previous ? update(previous) : previous);
    return saved;
  };

  const handleDeleteTask = async (taskId, version) => {
    const epoch = sessionEpoch.current;
    try {
      const res = await apiFetch(`${ENDPOINTS.TAREAS}/${taskId}?version=${encodeURIComponent(version)}`, { method: "DELETE" });
      if (res.ok && sessionIsCurrent(epoch, sessionEpoch.current)) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null);
        }
        if (String(highlightedTaskId) === String(taskId)) setHighlightedTaskId(null);
        return true;
      }
      if (res.status === 409) { const data=await res.json().catch(()=>({})); return {conflict:true,message:data.message||"Otra sesión modificó la tarea. Revisa la versión reciente."}; }
      console.error("No se pudo desactivar la tarea.");
      return false;
    } catch (err) {
      console.error("hubo un error en la solicitud de eliminación:", err);
      return false;
    }
  };

  const handleSendToReview = (taskId) => {
    const tarea = tasks.find((t) => t.id === taskId);
    if (tarea) {
      handleUpdateTask({ ...tarea, estado: "En Revisión" });
    }
  };

  const handleApproveTask = (taskId, _reason, version, baseTask) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const tarea = baseTask || tasks.find((t) => t.id === taskId);
    if (tarea) {
      return handleUpdateTask({ ...tarea, version: version ?? tarea.version, estado: "Finalizada", fechaFin: time });
    }
    return Promise.resolve(null);
  };

  const handleRejectTask = (taskId, motivoRechazo, version, baseTask) => {
    const tarea = baseTask || tasks.find((t) => t.id === taskId);
    if (tarea) {
      return handleUpdateTask({ ...tarea, version: version ?? tarea.version, estado: "En Progreso", motivoRechazo });
    }
    return Promise.resolve(null);
  };

  // Los formularios administrativos esperan la respuesta del servidor antes de cerrarse.
  const readTypeMutation = async (response, fallback) => {
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error=new Error(body?.message || fallback); error.status=response.status; throw error;
    }
    return body;
  };

  const handleAddType = async (newTypeObj) => {
    const epoch = sessionEpoch.current;
    const res = await apiFetch(ENDPOINTS.TIPOS_TAREA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTypeObj),
    });
    const guardado = await readTypeMutation(res, "No se pudo guardar la plantilla");
    if (!sessionIsCurrent(epoch, sessionEpoch.current)) throw new Error("La sesión cambió durante la operación");
    setTaskTypes((prev) => [...prev, guardado]);
    return guardado;
  };

  const handleUpdateType = async (id, fields) => {
    const epoch = sessionEpoch.current;
    const res = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const actualizado = await readTypeMutation(res, "No se pudo actualizar la plantilla");
    if (!sessionIsCurrent(epoch, sessionEpoch.current)) throw new Error("La sesión cambió durante la operación");
    setTaskTypes((prev) => prev.map((item) => String(item.id) === String(id) ? actualizado : item));
    return actualizado;
  };

  const handleDeleteType = async (id, version) => {
    const epoch = sessionEpoch.current;
    const res = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/${id}?version=${encodeURIComponent(version)}`, { method: "DELETE" });
    await readTypeMutation(res, "No se pudo desactivar la plantilla");
    if (!sessionIsCurrent(epoch, sessionEpoch.current)) throw new Error("La sesión cambió durante la operación");
    setTaskTypes((prev) => prev.filter((item) => String(item.id) !== String(id)));
    return true;
  };

  const handleReactivateType = async (id) => {
    const epoch = sessionEpoch.current;
    const res = await apiFetch(`${ENDPOINTS.TIPOS_TAREA}/${id}/reactivar`, { method: "PATCH" });
    const actualizado = await readTypeMutation(res, "No se pudo reactivar la plantilla");
    if (!sessionIsCurrent(epoch, sessionEpoch.current)) throw new Error("La sesión cambió durante la operación");
    setTaskTypes((prev) => [...prev.filter((item) => String(item.id) !== String(id)), actualizado]);
    return actualizado;
  };

  const handleSendMessage = async (newMsg) => {
    const epoch = sessionEpoch.current;
    lastMessageMutation.current = Date.now();
    try {
      const res = await apiFetch(ENDPOINTS.MENSAJES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (res.ok) {
        const guardado = await res.json();
        if (sessionIsCurrent(epoch, sessionEpoch.current)) {
          lastMessageMutation.current = Date.now();
          setMessages((prev) => [...prev, guardado]);
        }
      } else {
        console.error("hubo un error al guardar el mensaje.");
      }
    } catch (err) {
      console.error("hubo un error al enviar el mensaje:", err);
    }
  };

  // deja guardado el usuario que devolvio el login
  const handleLogin = (user) => {
    sessionEpoch.current += 1;
    setTasks([]); setTasksReady(false);
    setCollaborators([]);
    setTaskTypes([]);
    setMessages([]);

    setCurrentUser(user);
    setJornada(null);
    setIsAuthenticated(true);
  };

  // al cerrar sesion borra el jwt y limpia el usuario actual
  const handleLogout = async () => {
    try {
      await logoutSession();
    } catch {
      window.alert("No se pudo confirmar el cierre de sesión en el servidor. Reintenta cuando haya conexión.");
      return;
    }
    sessionEpoch.current += 1;
    setTasks([]); setTasksReady(false);
    setCollaborators([]);
    setTaskTypes([]);
    setMessages([]);
    clearSession();
    
    setIsAuthenticated(false);
    setSelectedTask(null);
    setHighlightedTaskId(null);
    setSelectedDemoTask(null);
    setCurrentUser(null);
    setJornada(null);
    setJornadaError("");
  };

  const userTasks = tasks.filter((t) => t.asignadoUsuarioId != null
    ? Number(t.asignadoUsuarioId) === Number(currentUser?.id)
    : t.asignadoA === currentUser?.nombre);

  if (sessionLoading) return <div role="status" className="p-8 text-slate-700">Comprobando sesión…</div>;
  if (sessionError) return <div role="alert" className="p-8 text-slate-700">{sessionError} <button onClick={() => setSessionRetry(value => value + 1)}>Reintentar</button></div>;
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <TaskClockContext.Provider value={taskSync}>
    <div className="tf-ui min-h-screen bg-slate-100 flex flex-col font-sans">
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
        <nav aria-label="Secciones principales" className="tf-primary-nav flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("monitoreo")}
                aria-current={activeTab === "monitoreo" ? "page" : undefined}
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
                aria-current={activeTab === "jornada" ? "page" : undefined}
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
                aria-current={activeTab === "chat" ? "page" : undefined}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Chat & Anuncios
          </button>
          <button onClick={() => setActiveTab("historial")} aria-current={activeTab === "historial" ? "page" : undefined}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === "historial" ? "bg-white text-indigo-600 border border-slate-200" : "text-slate-500"}`}>
            Historial de tareas
          </button>
          {currentUser?.rol === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("tipos")}
                aria-current={activeTab === "tipos" ? "page" : undefined}
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
                aria-current={activeTab === "usuarios" ? "page" : undefined}
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
          <button
            onClick={refreshActiveTab}
            data-loading={refreshing}
            disabled={refreshing}
            className="ml-auto px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Consultar el estado más reciente sin recargar la página"
          >
            {refreshing ? "Actualizando..." : "Actualizar datos"}
          </button>
        </nav>

        <main key={activeTab} className="tf-ui-view">
          {activeTab === "historial" && <HistoryView refresh={`${historyRefresh}:${taskSync?.available}:${completedTaskSignature(taskSync?.tasks)}`} onOpenTask={setSelectedTask}/>}
          {demoSprint5 && activeTab === "monitoreo" && (
            <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900" role="status">
              Modo de prueba Sprint 5: 100 nodos ficticios. Haz clic sobre un nodo para ver sus datos en modo solo lectura. No se guardan cambios en MySQL.
            </div>
          )}
          {activeTab === "monitoreo" && (
            <MonitoringView
              collaborators={collaborators.filter((c) => c.rol !== "admin")}
              presence={presence}
              tasks={demoSprint5 ? demoTasks : tasks}
              currentUser={demoSprint5 ? { ...currentUser, rol: "trabajador" } : currentUser}
              onSelectTask={demoSprint5 ? setSelectedDemoTask : handleSelectTaskOnMap}
              onMoveTask={demoSprint5 ? undefined : handleMoveTask}
              onApplyAutoLayout={demoSprint5 ? undefined : handleApplyAutoLayout}
              selectedTaskId={demoSprint5 ? selectedDemoTask?.id : highlightedTaskId}
              onClearSelection={() => setHighlightedTaskId(null)}
            />
          )}

          {activeTab === "jornada" && (
            <WorkdayView
              currentUser={currentUser}
              tareasPreestablecidas={taskTypes}
              userTasks={userTasks}
              tasksReady={tasksReady}
              jornada={jornada}
              jornadaCargando={jornadaCargando}
              jornadaGuardando={jornadaGuardando}
              jornadaError={jornadaError}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onAddTask={handleAddTask}
              onUploadEvidence={handleUploadEvidence}
              allTasks={tasks}
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
              onReactivateType={handleReactivateType}
            />
          )}

          {activeTab === "usuarios" && currentUser?.rol === "admin" && (
            <Usuarios onUsuariosChange={setCollaborators} currentUser={currentUser} onSessionInvalidated={handleLogout} />
          )}
        </main>
      </div>

      <MotionPresence show={Boolean(demoSprint5 && selectedDemoTask && activeTab === "monitoreo")}>
        {demoSprint5 && selectedDemoTask && activeTab === "monitoreo" && <DemoTaskModal
          task={selectedDemoTask}
          onClose={closeDemoTask}
        />}
      </MotionPresence>

      <MotionPresence show={Boolean(selectedTask)}>
        {selectedTask && <TaskModal
          key={selectedTask.id}
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onApproveTask={handleApproveTask}
          onRejectTask={handleRejectTask}
          onDeleteTask={handleDeleteTask}
          allTasks={tasks}
        />}
      </MotionPresence>
    </div>
    </TaskClockContext.Provider>
  );
}
