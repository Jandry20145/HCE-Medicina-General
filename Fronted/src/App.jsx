import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { puede } from './auth/permisos';
import { Marco } from './components/Marco';
import { LoginPage } from './pages/LoginPage';
import { Hoy } from './pages/Hoy';
import { Agenda } from './pages/Agenda';
import { Triaje } from './pages/Triaje';
import { CambiarPassword } from './pages/CambiarPassword';
import { Pacientes } from './pages/pacientes/Pacientes';
import { PacienteForm } from './pages/pacientes/PacienteForm';
import { Paciente } from './pages/pacientes/Paciente';
import { ConsultaEditor } from './pages/consultas/ConsultaEditor';
import { ConsultaDetalle } from './pages/consultas/ConsultaDetalle';
import { UsuariosPage } from './pages/admin/UsuariosPage';
import { ConfiguracionPage } from './pages/admin/ConfiguracionPage';
import { AuditoriaPage } from './pages/admin/AuditoriaPage';

const ConSesion = ({ children }) => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <div className="min-h-screen grid place-items-center tenue" role="status">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

/** Oculta la pantalla a quien no tiene el permiso; el servidor lo rechazaría igual. */
const ConPermiso = ({ accion, children }) => {
  const { usuario } = useAuth();
  return puede(usuario, accion) ? children : <Navigate to="/" replace />;
};

function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ConSesion><Marco /></ConSesion>}>
        <Route index element={<Hoy />} />
        <Route path="agenda" element={<ConPermiso accion="agenda"><Agenda /></ConPermiso>} />
        <Route path="pacientes" element={<ConPermiso accion="pacientes"><Pacientes /></ConPermiso>} />
        <Route path="pacientes/nuevo" element={<ConPermiso accion="pacientes"><PacienteForm /></ConPermiso>} />
        <Route path="pacientes/:id" element={<ConPermiso accion="pacientes"><Paciente /></ConPermiso>} />
        <Route path="pacientes/:id/editar" element={<ConPermiso accion="pacientes"><PacienteForm /></ConPermiso>} />
        <Route path="triaje/:idPaciente" element={<ConPermiso accion="triaje"><Triaje /></ConPermiso>} />
        <Route path="consultas/nueva/:idPaciente" element={<ConPermiso accion="consulta"><ConsultaEditor /></ConPermiso>} />
        <Route path="consultas/:id/editar" element={<ConPermiso accion="consulta"><ConsultaEditor /></ConPermiso>} />
        <Route path="consultas/:id" element={<ConPermiso accion="pacientes"><ConsultaDetalle /></ConPermiso>} />
        <Route path="cuenta/password" element={<CambiarPassword />} />
        <Route path="admin/usuarios" element={<ConPermiso accion="administrar"><UsuariosPage /></ConPermiso>} />
        <Route path="admin/configuracion" element={<ConPermiso accion="administrar"><ConfiguracionPage /></ConPermiso>} />
        <Route path="admin/auditoria" element={<ConPermiso accion="administrar"><AuditoriaPage /></ConPermiso>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rutas />
      </AuthProvider>
    </BrowserRouter>
  );
}
