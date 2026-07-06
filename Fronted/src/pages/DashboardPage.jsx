import React, { useState } from 'react';
import { Activity, Users, Plus } from 'lucide-react';
import { PacientesList } from '../modules/pacientes/PacientesList';
import { NuevaConsultaForm } from '../modules/consultas/NuevaConsultaForm';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('pacientes');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/30">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 text-blue-700">
              <Activity className="h-8 w-8" />
              <h1 className="text-xl font-semibold tracking-tight text-slate-800">BioHCEMG<span className="text-blue-600">.</span></h1>
            </div>
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pacientes' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Pacientes</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('consulta')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'consulta' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Nueva Consulta</span>
                </div>
              </button>
            </nav>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold border border-blue-200">
                DR
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pacientes' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Directorio de Pacientes</h2>
                <p className="text-slate-500 mt-1">Gestiona historias clínicas y consultas de tus pacientes.</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Nuevo Paciente
              </button>
            </div>
            <PacientesList />
          </div>
        )}

        {activeTab === 'consulta' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Nueva Consulta de Medicina General</h2>
              <p className="text-slate-500 mt-1">Registra anamnesis, examen físico regional y diagnóstico CIE-10.</p>
            </div>
            <NuevaConsultaForm />
          </div>
        )}
      </main>
    </div>
  );
};

