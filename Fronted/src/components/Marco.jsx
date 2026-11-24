import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { etiquetaRol, puede } from '../auth/permisos';

const MENU = [
  { ruta: '/', nombre: 'Hoy', ver: () => true },
  { ruta: '/agenda', nombre: 'Agenda', ver: (u) => puede(u, 'agenda') },
  { ruta: '/pacientes', nombre: 'Pacientes', ver: (u) => puede(u, 'pacientes') },
  { ruta: '/admin/usuarios', nombre: 'Usuarios', ver: (u) => puede(u, 'administrar') },
  { ruta: '/admin/configuracion', nombre: 'Configuración', ver: (u) => puede(u, 'administrar') },
  { ruta: '/admin/auditoria', nombre: 'Auditoría', ver: (u) => puede(u, 'administrar') },
];

export function Marco() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const items = MENU.filter((m) => m.ver(usuario));
  const nombre = usuario?.nombresCompletos || usuario?.username || '';

  const salir = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="marco">
      <aside className="riel">
        <span className="marca">HCE</span>
        <p className="etiqueta px-2.5 mt-1 mb-8 solo-escritorio">Medicina General</p>
        <nav aria-label="Menú principal" className="flex flex-col gap-1">
          {items.map((m, i) => (
            <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'} className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
              <span className="indice">{String(i + 1).padStart(2, '0')}</span>
              {m.nombre}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 solo-escritorio">
          <hr className="regla mb-4" />
          <div className="px-2.5">
            <p className="font-semibold text-[13.5px] truncate" title={nombre}>{nombre}</p>
            <p className="tenue text-xs mt-0.5">{etiquetaRol(usuario?.rol)}</p>
          </div>
          <div className="flex flex-col mt-3">
            <NavLink to="/cuenta/password" className="nav-item text-[13px]">Cambiar contraseña</NavLink>
            <button onClick={salir} className="nav-item text-[13px] text-left w-full bg-transparent border-0 cursor-pointer">Cerrar sesión</button>
          </div>
        </div>
        <button onClick={salir} className="btn btn-sm ml-auto solo-movil">Salir</button>
      </aside>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
