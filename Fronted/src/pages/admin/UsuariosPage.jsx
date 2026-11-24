import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ROLES, etiquetaRol } from '../../auth/permisos';
import { useAuth } from '../../auth/AuthContext';
import { Campo, Encabezado, Mensaje, Seccion } from '../../components/ui';

const vacio = { username: '', nombresCompletos: '', rol: 'Medico', registroProfesional: '', password: '' };

export function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState(vacio);
  const [estado, setEstado] = useState(null);

  const cargar = () => api.get('/admin/usuarios').then(setUsuarios).catch((e) => setEstado({ tipo: 'error', texto: e.message }));
  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/usuarios', nuevo);
      setEstado({ tipo: 'ok', texto: `Usuario ${nuevo.username} creado. Entréguele la contraseña en persona.` });
      setNuevo(vacio);
      cargar();
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };

  const actualizar = async (u, cambios) => {
    try {
      await api.put(`/admin/usuarios/${u.idUsuario}`, {
        rol: u.rol, nombresCompletos: u.nombresCompletos, activo: Boolean(u.estado), registroProfesional: u.registroProfesional || '', ...cambios,
      });
      setEstado({ tipo: 'ok', texto: `Usuario ${u.username} actualizado.` });
      cargar();
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };

  const restablecer = async (u) => {
    const clave = window.prompt(`Contraseña nueva para ${u.username} (mínimo 8 caracteres). Entréguela en persona; deberá cambiarla al entrar.`);
    if (!clave) return;
    try {
      await api.put(`/admin/usuarios/${u.idUsuario}/password`, { passwordNueva: clave });
      setEstado({ tipo: 'ok', texto: `Contraseña de ${u.username} restablecida. Sus sesiones abiertas se cerraron.` });
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };

  const set = (k) => (e) => setNuevo({ ...nuevo, [k]: e.target.value });

  return (
    <>
      <Encabezado indice="Administración" titulo="Usuarios" subtitulo="Cuentas del personal, rol y estado. Desactivar a alguien cierra sus sesiones al instante." />
      <Mensaje estado={estado} />
      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="tarjeta p-0 overflow-x-auto aparece">
          <table className="tabla">
            <thead><tr><th className="etiqueta">Usuario</th><th className="etiqueta">Nombre</th><th className="etiqueta">Rol</th><th className="etiqueta">Registro</th><th className="etiqueta">Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {usuarios.map((u) => {
                const soyYo = u.username === yo?.username;
                return (
                  <tr key={u.idUsuario}>
                    <td className="font-mono text-[13px]">{u.username}{soyYo && <span className="tenue"> (usted)</span>}</td>
                    <td>{u.nombresCompletos}</td>
                    <td>
                      <select className="input w-auto" aria-label={`Rol de ${u.username}`} disabled={soyYo} value={u.rol} onChange={(e) => actualizar(u, { rol: e.target.value })}>
                        {ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
                      </select>
                    </td>
                    <td className="num tenue">{u.registroProfesional || '—'}</td>
                    <td>
                      <button disabled={soyYo} onClick={() => actualizar(u, { activo: !u.estado })} className={`pill ${u.estado ? 'pill-ok' : ''} border-0 cursor-pointer disabled:cursor-default`}>
                        {u.estado ? 'Activo' : 'Dado de baja'}
                      </button>
                    </td>
                    <td className="text-right"><button className="btn btn-sm btn-texto" onClick={() => restablecer(u)}>Restablecer contraseña</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Seccion indice="01" titulo="Nuevo usuario" className="aparece">
          <form onSubmit={crear} className="flex flex-col gap-3">
            <Campo etiqueta="Usuario"><input className="input" required pattern="[a-zA-Z0-9._\-]{3,50}" value={nuevo.username} onChange={set('username')} placeholder="nombre.apellido" /></Campo>
            <Campo etiqueta="Nombres completos"><input className="input" required maxLength={150} value={nuevo.nombresCompletos} onChange={set('nombresCompletos')} /></Campo>
            <Campo etiqueta="Rol"><select className="input" value={nuevo.rol} onChange={set('rol')}>{ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}</select></Campo>
            {nuevo.rol === 'Medico' && <Campo etiqueta="Registro profesional" ayuda="Se imprime en recetas y certificados."><input className="input" maxLength={50} value={nuevo.registroProfesional} onChange={set('registroProfesional')} /></Campo>}
            <Campo etiqueta="Contraseña inicial"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={nuevo.password} onChange={set('password')} /></Campo>
            <button className="btn btn-primario self-start mt-1">Crear usuario<span className="flecha">→</span></button>
          </form>
          <p className="tenue text-xs mt-4">Roles: {ROLES.map((r) => etiquetaRol(r.valor)).join(' · ')}. Administración no accede a información clínica.</p>
        </Seccion>
      </div>
    </>
  );
}
