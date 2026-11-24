import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Activity, Save, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import { buscarCie10, api, getAntecedentesPaciente } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { puede } from '../../auth/permisos';
import { alertasSignos, calcularImc, clasificarImc, signosParaApi } from '../../utils/clinica';

const CAMPOS_SIGNOS = [
  { k: 'presionArterial', label: 'P. arterial (mmHg)', ph: '120/80', tipo: 'text' },
  { k: 'pulso', label: 'Pulso (lpm)', ph: '75' },
  { k: 'frecuenciaRespiratoria', label: 'F. respiratoria (rpm)', ph: '16' },
  { k: 'temperatura', label: 'Temperatura (°C)', ph: '36.5', step: '0.1' },
  { k: 'saturacionOxigeno', label: 'SpO₂ (%)', ph: '98' },
  { k: 'pesoKg', label: 'Peso (kg)', ph: '70', step: '0.1' },
  { k: 'tallaCm', label: 'Talla (cm)', ph: '165', step: '0.1' },
];
const NIVEL_COLOR = { normal: 'text-teal-300', alerta: 'text-amber-300', critico: 'text-rose-300' };
import { selectStyles } from '../../styles/reactSelectStyles';

export const NuevaConsultaForm = () => {
  const { idPaciente } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const isReadOnly = !puede(usuario, 'crearConsulta');
  const [alergias, setAlergias] = useState([]);

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
      pesoKg: '',
      tallaCm: '',
      grupoSanguineo: ''
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
    api.get(`/historia-clinica/paciente/${idPaciente}`)
      .then(setHceData)
      .catch(err => alert(err.message));
    getAntecedentesPaciente(idPaciente)
      .then(ants => setAlergias(ants.filter(a => a.tipoAntecedente === 'Alergia')))
      .catch(() => setAlergias([]));
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
      motivoConsulta: formData.motivoConsulta,
      enfermedadActual: formData.enfermedadActual,
      signosVitales: signosParaApi(formData.signosVitales),
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
      await api.post('/consultas', dto);

      navigate(`/historia-clinica/${idPaciente}`);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const imc = calcularImc(formData.signosVitales.pesoKg, formData.signosVitales.tallaCm);
  const claseImc = clasificarImc(imc);
  const avisos = alertasSignos(formData.signosVitales);

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

      {alergias.length > 0 && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/50 text-rose-200 px-5 py-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 text-rose-400 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Paciente con alergias registradas</p>
            <p className="text-sm">{alergias.map(a => a.enfermedadAsociada).join(' · ')}. Revise antes de prescribir.</p>
          </div>
        </div>
      )}

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
              {CAMPOS_SIGNOS.map(c => (
                <label key={c.k} className="block text-xs font-medium text-slate-400">
                  {c.label}
                  <input disabled={isReadOnly} type={c.tipo || 'number'} step={c.step} inputMode={c.tipo ? undefined : 'decimal'}
                    placeholder={c.ph} value={formData.signosVitales[c.k]}
                    onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, [c.k]: e.target.value } })}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm shadow-sm focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50" />
                </label>
              ))}
              <label className="block text-xs font-medium text-slate-400">
                Grupo sanguíneo
                <select disabled={isReadOnly} value={formData.signosVitales.grupoSanguineo}
                  onChange={(e) => setFormData({ ...formData, signosVitales: { ...formData.signosVitales, grupoSanguineo: e.target.value } })}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-sm">
                  <option value="">—</option>
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm flex justify-between">
              <span className="text-slate-400">IMC</span>
              <span className={imc == null ? 'text-slate-500' : NIVEL_COLOR[claseImc.nivel]}>
                {imc == null ? 'Ingrese peso y talla' : `${imc} kg/m² · ${claseImc.etiqueta}`}
              </span>
            </div>

            {avisos.length > 0 && (
              <ul className="mt-3 space-y-1" aria-live="polite">
                {avisos.map(a => (
                  <li key={a.texto} className={`text-xs px-3 py-1.5 rounded-md ${a.nivel === 'critico' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                    {a.nivel === 'critico' ? 'Crítico: ' : 'Atención: '}{a.texto}
                  </li>
                ))}
              </ul>
            )}
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

