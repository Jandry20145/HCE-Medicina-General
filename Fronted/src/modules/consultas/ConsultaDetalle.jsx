import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, FileText, User, Calendar, Pill, AlertCircle, Stethoscope } from 'lucide-react';
import { API_URL } from '../../services/api';

export const ConsultaDetalle = () => {
  const { idConsulta } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/consultas/${idConsulta}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar la consulta');
        return res.json();
      })
      .then(resData => setData(resData))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idConsulta]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando detalles de consulta...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">Error: {error}</div>;
  if (!data || !data.consulta) return <div className="p-8 text-center text-slate-500">Consulta no encontrada.</div>;

  const { consulta, signosVitales, examenFisico, diagnosticos, tratamientos } = data;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Detalle de Consulta</h1>
          <p className="text-slate-400 flex items-center">
            <Calendar size={14} className="mr-1" />
            {new Date(consulta.fechaHoraAtencion).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-4">
              <AlertCircle size={20} /> Motivo y Enfermedad Actual
            </h2>
            <div className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-800 mb-4">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-1">Motivo de Consulta</h3>
              <p className="text-slate-300">{consulta.motivoConsulta}</p>
            </div>
            {consulta.enfermedadActual && (
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-900">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Enfermedad Actual</h3>
                <p className="text-slate-300">{consulta.enfermedadActual}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
              <Stethoscope size={20} /> Examen Físico
            </h2>
            {examenFisico && examenFisico.length > 0 ? (
              <div className="grid gap-3">
                {examenFisico.map((ef) => (
                  <div key={ef.idExamenFisico} className="flex gap-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <span className="font-semibold text-emerald-400 w-1/3 shrink-0">{ef.regionAnatomica}</span>
                    <span className="text-slate-300">{ef.hallazgos}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No se registró examen físico.</p>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-4">
              <FileText size={20} /> Diagnósticos
            </h2>
            {diagnosticos && diagnosticos.length > 0 ? (
              <div className="space-y-3">
                {diagnosticos.map((diag) => (
                  <div key={diag.idDiagnostico} className="p-4 border border-rose-800/50 bg-rose-900/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-rose-900 text-rose-300 text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {diag.tipoDiagnostico}
                    </div>
                    <p className="font-bold text-rose-400 mb-1">
                      {diag.catalogoCie10?.codigoCie} - {diag.catalogoCie10?.nombreEnfermedad}
                    </p>
                    <p className="text-sm text-rose-300"><span className="font-semibold">Condición:</span> {diag.condicionDiagnostico}</p>
                    {diag.descripcionClinica && <p className="text-sm text-rose-300 mt-2">{diag.descripcionClinica}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No se registraron diagnósticos.</p>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2 mb-4">
              <Pill size={20} /> Tratamiento y Plan
            </h2>
            {tratamientos && tratamientos.length > 0 ? (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Medicamentos</h3>
                {tratamientos.map((trat) => (
                  <div key={trat.idTratamiento} className="flex justify-between items-center p-3 border border-indigo-800/50 bg-indigo-900/20 rounded-lg">
                    <span className="font-bold text-indigo-300">{trat.nombreMedicamento || trat.medicamento?.nombreGenerico}</span>
                    <span className="text-sm text-indigo-300 bg-indigo-900/50 px-3 py-1 rounded-full">{trat.indicacionesDosis}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {consulta.recomendaciones && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Recomendaciones</h3>
                <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-700">{consulta.recomendaciones}</p>
              </div>
            )}

            {consulta.evolucion && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Evolución</h3>
                <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-700">{consulta.evolucion}</p>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
              <Activity size={20} /> Signos Vitales
            </h2>
            {signosVitales ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/50 text-center">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">P. Arterial</p>
                  <p className="text-lg font-black text-amber-200">{signosVitales.presionArterial || '--'}</p>
                </div>
                <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/50 text-center">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Pulso</p>
                  <p className="text-lg font-black text-amber-200">{signosVitales.pulso || '--'} <span className="text-xs font-normal text-amber-400/70">lpm</span></p>
                </div>
                <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/50 text-center">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Temp.</p>
                  <p className="text-lg font-black text-amber-200">{signosVitales.temperatura || '--'} <span className="text-xs font-normal text-amber-400/70">°C</span></p>
                </div>
                <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/50 text-center">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Peso</p>
                  <p className="text-lg font-black text-amber-200">{signosVitales.peso || '--'} <span className="text-xs font-normal text-amber-400/70">kg</span></p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No se registraron signos vitales.</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-700 p-2 rounded-full">
                <User size={24} className="text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Médico Tratante</p>
                <p className="font-bold text-lg">{consulta.medico?.nombresCompletos || 'Dr. Prueba'}</p>
              </div>
            </div>
            {consulta.proximoControl && (
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Próximo Control</p>
                <p className="font-medium text-amber-400 flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {new Date(consulta.proximoControl + 'T00:00:00').toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
