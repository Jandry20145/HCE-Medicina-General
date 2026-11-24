import { useEffect, useState } from 'react';
import { Users, Activity, CalendarDays, UserPlus, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { puede } from '../auth/permisos';

const Tarjeta = ({ titulo, valor, icono: Icono, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden shadow-sm">
    <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true"><Icono size={64} className={color} /></div>
    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{titulo}</p>
    <p className={`mt-4 text-4xl font-extrabold ${color}`}>{valor ?? '—'}</p>
  </div>
);

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/estadisticas').then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Hola, {usuario?.nombresCompletos?.split(' ')[0] || usuario?.username}</h1>
        <p className="text-slate-400">Resumen de la actividad clínica.</p>
      </div>

      {error && <p role="alert" className="text-red-300">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Tarjeta titulo="Pacientes registrados" valor={stats?.pacientes} icono={Users} color="text-cyan-400" />
        <Tarjeta titulo="Consultas hoy" valor={stats?.consultasHoy} icono={Activity} color="text-teal-400" />
        <Tarjeta titulo="Consultas 7 días" valor={stats?.consultasSemana} icono={CalendarDays} color="text-sky-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {puede(usuario, 'editarPacientes') && (
            <button onClick={() => navigate('/pacientes/nuevo')} className="flex items-center justify-center p-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm transition-all font-medium">
              <UserPlus size={20} className="mr-2" aria-hidden="true" /> Nuevo paciente
            </button>
          )}
          {puede(usuario, 'verPacientes') && (
            <button onClick={() => navigate('/pacientes')} className="flex items-center justify-center p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-400 rounded-xl shadow-sm transition-all font-medium">
              <Search size={20} className="mr-2" aria-hidden="true" /> Buscar paciente
            </button>
          )}
          {puede(usuario, 'administrar') && (
            <button onClick={() => navigate('/admin/usuarios')} className="flex items-center justify-center p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-400 rounded-xl shadow-sm transition-all font-medium">
              <ShieldCheck size={20} className="mr-2" aria-hidden="true" /> Gestionar usuarios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
