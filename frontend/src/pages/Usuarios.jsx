import { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend";

// datos vacios que usa el formulario al crear un usuario
const formularioInicial = {
  nombre: "",
  email: "",
  password: "",
  rol: "trabajador",
  estado: "activo",
};

export default function Usuarios({ onUsuariosChange }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);

  // carga la lista directamente desde mysql por medio del backend
  const cargarUsuarios = async () => {
    setCargando(true);
    setError("");

    try {
      const response = await apiFetch(ENDPOINTS.USUARIOS);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los usuarios");
      }

      const data = await response.json();
      setUsuarios(data);
      if (onUsuariosChange) onUsuariosChange(data);
    } catch (err) {
      setError(err.message || "Error al conectar con el backend");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // limpia el formulario cuando se va a crear una cuenta nueva
  const abrirNuevoUsuario = () => {
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  // al editar carga los datos actuales pero deja la contraseña vacia
  const abrirEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setFormulario({
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      password: "",
      rol: usuario.rol || "trabajador",
      estado: usuario.estado || "activo",
    });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
  };

  const manejarCambio = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const guardarUsuario = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");

    if (!formulario.nombre.trim() || !formulario.email.trim()) {
      setError("Nombre y correo son obligatorios");
      return;
    }

    if (!usuarioEditando && !formulario.password.trim()) {
      setError("La contraseña es obligatoria para un usuario nuevo");
      return;
    }

    if (formulario.password.trim()) {
      const password = formulario.password;
      if (password.length < 8 || password.length > 64 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError("La contraseña debe tener entre 8 y 64 caracteres e incluir al menos una letra y un número");
        return;
      }
    }

    // usa el mismo formulario para crear o editar
    const url = usuarioEditando
      ? `${ENDPOINTS.USUARIOS}/${usuarioEditando.id}`
      : ENDPOINTS.USUARIOS;

    const metodo = usuarioEditando ? "PUT" : "POST";

    // arma solo los datos que necesita el backend
    const payload = {
      nombre: formulario.nombre.trim(),
      email: formulario.email.trim(),
      rol: formulario.rol,
      estado: formulario.estado,
    };

    // en edicion solo manda contraseña si realmente se escribio una nueva
    if (formulario.password.trim()) {
      payload.password = formulario.password;
    }

    setGuardando(true);

    try {
      const response = await apiFetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo guardar el usuario");
      }

      await cargarUsuarios();
      setMensaje(usuarioEditando ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      cerrarFormulario();
    } catch (err) {
      setError(err.message || "Error al guardar el usuario");
    } finally {
      setGuardando(false);
    }
  };

  // pide confirmacion antes de borrar una cuenta
  const eliminarUsuario = async (usuario) => {
    const confirmado = window.confirm(`¿Eliminar al usuario ${usuario.nombre}?`);
    if (!confirmado) return;

    setError("");
    setMensaje("");

    try {
      const response = await apiFetch(`${ENDPOINTS.USUARIOS}/${usuario.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "No se pudo eliminar el usuario");
      }

      await cargarUsuarios();
      setMensaje("Usuario eliminado correctamente");
    } catch (err) {
      setError(err.message || "Error al eliminar el usuario");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500">Lista y administración de cuentas registradas en MySQL.</p>
        </div>
        <button
          onClick={abrirNuevoUsuario}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="border border-green-200 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={guardarUsuario} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {usuarioEditando ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <button type="button" onClick={cerrarFormulario} className="text-gray-500 hover:text-gray-800">
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              Nombre
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </label>

            <label className="text-sm text-gray-700">
              Correo
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={manejarCambio}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </label>

            <label className="text-sm text-gray-700">
              Contraseña {usuarioEditando && <span className="text-gray-400">(opcional)</span>}
              <input
                type="password"
                name="password"
                value={formulario.password}
                onChange={manejarCambio}
                placeholder={usuarioEditando ? "Dejar vacía para conservarla" : "Ingrese una contraseña"}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                minLength={usuarioEditando ? undefined : 8}
                maxLength={64}
                required={!usuarioEditando}
              />
              <span className="mt-1 block text-xs text-gray-400">Mínimo 8 caracteres, con al menos una letra y un número.</span>
            </label>

            <label className="text-sm text-gray-700">
              Rol
              <select
                name="rol"
                value={formulario.rol}
                onChange={manejarCambio}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="trabajador">Trabajador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              Estado
              <select
                name="estado"
                value={formulario.estado}
                onChange={manejarCambio}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrarFormulario}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg"
            >
              {guardando ? "Guardando..." : usuarioEditando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-6 text-gray-500">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-gray-500">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Correo</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{usuario.nombre}</td>
                    <td className="px-6 py-4">{usuario.rol === "admin" ? "Administrador" : "Trabajador"}</td>
                    <td className="px-6 py-4 text-gray-500">{usuario.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        usuario.estado === "inactivo"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {usuario.estado === "inactivo" ? "Inactivo" : "Activo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEdicion(usuario)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarUsuario(usuario)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
