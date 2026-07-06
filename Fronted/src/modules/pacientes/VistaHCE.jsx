import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, Clock, Activity, FileText, Plus, AlertCircle } from 'lucide-react';
import { API_URL, getAntecedentesPaciente, saveAntecedente } from '../../services/api';

export const VistaHCE = () => {
  const { idPaciente } = useParams();
  const navigate = useNavigate();

  const [hceData, setHceData] = useState(null);
  const [antecedentes, setAntecedentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = localStorage.getItem('userRol');
  const isReadOnly = userRole === 'Admision';

  const [showAntForm, setShowAntForm] = useState(false);
  const [antForm, setAntForm] = useState({
    tipoAntecedente: 'Personal',
    enfermedadAsociada: '',
    parentescoFamiliar: '',
    alergiasPrincipales: '',
    descripcionAdicional: ''
  });
  const [antLoading, setAntLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resHce = await fetch(`${API_URL}/historia-clinica/paciente/${idPaciente}`);
        if (!resHce.ok) throw new Error('No se pudo cargar la historia clínica');
        const dataHce = await resHce.json();
        setHceData(dataHce);

        const dataAnt = await getAntecedentesPaciente(idPaciente);
        setAntecedentes(dataAnt);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idPaciente]);

  const descargarPdf = async () => {
    try {
      const res = await fetch(`${API_URL}/pdf/historia/${idPaciente}`);
      if (!res.ok) throw new Error('Error al generar PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Historia_Clinica_${hceData?.paciente?.cedulaIdentidad}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al descargar el PDF: " + err.message);
    }
  };

  const handleSaveAntecedente = async (e) => {
    e.preventDefault();
    setAntLoading(true);
    try {
      const payload = {
        idPaciente: idPaciente,
        ...antForm
      };
      const result = await saveAntecedente(payload);
      setAntecedentes([...antecedentes, result.antecedente]);
      setShowAntForm(false);
      setAntForm({
        tipoAntecedente: 'Personal',
        enfermedadAsociada: '',
        parentescoFamiliar: '',
        alergiasPrincipales: '',
        descripcionAdicional: ''
      });
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAntLoading(false);
    }
  };

  if (loading) return <div className="text-slate-100 p-8 animate-pulse">Cargando Historia Clínica...</div>;
  if (error) return <div className="text-rose-600 p-8">Error: {error}</div>;
  if (!hceData) return null;

  const { paciente, historia_clinica, consultas } = hceData;

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff_ms = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff_ms).getUTCFullYear() - 1970);
  };

  const personales = antecedentes.filter(a => a.tipoAntecedente === 'Personal');
  const familiares = antecedentes.filter(a => a.tipoAntecedente === 'Familiar');
  const patologicos = antecedentes.filter(a => a.tipoAntecedente === 'Patológico');
  const quirurgicos = antecedentes.filter(a => a.tipoAntecedente === 'Quirúrgico');
  const alergias = antecedentes.filter(a => a.tipoAntecedente === 'Alergia');

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <button onClick={() => navigate('/pacientes')} className="p-2 mr-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Historia Clínica Electrónica</h1>
            <p className="text-slate-400">HC: {paciente.numeroHistoriaClinica} | Fecha Apertura: {new Date(historia_clinica.fechaApertura).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/consultas/nueva/${idPaciente}`)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <Activity size={18} className="mr-2" />
            Nueva Consulta
          </button>
          <button
            onClick={descargarPdf}
            className="flex items-center px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <Printer size={18} className="mr-2" />
            Imprimir PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna Izquierda: Datos y Antecedentes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <FileText size={100} />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-4 relative z-10">Datos del Paciente</h2>
            <div className="space-y-3 relative z-10 text-sm">
              <div>
                <p className="text-slate-400">Nombres y Apellidos</p>
                <p className="text-slate-100 font-medium text-lg">{paciente.nombresCompletos} {paciente.apellidosCompletos}</p>
              </div>
              <div>
                <p className="text-slate-400">Cédula de Identidad</p>
                <p className="text-slate-100">{paciente.cedulaIdentidad}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Edad</p>
                  <p className="text-slate-100">{calculateAge(paciente.fechaNacimiento)} años</p>
                </div>
                <div>
                  <p className="text-slate-400">Sexo</p>
                  <p className="text-slate-100">{paciente.sexo}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400">Estado Civil</p>
                <p className="text-slate-100">{paciente.estadoCivil || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-slate-400">Teléfono</p>
                <p className="text-slate-100">{paciente.telefono || 'No registrado'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100">Antecedentes</h2>
              {!isReadOnly && (
                <button
                  onClick={() => setShowAntForm(!showAntForm)}
                  className="p-1.5 bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/60 rounded-lg transition-colors border border-cyan-800"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {showAntForm && (
              <form onSubmit={handleSaveAntecedente} className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">Nuevo Antecedente</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo *</label>
                  <select
                    value={antForm.tipoAntecedente} onChange={e => setAntForm({ ...antForm, tipoAntecedente: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg p-2 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="Personal">Personales</option>
                    <option value="Familiar">Familiares</option>
                    <option value="Patológico">Patológicos</option>
                    <option value="Quirúrgico">Quirúrgicos</option>
                    <option value="Alergia">Alergias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción / Condición *</label>
                  <input
                    required list="opcionesComunes"
                    value={antForm.enfermedadAsociada} onChange={e => setAntForm({ ...antForm, enfermedadAsociada: e.target.value })}
                    placeholder="Ej. Hipertensión, Penicilina..."
                    className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg p-2 text-sm outline-none focus:border-cyan-500"
                  />
                  <datalist id="opcionesComunes">
                    {antForm.tipoAntecedente === 'Patológico' || antForm.tipoAntecedente === 'Familiar' ? (
                      <>
                        <option value="Hipertensión Arterial" />
                        <option value="Diabetes Mellitus Tipo 2" />
                        <option value="Asma Bronquial" />
                        <option value="Hipotiroidismo" />
                        <option value="Enfermedad Renal Crónica" />
                        <option value="Cáncer" />
                      </>
                    ) : antForm.tipoAntecedente === 'Quirúrgico' ? (
                      <>
                        <option value="Apendicectomía" />
                        <option value="Colecistectomía" />
                        <option value="Cesárea" />
                        <option value="Hernioplastia" />
                        <option value="Amigdalectomía" />
                      </>
                    ) : antForm.tipoAntecedente === 'Alergia' ? (
                      <>
                        <option value="Penicilina" />
                        <option value="AINEs (Ibuprofeno, Diclofenaco)" />
                        <option value="Polvo / Ácaros" />
                        <option value="Mariscos" />
                        <option value="Látex" />
                      </>
                    ) : (
                      <>
                        <option value="Tabaquismo" />
                        <option value="Consumo de Alcohol" />
                        <option value="Sedentarismo" />
                        <option value="Vacunación Completa" />
                      </>
                    )}
                  </datalist>
                </div>
                {antForm.tipoAntecedente === 'Familiar' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Parentesco *</label>
                    <input
                      required list="parentescos"
                      value={antForm.parentescoFamiliar} onChange={e => setAntForm({ ...antForm, parentescoFamiliar: e.target.value })}
                      placeholder="Seleccione o escriba..."
                      className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg p-2 text-sm outline-none focus:border-cyan-500"
                    />
                    <datalist id="parentescos">
                      <option value="Padre" />
                      <option value="Madre" />
                      <option value="Abuelo Paterno" />
                      <option value="Abuela Paterna" />
                      <option value="Abuelo Materno" />
                      <option value="Abuela Materna" />
                      <option value="Hermano/a" />
                    </datalist>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Notas Adicionales</label>
                  <input
                    value={antForm.descripcionAdicional} onChange={e => setAntForm({ ...antForm, descripcionAdicional: e.target.value })}
                    placeholder="Opcional..."
                    className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg p-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAntForm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" disabled={antLoading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                    {antLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-6">

              {/* Alergias */}
              <div>
                <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2 flex items-center"><AlertCircle size={14} className="mr-1" /> Alergias</h3>
                {alergias.length > 0 ? (
                  <ul className="space-y-2">
                    {alergias.map(a => (
                      <li key={a.idAntecedente} className="bg-rose-900/20 p-3 rounded-lg border border-rose-800/50">
                        <p className="text-sm text-rose-400 font-bold">{a.enfermedadAsociada}</p>
                        {a.descripcionAdicional && <p className="text-xs text-rose-300 mt-1">{a.descripcionAdicional}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-500 italic">No registra alergias conocidas.</p>}
              </div>

              {/* Patológicos */}
              <div>
                <h3 className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">Patológicos</h3>
                {patologicos.length > 0 ? (
                  <ul className="space-y-2">
                    {patologicos.map(a => (
                      <li key={a.idAntecedente} className="bg-slate-700/30 p-2.5 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-200">{a.enfermedadAsociada}</p>
                        {a.descripcionAdicional && <p className="text-xs text-slate-400 mt-1">{a.descripcionAdicional}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-500 italic">No registra patologías.</p>}
              </div>

              {/* Quirúrgicos */}
              <div>
                <h3 className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-2">Quirúrgicos</h3>
                {quirurgicos.length > 0 ? (
                  <ul className="space-y-2">
                    {quirurgicos.map(a => (
                      <li key={a.idAntecedente} className="bg-slate-700/30 p-2.5 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-200">{a.enfermedadAsociada}</p>
                        {a.descripcionAdicional && <p className="text-xs text-slate-400 mt-1">{a.descripcionAdicional}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-500 italic">No registra cirugías.</p>}
              </div>

              {/* Familiares */}
              <div>
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Familiares</h3>
                {familiares.length > 0 ? (
                  <ul className="space-y-2">
                    {familiares.map(a => (
                      <li key={a.idAntecedente} className="bg-slate-700/30 p-2.5 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-slate-200">{a.enfermedadAsociada}</p>
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full">{a.parentescoFamiliar}</span>
                        </div>
                        {a.descripcionAdicional && <p className="text-xs text-slate-400 mt-1">{a.descripcionAdicional}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-500 italic">No registra antecedentes familiares.</p>}
              </div>

              {/* Personales (Hábitos, etc) */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Personales (Hábitos)</h3>
                {personales.length > 0 ? (
                  <ul className="space-y-2">
                    {personales.map(a => (
                      <li key={a.idAntecedente} className="bg-slate-700/30 p-2.5 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-200">{a.enfermedadAsociada}</p>
                        {a.descripcionAdicional && <p className="text-xs text-slate-400 mt-1">{a.descripcionAdicional}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-slate-500 italic">No registra hábitos personales.</p>}
              </div>

            </div>
          </div>
        </div>

        {/* Columna Derecha: Línea de Tiempo de Consultas */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-6 hover-lift min-h-[500px]">
            <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-4">Historial de Consultas</h2>

            {consultas && consultas.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">

                {consultas.map((consulta, idx) => (
                  <div key={consulta.idConsulta} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icono central de la linea de tiempo */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-800 text-cyan-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <Activity size={18} />
                    </div>
                    {/* Tarjeta de consulta */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-cyan-400">Consulta de Control</span>
                        <span className="text-xs text-slate-400 flex items-center">
                          <Calendar size={12} className="mr-1" /> {new Date(consulta.fechaHoraAtencion).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2"><span className="text-slate-500">Motivo:</span> {consulta.motivoConsulta}</p>
                      <p className="text-sm text-slate-300"><span className="text-slate-500">Enfermedad Actual:</span> {consulta.enfermedadActual}</p>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => navigate(`/consultas/ver/${consulta.idConsulta}`)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                          Ver Detalle Completo &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aún no hay consultas registradas para este paciente.</p>
                <button
                  onClick={() => navigate(`/consultas/nueva/${idPaciente}`)}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium border border-blue-200"
                >
                  Registrar Primera Consulta
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

