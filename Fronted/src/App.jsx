import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { PacientesList } from './modules/pacientes/PacientesList';

import { FormularioPaciente } from './modules/pacientes/FormularioPaciente';
import { VistaHCE } from './modules/pacientes/VistaHCE';
import { NuevaConsultaForm } from './modules/consultas/NuevaConsultaForm';
import { ConsultaDetalle } from './modules/consultas/ConsultaDetalle';
import { LoginPage } from './pages/LoginPage';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const userRol = localStorage.getItem('userRol');
  if (!allowedRoles.includes(userRol)) {
    return <Navigate to="/pacientes" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="pacientes" element={<PacientesList />} />
          <Route path="pacientes/nuevo" element={<FormularioPaciente />} />
          <Route path="pacientes/editar/:id" element={<FormularioPaciente />} />
          <Route path="historia-clinica/:idPaciente" element={
            <RoleProtectedRoute allowedRoles={['Medico', 'Especialista', 'Enfermeria']}>
              <VistaHCE />
            </RoleProtectedRoute>
          } />
          <Route path="consultas/nueva/:idPaciente" element={
            <RoleProtectedRoute allowedRoles={['Medico', 'Especialista']}>
              <NuevaConsultaForm />
            </RoleProtectedRoute>
          } />
          <Route path="consultas/ver/:idConsulta" element={
            <RoleProtectedRoute allowedRoles={['Medico', 'Especialista', 'Enfermeria']}>
              <ConsultaDetalle />
            </RoleProtectedRoute>
          } />
          {/* We will add more routes here soon */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
