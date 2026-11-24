import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { ROLES, etiquetaRol } from '../../auth/permisos';
import { useAuth } from '../../auth/AuthContext';

const campo = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-500 outline-none text-sm';
const vacio = { username: '', nombresCompletos: '', rol: 'Medico', password: '' };

export const UsuariosPage = () => {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState(vacio);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargar = () => api.get('/admin/usuarios').then(setUsuarios).catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  useEffect(() => { cargar(); }, []);

  const avisar = (tipo, texto) => setMensaje({ tipo, texto });

  const crear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/usuarios', nuevo);
      setNuevo(vacio);
      avisar('ok', `Usuario ${nuevo.username} creado.`);
      cargar();
    } catch (err) {
      avisar('error', err.message);
    }
  };

  const actualizar = async (u, cambios) => {
    try {
      await api.put(`/admin/usuarios/${u.idUsuario}`, { rol: u.rol, nombresCompletos: u.nombresCompletos, activo: Boolean(u.estado), ...cambios });
      avisar('ok', `Usuario ${u.username} actualizado.`);
      cargar();
    } catch (err) {
      avisar('error', err.message);
    }
  };

  const restablecer = async (u) => {
    const clave = window.prompt(`Contraseña nueva para ${u.username} (mínimo 8 caracteres). Entréguela en persona; el usuario deberá cambiarla.`);
    if (!clave) return;
    try {
      await api.put(`/admin/usuarios/${u.idUsuario}/password`, { passwordNueva: clave });
      avisar('ok', `Contraseña de ${u.username} restablecida. Sus sesiones abiertas se cerraron.`);
    } catch (err) {
      avisar('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3"><ShieldCheck className="text-cyan-400" aria-hidden="true" /> Usuarios</h1>
        <p className="text-slate-400">Personal con acceso al sistema y su rol.</p>
      </div>

      {mensaje.texto && (
        <p role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`px-4 py-3 rounded-lg text-sm ${mensaje.tipo === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-teal-500/10 text-teal-300'}`}>{mensaje.texto}</p>
      )}

      <form onSubmit={crear} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <label className="text-xs text-slate-400">Usuario
          <input required pattern="[a-zA-Z0-9._\-]{3,50}" value={nuevo.username} onChange={(e) => setNuevo({ ...nuevo, username: e.target.value })} className={`${campo} mt-1`} />
        </label>
        <label className="text-xs text-slate-400 md:col-span-2">Nombres completos
          <input required value={nuevo.nombresCompletos} onChange={(e) => setNuevo({ ...nuevo, nombresCompletos: e.target.value })} className={`${campo} mt-1`} />
        </label>
        <label className="text-xs text-slate-400">Rol
          <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} className={`${campo} mt-1`}>
            {ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Contraseña inicial
          <input required type="password" minLength={8} autoComplete="new-password" value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} className={`${campo} mt-1`} />
        </label>
        <button className="md:col-span-5 justify-self-end flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-medium text-sm">
          <UserPlus size={16} aria-hidden="true" /> Crear usuario
        </button>
      </form>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"><span className="sr-only">Acciones</span></th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const soyYo = u.username === yo?.username;
              return (
                <tr key={u.idUsuario} className="border-b border-slate-700/60 last:border-0">
                  <td className="px-4 py-3 font-mono text-slate-200">{u.username}</td>
                  <td className="px-4 py-3 text-slate-300">{u.nombresCompletos}</td>
                  <td className="px-4 py-3">
                    <select aria-label={`Rol de ${u.username}`} disabled={soyYo} value={u.rol} onChange={(e) => actualizar(u, { rol: e.target.value })} className={campo}>
                      {ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button disabled={soyYo} onClick={() => actualizar(u, { activo: !u.estado })}
                      className={`px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50 ${u.estado ? 'bg-teal-500/15 text-teal-300' : 'bg-slate-700 text-slate-400'}`}>
                      {u.estado ? 'Activo' : 'Desactivado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => restablecer(u)} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs">
                      <KeyRound size={14} aria-hidden="true" /> Restablecer contraseña
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className="p-6 text-slate-500 text-sm">Sin usuarios.</p>}
      </div>
      <p className="text-xs text-slate-500">Roles: {ROLES.map((r) => etiquetaRol(r.valor)).join(' · ')}. No puede quitarse su propio rol de administrador ni desactivarse.</p>
    </div>
  );
};
