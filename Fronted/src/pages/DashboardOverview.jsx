import React, { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle, UserPlus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pacientes: 0,
    consultasHoy: 0,
    alergias: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pacientesRes, consultasRes] = await Promise.all([
          fetch('http://localhost:8080/api/pacientes'),
          fetch('http://localhost:8080/api/consultas')
        ]);

        const pacientes = await pacientesRes.json();
        const consultas = await consultasRes.json();

        // Calcular cuántas consultas son de hoy
        const hoy = new Date().toLocaleDateString();
        const consultasHoy = consultas.filter(c => {
          return new Date(c.fechaHoraAtencion).toLocaleDateString() === hoy;
        });

        setStats({
          pacientes: pacientes.length || 0,
          consultasHoy: consultasHoy.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard de Inicio</h1>
        <p className="text-slate-400">Resumen general del estado del sistema clínico.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover-lift relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={64} className="text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Pacientes Registrados</p>
          <div className="mt-4 flex items-baseline text-4xl font-extrabold text-cyan-400">
            {stats.pacientes}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover-lift relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={64} className="text-teal-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Consultas (Hoy)</p>
          <div className="mt-4 flex items-baseline text-4xl font-extrabold text-teal-400">
            {stats.consultasHoy}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="flex items-center justify-center p-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm transition-all font-medium"
          >
            <UserPlus size={20} className="mr-2" />
            Nuevo Paciente
          </button>

          <button
            onClick={() => navigate('/pacientes')}
            className="flex items-center justify-center p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-400 rounded-xl shadow-sm transition-all font-medium"
          >
            <Search size={20} className="mr-2" />
            Buscar Paciente
          </button>
        </div>
      </div>
    </div>
  );
};
