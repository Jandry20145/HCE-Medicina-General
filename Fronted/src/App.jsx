import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { puede } from './auth/permisos';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { LoginPage } from './pages/LoginPage';
import { CambiarPassword } from './pages/CambiarPassword';
import { UsuariosPage } from './pages/admin/UsuariosPage';
import { AuditoriaPage } from './pages/admin/AuditoriaPage';
import { PacientesList } from './modules/pacientes/PacientesList';
import { FormularioPaciente } from './modules/pacientes/FormularioPaciente';
import { VistaHCE } from './modules/pacientes/VistaHCE';
import { NuevaConsultaForm } from './modules/consultas/NuevaConsultaForm';
import { ConsultaDetalle } from './modules/consultas/ConsultaDetalle';

const Cargando = () => (
  <div className="min-h-screen grid place-items-center bg-slate-900 text-slate-400" role="status">Cargando…</div>
);

const ConSesion = ({ children }) => {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <Cargando />;
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
      <Route path="/" element={<ConSesion><MainLayout /></ConSesion>}>
        <Route index element={<DashboardOverview />} />
        <Route path="pacientes" element={<ConPermiso accion="verPacientes"><PacientesList /></ConPermiso>} />
        <Route path="pacientes/nuevo" element={<ConPermiso accion="editarPacientes"><FormularioPaciente /></ConPermiso>} />
        <Route path="pacientes/editar/:id" element={<ConPermiso accion="editarPacientes"><FormularioPaciente /></ConPermiso>} />
        <Route path="historia-clinica/:idPaciente" element={<ConPermiso accion="verHistoria"><VistaHCE /></ConPermiso>} />
        <Route path="consultas/nueva/:idPaciente" element={<ConPermiso accion="crearConsulta"><NuevaConsultaForm /></ConPermiso>} />
        <Route path="consultas/ver/:idConsulta" element={<ConPermiso accion="verHistoria"><ConsultaDetalle /></ConPermiso>} />
        <Route path="cuenta/password" element={<CambiarPassword />} />
        <Route path="admin/usuarios" element={<ConPermiso accion="administrar"><UsuariosPage /></ConPermiso>} />
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
