import React, { useState, useEffect } from 'react';
import { FileText, Edit, PlusCircle, Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';

export const PacientesList = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const userRol = localStorage.getItem('userRol') || '';

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const res = await fetch(`${API_URL}/pacientes`);
        const data = await res.json();
        setPacientes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nombresCompletos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellidosCompletos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cedulaIdentidad.includes(searchTerm) ||
    p.numeroHistoriaClinica.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Pacientes</h1>
          <p className="text-slate-400">Gestión de historias clínicas y registro de consultas.</p>
        </div>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all font-medium"
        >
          <UserPlus size={18} className="mr-2" />
          Nuevo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por cédula, HC o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">HC</th>
                <th className="px-6 py-4 font-semibold">Identificación</th>
                <th className="px-6 py-4 font-semibold">Nombres y Apellidos</th>
                <th className="px-6 py-4 font-semibold">Edad</th>
                <th className="px-6 py-4 font-semibold">Sexo</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    Cargando pacientes...
                  </td>
                </tr>
              ) : filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((p) => (
                  <tr key={p.idPaciente} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-cyan-900/40 text-cyan-400 rounded-md text-xs font-medium border border-cyan-800">
                        {p.numeroHistoriaClinica}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{p.cedulaIdentidad}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-100">{p.nombresCompletos} {p.apellidosCompletos}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{calculateAge(p.fechaNacimiento)} años</td>
                    <td className="px-6 py-4 text-slate-400">{p.sexo}</td>
                    <td className="px-6 py-4 text-slate-400">{p.telefono || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {userRol !== 'Admision' && (
                          <button
                            onClick={() => navigate(`/historia-clinica/${p.idPaciente}`)}
                            className="p-2 text-cyan-400 hover:text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/60 rounded-lg transition-colors border border-cyan-800/50"
                            title="Ver Historia Clínica"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/pacientes/editar/${p.idPaciente}`)}
                          className="p-2 text-slate-400 hover:text-slate-300 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                          title="Editar Paciente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {userRol !== 'Admision' && (
                          <button
                            onClick={() => navigate(`/consultas/nueva/${p.idPaciente}`)}
                            className="p-2 text-teal-400 hover:text-teal-300 bg-teal-900/30 hover:bg-teal-900/60 rounded-lg transition-colors border border-teal-800/50"
                            title="Nueva Consulta"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
