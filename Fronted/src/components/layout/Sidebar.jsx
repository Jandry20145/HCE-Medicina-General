import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Activity, ShieldCheck, ScrollText, KeyRound } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { etiquetaRol, puede } from '../../auth/permisos';

export const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const nombre = usuario?.nombresCompletos || usuario?.username || 'Usuario';
  const iniciales = nombre.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const salir = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menu = [
    { path: '/', name: 'Inicio', icon: <LayoutDashboard size={20} />, visible: true },
    { path: '/pacientes', name: 'Pacientes', icon: <Users size={20} />, visible: puede(usuario, 'verPacientes') },
    { path: '/admin/usuarios', name: 'Usuarios', icon: <ShieldCheck size={20} />, visible: puede(usuario, 'administrar') },
    { path: '/admin/auditoria', name: 'Auditoría', icon: <ScrollText size={20} />, visible: puede(usuario, 'administrar') },
  ].filter((m) => m.visible);

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 text-slate-300 flex flex-col h-screen fixed shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Activity className="text-cyan-400 mr-2" size={24} aria-hidden="true" />
        <span className="text-xl font-bold text-slate-100 tracking-wide">BioHCEMG<span className="text-cyan-400">.</span></span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto" aria-label="Menú principal">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Medicina General</p>
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-slate-900 text-cyan-400 font-medium' : 'hover:bg-slate-700 hover:text-cyan-400'}`
            }
          >
            <span className="mr-3" aria-hidden="true">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 font-bold border border-slate-700" aria-hidden="true">
            {iniciales}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{nombre}</p>
            <p className="text-xs text-slate-400">{etiquetaRol(usuario?.rol)}</p>
          </div>
        </div>
        <NavLink to="/cuenta/password" className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
          <KeyRound size={16} className="mr-2" aria-hidden="true" /> Cambiar contraseña
        </NavLink>
        <button onClick={salir} className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
          <LogOut size={16} className="mr-2" aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
