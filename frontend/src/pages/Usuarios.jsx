import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConflictReview from "../components/ConflictReview.jsx";
import MotionPresence from "../components/MotionPresence.jsx";
import ConfirmDeactivation from "../components/ConfirmDeactivation.jsx";
import { getSessionEpoch } from "../config/session.js";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend";

const EMPTY = { nombre: "", email: "", password: "", rol: "trabajador", estado: "activo" };
const INPUT = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:opacity-70";
const ERROR_TEXT = "No se pudo completar la operación";

function errorText(error) { return error instanceof Error ? error.message : ERROR_TEXT; }
function roleLabel(value) { return value === "admin" ? "Administrador" : "Trabajador"; }
function isActive(user) { return user.estado !== "inactivo"; }
function initials(name) { return String(name || "?").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }

export default function Usuarios({ onUsuariosChange, currentUser, onSessionInvalidated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("activos");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(null);
  const [toDeactivate, setToDeactivate] = useState(null);
  const mountedRef = useRef(false);
  const requestNumber = useRef(0);

  const loadUsers = useCallback(async () => {
    const requestId = ++requestNumber.current;
    const session = getSessionEpoch();
    setLoading(true);
    try {
      const response = await apiFetch(`${ENDPOINTS.USUARIOS}/administracion`);
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "No se pudo consultar el listado de usuarios");
      if (!Array.isArray(result)) throw new Error("El servidor devolvió una lista de usuarios inválida");
      if (mountedRef.current && requestNumber.current === requestId && session === getSessionEpoch()) {
        setUsers(result);
        onUsuariosChange?.(result.filter(isActive)); // El chat solo necesita usuarios activos.
      }
      return true;
    } catch (err) {
      if (mountedRef.current && requestNumber.current === requestId && session === getSessionEpoch()) setError(errorText(err));
      return false;
    } finally {
      if (mountedRef.current && requestNumber.current === requestId) setLoading(false);
    }
  }, [onUsuariosChange]);

  useEffect(() => {
    mountedRef.current = true;
    loadUsers();
    return () => { mountedRef.current = false; requestNumber.current += 1; };
  }, [loadUsers]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(isActive).length,
    inactive: users.filter((user) => !isActive(user)).length,
    admins: users.filter((user) => isActive(user) && user.rol === "admin").length,
  }), [users]);

  const filtered = useMemo(() => users.filter((user) => {
    if (statusFilter === "activos" && !isActive(user)) return false;
    if (statusFilter === "inactivos" && isActive(user)) return false;
    if (roleFilter !== "todos" && user.rol !== roleFilter) return false;
    const term = query.trim().toLocaleLowerCase("es");
    return !term || `${user.nombre ?? ""} ${user.email ?? ""} ${user.id ?? ""}`.toLocaleLowerCase("es").includes(term);
  }).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es")), [users, statusFilter, roleFilter, query]);

  const selfId = currentUser?.id;
  const isOwnAccount = (user) => selfId != null && String(selfId) === String(user.id);

  const openNew = () => {
    setEditing(null); setForm({ ...EMPTY }); setShowPassword(false);
    setError(""); setNotice(""); setOpenForm(true);
  };
  const openEdit = (user) => {
    setEditing(user); setConflict(false);
    setForm({ nombre: user.nombre || "", email: user.email || "", password: "", rol: user.rol || "trabajador", estado: user.estado || "activo" });
    setShowPassword(false); setError(""); setNotice(""); setOpenForm(true);
  };
  const closeForm = () => { if (pending) return; setOpenForm(false); setEditing(null); setForm({ ...EMPTY }); setShowPassword(false); };
  const updateField = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const mutate = async (key, request, successText, skipRefresh = false) => {
    if (pending) return false;
    setPending(key); setError(""); setNotice("");
    try {
      const response = await request();
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status===409 && key==="guardar" && editing) setConflict(true);
        throw new Error(data?.message || ERROR_TEXT);
      }
      if (mountedRef.current) {
        setNotice(successText);
        if (!skipRefresh) await loadUsers();
      }
      return true;
    } catch (err) {
      if (mountedRef.current) setError(errorText(err));
      return false;
    } finally {
      if (mountedRef.current) setPending(null);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (conflict) return;
    const name = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) { setError("Completa el nombre y el correo."); return; }
    if (!editing && !form.password) { setError("La contraseña es obligatoria para cuentas nuevas."); return; }
    if (form.password && (form.password.length < 8 || form.password.length > 64 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) {
      setError("La contraseña debe tener de 8 a 64 caracteres e incluir letras y números."); return;
    }
    const payload = { nombre: name, email, rol: form.rol, estado: form.estado };
    if (editing) payload.version=editing.version;
    if (form.password) payload.password = form.password;
    const changedOwnPassword = Boolean(editing && isOwnAccount(editing) && form.password);
    const result = await mutate("guardar", () => apiFetch(editing ? `${ENDPOINTS.USUARIOS}/${editing.id}` : ENDPOINTS.USUARIOS, {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }), editing ? "Usuario actualizado correctamente." : "Usuario creado correctamente.", changedOwnPassword);
    if (result && changedOwnPassword) {
      window.alert("La contraseña de tu cuenta cambió. Inicia sesión nuevamente con la contraseña nueva.");
      onSessionInvalidated?.();
      return;
    }
    if (result) { setOpenForm(false); setEditing(null); setForm({ ...EMPTY }); setShowPassword(false); setStatusFilter("activos"); }
  };

  const deactivate = async () => {
    if (!toDeactivate || isOwnAccount(toDeactivate) || !isActive(toDeactivate)) return;
    const ok = await mutate("desactivar", () => apiFetch(`${ENDPOINTS.USUARIOS}/${toDeactivate.id}?version=${encodeURIComponent(toDeactivate.version)}`, { method: "DELETE" }), "Usuario desactivado. Su información se ha conservado.");
    if (ok) setToDeactivate(null);
  };

  const openDeactivate = (user) => {
    if (pending || isOwnAccount(user) || !isActive(user)) return;
    setError(""); setNotice(""); setToDeactivate(user);
  };

  const reactivate = async (user) => {
    await mutate(`reactivar-${user.id}`, () => apiFetch(`${ENDPOINTS.USUARIOS}/${user.id}/reactivar`, { method: "PATCH" }), "Usuario reactivado correctamente.");
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-100">ADMINISTRACIÓN / EQUIPO</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Controla las cuentas, los permisos y el acceso a TimeFlow.</p>
        </div>
        <button type="button" onClick={openNew} disabled={Boolean(pending)} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">+ Nuevo usuario</button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Cuentas", stats.total, "text-slate-900", "▣"],
          ["Activas", stats.active, "text-emerald-700", "●"],
          ["Inactivas", stats.inactive, "text-amber-700", "◌"],
          ["Administradores activos", stats.admins, "text-indigo-700", "◆"],
        ].map(([label, value, tone, glyph]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-2 flex items-center justify-between"><strong className={`text-3xl font-extrabold ${tone}`}>{value}</strong><span className={`text-xl ${tone}`}>{glyph}</span></div></div>)}
      </div>

      {(error || notice) && <div role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</div>}

      {conflict && editing && openForm && <ConflictReview endpoint={`${ENDPOINTS.USUARIOS}/administracion`} recordId={editing.id}
        fields={["nombre","email","rol","estado"]} active={record => record.estado !== "inactivo"}
        onAdopt={record => { setEditing(record); setConflict(false); setNotice("Datos actuales cargados. Tu borrador se conserva; revísalo antes de guardar."); setError(""); }} />}
      {openForm && (
        <section className="tf-ui-panel-enter overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-indigo-100 bg-indigo-50/60 px-5 py-4"><div><h2 className="font-bold text-slate-900">{editing ? `Editar · ${editing.nombre}` : "Crear cuenta"}</h2><p className="mt-1 text-xs text-slate-500">{editing ? "La contraseña solo cambia si escribes una nueva." : "Completa los datos para dar acceso al sistema."}</p></div><button type="button" onClick={closeForm} disabled={Boolean(pending)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cerrar</button></div>
          <form onSubmit={save} className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Nombre completo<input className={INPUT} name="nombre" value={form.nombre} onChange={updateField} required maxLength={100} placeholder="Nombre y apellido" disabled={Boolean(pending)} autoComplete="name" /></label>
              <label className="text-xs font-bold text-slate-700">Correo electrónico<input className={INPUT} type="email" name="email" value={form.email} onChange={updateField} required maxLength={150} disabled={Boolean(pending) || (Boolean(editing) && isOwnAccount(editing))} autoComplete="off" />{editing && isOwnAccount(editing) && <small className="mt-1 block font-normal text-slate-500">Para cambiar tu propio correo, utiliza un flujo de recuperación de sesión.</small>}</label>
              <label className="text-xs font-bold text-slate-700">Contraseña {editing && <span className="font-normal text-slate-400">(opcional)</span>}
                <div className="relative"><input className={`${INPUT} pr-20`} type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={updateField} required={!editing} minLength={editing ? undefined : 8} maxLength={64} placeholder={editing ? "Dejar vacía para conservar" : "Mínimo 8 caracteres"} autoComplete="new-password" disabled={Boolean(pending)} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-2 right-2 rounded-lg px-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">{showPassword ? "Ocultar" : "Mostrar"}</button></div>
                <small className="mt-1 block font-normal text-slate-500">8 a 64 caracteres, al menos una letra y un número.</small>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700">Rol<select name="rol" value={form.rol} onChange={updateField} className={INPUT} disabled={Boolean(pending) || (Boolean(editing) && isOwnAccount(editing))}><option value="trabajador">Trabajador</option><option value="admin">Administrador</option></select></label>
                <label className="text-xs font-bold text-slate-700">Estado<select name="estado" value={form.estado} onChange={updateField} className={INPUT} disabled={Boolean(pending) || Boolean(editing)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>{editing && <small className="mt-1 block font-normal text-slate-500">Desactiva la cuenta desde el directorio para confirmar la operación.</small>}</label>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={closeForm} disabled={Boolean(pending)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button><button type="submit" disabled={Boolean(pending)} data-loading={pending === "guardar"} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{pending === "guardar" ? "Guardando…" : editing ? "Guardar cambios" : "Crear usuario"}</button></div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 p-5">
          <div><h2 className="font-bold text-slate-900">Directorio del equipo</h2><p className="mt-0.5 text-xs text-slate-500">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}{loading ? " · Cargando…" : ""}</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="tf-search-users">Buscar usuarios</label><input id="tf-search-users" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nombre o correo…" className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
            <select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><option value="activos">Activos</option><option value="inactivos">Inactivos</option><option value="todos">Todos</option></select>
            <select aria-label="Filtrar por rol" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><option value="todos">Todos los roles</option><option value="admin">Administradores</option><option value="trabajador">Trabajadores</option></select>
            <button type="button" onClick={() => { setError(""); loadUsers(); }} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Actualizar</button>
          </div>
        </div>
        {filtered.length === 0 ? <div className="p-12 text-center"><div className="text-3xl text-slate-300">◎</div><h3 className="mt-2 font-semibold text-slate-800">{loading ? "Cargando usuarios…" : "No se encontraron usuarios"}</h3><p className="mt-1 text-sm text-slate-500">{loading ? "Consultando el servidor" : "Cambia los filtros o crea una cuenta."}</p></div> :
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500"><tr><th scope="col" className="px-5 py-3">Usuario</th><th scope="col" className="px-5 py-3">Rol</th><th scope="col" className="px-5 py-3">Estado</th><th scope="col" className="px-5 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="tf-ui-list divide-y divide-slate-100">{filtered.map((user) => <tr key={user.id} className="tf-ui-item hover:bg-slate-50/80">
              <td className="px-5 py-4"><div className="flex min-w-48 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-xs font-extrabold text-indigo-700">{initials(user.nombre)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900">{user.nombre}</span>{isOwnAccount(user) && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Tú</span>}</div><div className="break-all text-xs text-slate-500">{user.email}</div></div></div></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.rol === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{roleLabel(user.rol)}</span></td>
              <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive(user) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><span aria-hidden="true">●</span>{isActive(user) ? "Activo" : "Inactivo"}</span></td>
              <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEdit(user)} disabled={Boolean(pending) || !isActive(user)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40">Editar</button>{isActive(user) ? <button type="button" onClick={() => openDeactivate(user)} disabled={Boolean(pending) || isOwnAccount(user)} title={isOwnAccount(user) ? "No puedes desactivar tu propia cuenta" : "Desactivar cuenta"} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40">Desactivar</button> : <button type="button" onClick={() => reactivate(user)} disabled={Boolean(pending)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{pending === `reactivar-${user.id}` ? "Reactivando…" : "Reactivar"}</button>}</div></td>
            </tr>)}</tbody>
          </table></div>}
      </section>

      <MotionPresence show={Boolean(toDeactivate)}>
        {toDeactivate && <ConfirmDeactivation key={toDeactivate.id} kind="account" record={toDeactivate} pending={pending === "desactivar"} error={error} onCancel={() => { if (!pending) setToDeactivate(null); }} onConfirm={deactivate} />}
      </MotionPresence>
    </div>
  );
}
