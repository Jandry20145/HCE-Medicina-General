import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Activity, Save, Plus, ArrowLeft } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import { buscarCie10, API_URL } from '../../services/api';
import { selectStyles } from '../../styles/reactSelectStyles';

export const NuevaConsultaForm = () => {
  const { idPaciente } = useParams();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRol');
  const isReadOnly = userRole === 'Admision';

  const [hceData, setHceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBuscadorCie10, setShowBuscadorCie10] = useState(false);

  const [formData, setFormData] = useState({
    motivoConsulta: '',
    enfermedadActual: '',
    signosVitales: {
      presionArterial: '',
      pulso: '',
      temperatura: '',
      frecuenciaRespiratoria: '',
      saturacionOxigeno: '',
      peso: '',
      talla: ''
    },
    examenFisico: [{ regionAnatomica: 'Cabeza y Cuello', hallazgos: '' }],
    diagnosticos: [],
    tratamientos: [{ nombreMedicamento: '', indicacionesDosis: '' }],
    evolucion: '',
    recomendaciones: '',
    proximoControl: ''
  });

  useEffect(() => {
    // Fetch Historia Clinica to get ID
    fetch(`${API_URL}/historia-clinica/paciente/${idPaciente}`)
      .then(res => res.json())
      .then(data => setHceData(data))
      .catch(console.error);
  }, [idPaciente]);

  const loadOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    const results = await buscarCie10(inputValue);
    return results.map(item => ({ value: item.idCie10, label: `${item.codigoCie} - ${item.nombreEnfermedad}` }));
  };

  const handleGuardarConsulta = async () => {
    if (!hceData) return;
    if (isReadOnly) {
      alert("Solo el personal médico puede guardar consultas.");
      return;
    }
    setLoading(true);

    const dto = {
      idHistoriaClinica: hceData.historia_clinica.idHistoriaClinica,
      idMedico: 1, // Usuario Quemado para fines académicos
      motivoConsulta: formData.motivoConsulta,
      enfermedadActual: formData.enfermedadActual,
      signosVitales: {
        presionArterial: formData.signosVitales.presionArterial,
        pulso: formData.signosVitales.pulso ? parseInt(formData.signosVitales.pulso) : 0,
        temperatura: formData.signosVitales.temperatura ? parseFloat(formData.signosVitales.temperatura) : 0,
        peso: formData.signosVitales.peso ? parseFloat(formData.signosVitales.peso) : 0,
        talla: formData.signosVitales.talla ? parseFloat(formData.signosVitales.talla) : 0
      },
      examenFisico: formData.examenFisico.filter(e => e.hallazgos.trim() !== ''),
      diagnosticos: formData.diagnosticos.map(d => ({
        idCie10: d.value,
        tipoDiagnostico: d.tipoDiagnostico,
        condicionDiagnostico: d.condicionDiagnostico,
        descripcionClinica: "Evaluado en consulta"
      })),
      tratamientos: formData.tratamientos.filter(t => t.nombreMedicamento.trim() !== ''),
      evolucion: formData.evolucion,
      recomendaciones: formData.recomendaciones,
      proximoControl: formData.proximoControl || null
    };

    try {
      const res = await fetch(`${API_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar consulta');

      navigate(`/historia-clinica/${idPaciente}`);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Nueva Consulta</h1>
          <p className="text-slate-400">Paciente: {hceData?.paciente?.nombresCompletos} {hceData?.paciente?.apellidosCompletos}</p>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold">Acceso Restringido</h4>
            <p className="text-sm">Solo el médico o el personal de salud puede llenar o modificar la información de esta consulta médica. Los campos han sido bloqueados.</p>
          </div>
        </div>
      )}

      <datalist id="lista-medicamentos">
        <option value="Paracetamol 500mg" />
        <option value="Ibuprofeno 400mg" />
        <option value="Amoxicilina 500mg" />
        <option value="Losartán 50mg" />
        <option value="Omeprazol 20mg" />
        <option value="Loratadina 10mg" />
        <option value="Diclofenaco 50mg" />
        <option value="Azitromicina 500mg" />
        <option value="Metformina 850mg" />
        <option value="Complejo B" />
      </datalist>
      <datalist id="lista-dosis">
        <option value="Tomar 1 tableta cada 8 horas por 5 días" />
        <option value="Tomar 1 tableta cada 12 horas por 3 días" />
        <option value="Tomar 1 tableta diaria por las mañanas" />
        <option value="Aplicar 1 vez al día" />
        <option value="Tomar en caso de dolor crónico" />
      </datalist>
      <datalist id="lista-evolucion">
        <option value="Paciente estable, sin signos de alarma." />
        <option value="Paciente presenta mejoría clínica." />
        <option value="Evolución favorable, tolerando vía oral." />
        <option value="El cuadro clínico se mantiene estacionario." />
        <option value="Paciente acude a control de rutina, sin novedades." />
      </datalist>
      <datalist id="lista-recomendaciones">
        <option value="Reposo absoluto por 3 días." />
        <option value="Mantener abundante hidratación." />
        <option value="Dieta blanda y evitar grasas/irritantes." />
        <option value="Realizar exámenes de laboratorio y regresar." />
        <option value="Acudir a urgencias en caso de presentar fiebre o dificultad para respirar." />
      </datalist>
      <datalist id="lista-hallazgos">
        <option value="Sin alteraciones evidentes." />
        <option value="Normal, sin hallazgos patológicos." />
        <option value="Dolor a la palpación." />
        <option value="Presencia de eritema y calor local." />
        <option value="Ruidos cardíacos rítmicos, no soplos." />
        <option value="Murmullo vesicular conservado, no ruidos sobreañadidos." />
        <option value="Abdomen blando, depresible, no doloroso." />
        <option value="Pupilas isocóricas normorreactivas a la luz." />
      </datalist>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Motivo y Enfermedad Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Motivo de Consulta *</label>
                <input
                  disabled={isReadOnly}
                  value={formData.motivoConsulta} onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Enfermedad Actual</label>
                <textarea rows="4"
                  disabled={isReadOnly}
                  value={formData.enfermedadActual} onChange={(e) => setFormData({ ...formData, enfermedadActual: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Examen Físico Regional
            </h3>
            {formData.examenFisico.map((ex, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <select
                    disabled={isReadOnly}
                    value={ex.regionAnatomica}
                    onChange={(e) => {
                      const newEx = [...formData.examenFisico];
                      newEx[index].regionAnatomica = e.target.value;
                      setFormData({ ...formData, examenFisico: newEx });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <option>Cabeza y Cuello</option>
                    <option>Tórax</option>
                    <option>Abdomen</option>
                    <option>Extremidades</option>
                    <option>Neurológico</option>
                  </select>
                </div>
                <div>
                  <input
                    disabled={isReadOnly}
                    list="lista-hallazgos"
                    placeholder="Hallazgos..."
                    value={ex.hallazgos}
                    onChange={(e) => {
                      const newEx = [...formData.examenFisico];
                      newEx[index].hallazgos = e.target.value;
                      setFormData({ ...formData, examenFisico: newEx });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <button
                onClick={() => setFormData({ ...formData, examenFisico: [...formData.examenFisico, { regionAnatomica: 'Abdomen', hallazgos: '' }] })}
                className="text-sm text-cyan-400 font-medium hover:text-cyan-300 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Agregar otra región
              </button>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Diagnóstico CIE-10
            </h3>
            
            <div className="space-y-3 mb-4">
              {formData.diagnosticos.map((diag, index) => (
                <div key={index} className="flex flex-col gap-2 bg-slate-700/50 px-4 py-3 rounded-lg border border-slate-600 relative">
                  {!isReadOnly && (
                    <button
                      onClick={() => {
                        const newD = formData.diagnosticos.filter((_, i) => i !== index);
                        setFormData({ ...formData, diagnosticos: newD });
                      }}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-400 font-bold"
                      title="Eliminar diagnóstico"
                    >
                      ✕
                    </button>
                  )}
                  <span className="text-slate-200 font-medium text-sm pr-6">{diag.label}</span>
                  <div className="flex gap-4">
                    <select
                      disabled={isReadOnly}
                      value={diag.tipoDiagnostico}
                      onChange={(e) => {
                        const newD = [...formData.diagnosticos];
                        newD[index].tipoDiagnostico = e.target.value;
                        setFormData({ ...formData, diagnosticos: newD });
                      }}
                      className="w-1/2 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Presuntivo">Presuntivo</option>
                      <option value="Definitivo">Definitivo</option>
                    </select>
                    <select
                      disabled={isReadOnly}
                      value={diag.condicionDiagnostico}
                      onChange={(e) => {
                        const newD = [...formData.diagnosticos];
                        newD[index].condicionDiagnostico = e.target.value;
                        setFormData({ ...formData, diagnosticos: newD });
                      }}
                      className="w-1/2 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Secundario">Secundario</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <div>
                {!showBuscadorCie10 ? (
                  <button
                    onClick={() => setShowBuscadorCie10(true)}
                    className="text-sm text-cyan-400 font-medium hover:text-cyan-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Agregar Diagnóstico
                  </button>
                ) : (
                  <div className="space-y-2 mt-2 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Buscar por código o nombre de enfermedad:</span>
                      <button onClick={() => setShowBuscadorCie10(false)} className="text-xs text-red-400 hover:text-red-300">Cerrar</button>
                    </div>
                    <AsyncSelect
                      isDisabled={isReadOnly}
                      cacheOptions defaultOptions={false} loadOptions={loadOptions} styles={selectStyles}
                      placeholder="Ej: A00 o Cólera..."
                      value={null}
                      onChange={(selected) => {
                        if (selected) {
                          setFormData({ ...formData, diagnosticos: [...formData.diagnosticos, { ...selected, condicionDiagnostico: 'Principal', tipoDiagnostico: 'Presuntivo' }] });
                          setShowBuscadorCie10(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Tratamiento y Medicación
            </h3>
            {formData.tratamientos.map((trat, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    disabled={isReadOnly}
                    list="lista-medicamentos"
                    placeholder="Nombre del medicamento..."
                    value={trat.nombreMedicamento}
                    onChange={(e) => {
                      const newT = [...formData.tratamientos];
                      newT[index].nombreMedicamento = e.target.value;
                      setFormData({ ...formData, tratamientos: newT });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <input
                    disabled={isReadOnly}
                    list="lista-dosis"
                    placeholder="Dosis e indicaciones..."
                    value={trat.indicacionesDosis}
                    onChange={(e) => {
                      const newT = [...formData.tratamientos];
                      newT[index].indicacionesDosis = e.target.value;
                      setFormData({ ...formData, tratamientos: newT });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <button
                onClick={() => setFormData({ ...formData, tratamientos: [...formData.tratamientos, { nombreMedicamento: '', indicacionesDosis: '' }] })}
                className="text-sm text-cyan-400 font-medium hover:text-cyan-300 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Agregar otro medicamento
              </button>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Evolución y Plan
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Evolución</label>
                <textarea rows="3"
                  disabled={isReadOnly}
                  value={formData.evolucion} onChange={(e) => setFormData({ ...formData, evolucion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!isReadOnly && <input list="lista-evolucion" onChange={(e) => { if (e.target.value) setFormData({ ...formData, evolucion: e.target.value }); e.target.value = ''; }} placeholder="💡 O selecciona una sugerencia rápida..." className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 outline-none placeholder-slate-500" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Recomendaciones</label>
                <textarea rows="3"
                  disabled={isReadOnly}
                  value={formData.recomendaciones} onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!isReadOnly && <input list="lista-recomendaciones" onChange={(e) => { if (e.target.value) setFormData({ ...formData, recomendaciones: e.target.value }); e.target.value = ''; }} placeholder="💡 O selecciona una sugerencia rápida..." className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 outline-none placeholder-slate-500" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Próximo Control</label>
                <input type="date"
                  disabled={isReadOnly}
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.proximoControl} onChange={(e) => setFormData({ ...formData, proximoControl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Signos Vitales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">P. Arterial</label>
                <input disabled={isReadOnly} value={formData.signosVitales.presionArterial} onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, presionArterial: e.target.value } })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm shadow-sm focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="120/80" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pulso</label>
                <input disabled={isReadOnly} type="number" value={formData.signosVitales.pulso} onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, pulso: e.target.value } })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm shadow-sm focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="75" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Temp (°C)</label>
                <input disabled={isReadOnly} type="number" step="0.1" value={formData.signosVitales.temperatura} onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, temperatura: e.target.value } })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm shadow-sm focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="36.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Peso (kg)</label>
                <input disabled={isReadOnly} type="number" step="0.1" value={formData.signosVitales.peso} onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, peso: e.target.value } })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm shadow-sm focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="70" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            {!isReadOnly ? (
              <button
                onClick={handleGuardarConsulta} disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-5 h-5" /> {loading ? 'Guardando...' : 'Guardar Consulta'}
              </button>
            ) : (
              <button disabled className="w-full bg-slate-700 text-slate-400 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <span className="text-lg">🔒</span> Formulario Bloqueado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

