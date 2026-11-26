import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const backend = (name) => source(`../../backend/src/main/java/com/teamflow/backend/${name}`);
const app = source('../src/App.jsx');
const taskTypes = source('../src/pages/TaskTypesView.jsx');
const users = source('../src/pages/Usuarios.jsx');
const security = backend('config/SecurityConfig.java');

// Estas son comprobaciones estáticas; las rutas deben probarse también con MockMvc y MySQL.
test('el listado de registros inactivos requiere rol administrador, antes del GET genérico', () => {
  const protectedRoutes = '"/api/usuarios/administracion", "/api/tipos-tarea/administracion").hasRole("ADMIN")';
  assert.ok(security.indexOf(protectedRoutes) > 0);
  assert.ok(security.indexOf(protectedRoutes) < security.indexOf('"/api/usuarios", "/api/usuarios/**").authenticated()'));
  assert.ok(security.indexOf(protectedRoutes) < security.indexOf('"/api/tipos-tarea", "/api/tipos-tarea/**").authenticated()'));
});

test('las listas administrativas comprueban los permisos en el propio controlador', () => {
  const usuario = backend('controllers/UsuarioController.java');
  const tipo = backend('controllers/TipoTareaController.java');
  assert.match(usuario, /listarAdministracion\([\s\S]*?!esAdministrador\(autenticacion\)/);
  assert.match(tipo, /listarAdministracion\([\s\S]*?ROLE_ADMIN/);
  assert.match(usuario, /usuarioRepository\.findAll\(\)/);
  assert.match(tipo, /tipoTareaRepository\.findAll\(\)/);
});

test('las operaciones de tipos propagan el error del servidor y el formulario espera confirmación', () => {
  assert.match(app, /if \(!response\.ok\)\s*\{\s*const error=new Error\(body\?\.message \|\| fallback\); error\.status=response\.status; throw error;/);
  assert.match(app, /const handleReactivateType = async/);
  assert.match(taskTypes, /const saved = await runAction\("crear"/);
  assert.match(taskTypes, /if \(saved\) \{ setNombre\(""\)/);
  assert.match(taskTypes, /const saved = await runAction\("editar"/);
});

test('la gestión de usuarios separa los inactivos del directorio general y permite recuperarlos', () => {
  assert.match(users, /result\.filter\(isActive\)/);
  assert.match(users, /const reactivate = async/);
  assert.match(users, /\/reactivar/);
  assert.match(users, /const filtered = useMemo/);
  assert.match(users, /isOwnAccount\(user\)/);
});

test('el cambio de contraseña propia termina la sesión inválida', () => {
  assert.match(users, /const changedOwnPassword =/);
  assert.match(users, /onSessionInvalidated\?\.\(\)/);
  assert.match(app, /onSessionInvalidated=\{handleLogout\}/);
});
