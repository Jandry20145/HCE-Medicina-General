import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Alergias, Campo, Encabezado, Mensaje, Seccion } from '../components/ui';
import { SignosVitales } from '../components/SignosVitales';
import { SIGNOS_VACIOS, calcularEdad, signosParaApi } from '../utils/clinica';

/** Triaje de enfermería: abre la consulta con signos vitales y la deja en la cola del médico. */
export function Triaje() {
  const { idPaciente } = useParams();
  const [params] = useSearchParams();
  const idCita = params.get('cita');
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [alergias, setAlergias] = useState([]);
  const [form, setForm] = useState({ motivo: '', alergiasReportadas: '', notaEnfermeria: '' });
  const [signos, setSignos] = useState(SIGNOS_VACIOS);
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get(`/pacientes/${idPaciente}`).then(setPaciente).catch((e) => setEstado({ tipo: 'error', texto: e.message }));
    api.get(`/antecedentes/paciente/${idPaciente}`)
      .then((a) => setAlergias(a.filter((x) => x.tipoAntecedente === 'Alergia').map((x) => x.enfermedadAsociada))).catch(() => {});
  }, [idPaciente]);

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/consultas/triaje', {
        idPaciente: Number(idPaciente), idCita: idCita ? Number(idCita) : null, ...form, signosVitales: signosParaApi(signos),
      });
      navigate(idCita ? '/' : `/pacientes/${idPaciente}`, { replace: true });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      setEnviando(false);
    }
  };

  return (
    <>
      <Encabezado indice={paciente ? `${paciente.numeroHistoriaClinica} · ${calcularEdad(paciente.fechaNacimiento)} años · ${paciente.sexo}` : 'Triaje'}
        titulo={paciente ? `Triaje · ${paciente.nombresCompletos}` : 'Triaje'}
        subtitulo="Al guardar, el paciente pasa a la cola del médico con estos datos, la hora y su nombre." />
      <Mensaje estado={estado} />
      <div className="mb-6"><Alergias lista={alergias} /></div>
      <form onSubmit={guardar} className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start escalonado">
        <Seccion indice="01" titulo="Signos vitales">
          <SignosVitales valor={signos} onChange={setSignos} />
        </Seccion>
        <Seccion indice="02" titulo="Observaciones de ingreso">
          <div className="flex flex-col gap-4">
            <Campo etiqueta="Motivo breve *"><input className="input" required maxLength={500} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej.: dolor de garganta hace 2 días" /></Campo>
            <Campo etiqueta="Alergias que refiere hoy" ayuda="Si es nueva, regístrela también en Antecedentes del paciente.">
              <input className="input" maxLength={500} value={form.alergiasReportadas} onChange={(e) => setForm({ ...form, alergiasReportadas: e.target.value })} placeholder="Ninguna conocida" />
            </Campo>
            <Campo etiqueta="Nota de enfermería"><textarea className="input" rows={4} maxLength={5000} value={form.notaEnfermeria} onChange={(e) => setForm({ ...form, notaEnfermeria: e.target.value })} /></Campo>
            <p className="tenue text-xs">Enfermería no registra diagnósticos ni prescripciones.</p>
            <button className="btn btn-primario self-start" disabled={enviando}>{enviando ? 'Guardando…' : 'Enviar al médico'}<span className="flecha">→</span></button>
          </div>
        </Seccion>
      </form>
    </>
  );
}
