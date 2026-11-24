import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Alergias, AvisosSignos, Campo, Encabezado, Estado, Mensaje, Seccion } from '../../components/ui';
import { hora } from '../../utils/formato';
import { BuscadorCie10 } from '../../components/BuscadorCie10';
import { SignosVitales } from '../../components/SignosVitales';
import { SIGNOS_VACIOS, alertasSignos, calcularEdad, calcularImc, signosParaApi } from '../../utils/clinica';

const REGIONES = ['Cabeza y cuello', 'Tórax', 'Corazón', 'Pulmones', 'Abdomen', 'Extremidades', 'Piel', 'Neurológico', 'Genitourinario'];
const RECETA_VACIA = { nombreMedicamento: '', formaFarmaceutica: 'Tableta', concentracion: '', dosis: '', via: 'Oral', frecuencia: '', duracion: '', cantidad: '', indicacionesDosis: '' };
const ORDEN_VACIA = { tipo: 'Laboratorio', descripcion: '', indicacion: '', prioridad: 'Rutina' };
const FORMAS = ['Tableta', 'Cápsula', 'Jarabe', 'Suspensión', 'Gotas', 'Crema', 'Ungüento', 'Inyectable', 'Inhalador', 'Óvulo', 'Supositorio'];
const VIAS = ['Oral', 'Sublingual', 'Tópica', 'Intramuscular', 'Intravenosa', 'Subcutánea', 'Inhalatoria', 'Oftálmica', 'Ótica', 'Nasal', 'Vaginal', 'Rectal'];

const formVacio = { motivoConsulta: '', enfermedadActual: '', revisionSistemas: '', evolucion: '', recomendaciones: '', proximoControl: '', examenFisico: [], diagnosticos: [], tratamientos: [], ordenes: [] };

/** Nota del médico. Nueva (/consultas/nueva/:idPaciente) o borrador/triaje (/consultas/:id/editar). */
export function ConsultaEditor() {
  const { id, idPaciente } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [idHistoria, setIdHistoria] = useState(null);
  const [consulta, setConsulta] = useState(null);
  const [triaje, setTriaje] = useState(null);
  const [signos, setSignos] = useState(SIGNOS_VACIOS);
  const [alergias, setAlergias] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        let pid = idPaciente;
        if (id) {
          const d = await api.get(`/consultas/${id}`);
          const c = d.consulta;
          if (c.estadoConsulta === 'Firmada') { navigate(`/consultas/${id}`, { replace: true }); return; }
          setConsulta(c);
          setTriaje(d.signosVitales || null);
          pid = d.paciente.idPaciente;
          setForm({
            motivoConsulta: c.motivoConsulta || '', enfermedadActual: c.enfermedadActual || '', revisionSistemas: c.revisionSistemas || '',
            evolucion: c.evolucion || '', recomendaciones: c.recomendaciones || '', proximoControl: c.proximoControl || '',
            examenFisico: d.examenFisico.map(({ regionAnatomica, hallazgos }) => ({ regionAnatomica, hallazgos })),
            diagnosticos: d.diagnosticos.map((x) => ({ cie: x.catalogoCie10, tipoDiagnostico: x.tipoDiagnostico, condicionDiagnostico: x.condicionDiagnostico, descripcionClinica: x.descripcionClinica || '' })),
            tratamientos: d.tratamientos.map((t) => Object.fromEntries(Object.keys(RECETA_VACIA).map((k) => [k, t[k] ?? '']))),
            ordenes: d.ordenes.map(({ tipo, descripcion, indicacion, prioridad }) => ({ tipo, descripcion, indicacion: indicacion || '', prioridad })),
          });
        }
        const h = await api.get(`/historia-clinica/paciente/${pid}`);
        setPaciente(h.paciente);
        setIdHistoria(h.historia_clinica.idHistoriaClinica);
        const ants = await api.get(`/antecedentes/paciente/${pid}`);
        setAlergias(ants.filter((a) => a.tipoAntecedente === 'Alergia').map((a) => a.enfermedadAsociada));
      } catch (e) {
        setEstado({ tipo: 'error', texto: e.message });
      }
    };
    cargar();
  }, [id, idPaciente, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const lista = (k, i, campo) => (e) => {
    const copia = form[k].map((x, j) => (j === i ? { ...x, [campo]: e.target.value } : x));
    setForm({ ...form, [k]: copia });
  };
  const quitar = (k, i) => setForm({ ...form, [k]: form[k].filter((_, j) => j !== i) });

  const cuerpo = () => ({
    idHistoriaClinica: idHistoria,
    ...form,
    proximoControl: form.proximoControl || null,
    signosVitales: triaje ? null : (Object.values(signos).some((v) => v !== '') ? signosParaApi(signos) : null),
    examenFisico: form.examenFisico.filter((x) => x.hallazgos.trim()),
    diagnosticos: form.diagnosticos.map((d) => ({ idCie10: d.cie.idCie10, tipoDiagnostico: d.tipoDiagnostico, condicionDiagnostico: d.condicionDiagnostico, descripcionClinica: d.descripcionClinica })),
  });

  const guardar = async () => {
    const r = id ? await api.put(`/consultas/${id}`, cuerpo()) : await api.post('/consultas', cuerpo());
    return r.consultaId;
  };

  const borrador = async () => {
    setEnviando(true);
    try {
      const cid = await guardar();
      setEstado({ tipo: 'ok', texto: `Borrador guardado a las ${hora(new Date())}.` });
      if (!id) navigate(`/consultas/${cid}/editar`, { replace: true });
    } catch (e) { setEstado({ tipo: 'error', texto: e.message }); }
    finally { setEnviando(false); }
  };

  const firmar = async () => {
    if (!window.confirm('Al firmar, la nota queda cerrada. Las correcciones posteriores se harán como adendas. ¿Firmar ahora?')) return;
    setEnviando(true);
    try {
      const cid = await guardar();
      await api.post(`/consultas/${cid}/firmar`);
      navigate(`/consultas/${cid}`, { replace: true });
    } catch (e) { setEstado({ tipo: 'error', texto: e.message }); setEnviando(false); }
  };

  if (!paciente) return <Mensaje estado={estado || { tipo: 'info', texto: 'Cargando…' }} />;
  const todasAlergias = [...alergias, ...(consulta?.alergiasReportadas ? [`Refiere hoy: ${consulta.alergiasReportadas}`] : [])];

  return (
    <>
      <Encabezado indice={`${paciente.numeroHistoriaClinica} · ${calcularEdad(paciente.fechaNacimiento)} años · ${paciente.sexo}`}
        titulo={`${paciente.nombresCompletos} ${paciente.apellidosCompletos}`}
        subtitulo={consulta?.estadoConsulta === 'Triaje' ? 'Llegó desde triaje. Complete la nota y fírmela al terminar.' : 'Nota médica. Se guarda como borrador hasta que la firme.'}>
        {consulta && <Estado valor={consulta.estadoConsulta} />}
      </Encabezado>
      <Mensaje estado={estado} />
      <div className="mb-6"><Alergias lista={todasAlergias} /></div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-6 escalonado">
          <Seccion indice="01" titulo="Anamnesis">
            <div className="flex flex-col gap-4">
              <Campo etiqueta="Motivo de consulta *"><input className="input" required maxLength={5000} value={form.motivoConsulta} onChange={set('motivoConsulta')} /></Campo>
              <Campo etiqueta="Enfermedad actual"><textarea className="input" rows={4} value={form.enfermedadActual} onChange={set('enfermedadActual')} placeholder="Inicio, evolución, características, síntomas asociados…" /></Campo>
              <Campo etiqueta="Revisión por aparatos y sistemas"><textarea className="input" rows={3} value={form.revisionSistemas} onChange={set('revisionSistemas')} /></Campo>
            </div>
          </Seccion>

          <Seccion indice="02" titulo="Examen físico"
            accion={<button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, examenFisico: [...form.examenFisico, { regionAnatomica: REGIONES[form.examenFisico.length % REGIONES.length], hallazgos: '' }] })}>Añadir región</button>}>
            {form.examenFisico.length === 0 && <p className="tenue text-sm">Añada las regiones exploradas.</p>}
            {form.examenFisico.map((x, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 mb-2">
                <select className="input" value={x.regionAnatomica} onChange={lista('examenFisico', i, 'regionAnatomica')} aria-label="Región">{REGIONES.map((r) => <option key={r}>{r}</option>)}</select>
                <input className="input" value={x.hallazgos} onChange={lista('examenFisico', i, 'hallazgos')} placeholder="Hallazgos" aria-label="Hallazgos" />
                <button type="button" className="btn btn-sm btn-texto" onClick={() => quitar('examenFisico', i)} aria-label="Quitar región">×</button>
              </div>
            ))}
          </Seccion>

          <Seccion indice="03" titulo="Diagnóstico CIE-10">
            <BuscadorCie10 onElegir={(cie) => setForm({ ...form, diagnosticos: [...form.diagnosticos, { cie, tipoDiagnostico: 'Presuntivo', condicionDiagnostico: form.diagnosticos.length ? 'Secundario' : 'Principal', descripcionClinica: '' }] })} />
            <div className="mt-3">
              {form.diagnosticos.map((d, i) => (
                <div key={i} className="fila flex-wrap">
                  <span className="num font-semibold w-14">{d.cie.codigoCie}</span>
                  <span className="flex-1 min-w-[180px] capitalize">{d.cie.nombreEnfermedad.toLowerCase()}</span>
                  <select className="input w-auto" value={d.tipoDiagnostico} onChange={lista('diagnosticos', i, 'tipoDiagnostico')} aria-label="Tipo"><option>Presuntivo</option><option>Definitivo</option></select>
                  <select className="input w-auto" value={d.condicionDiagnostico} onChange={lista('diagnosticos', i, 'condicionDiagnostico')} aria-label="Condición"><option>Principal</option><option>Secundario</option></select>
                  <button type="button" className="btn btn-sm btn-texto" onClick={() => quitar('diagnosticos', i)} aria-label="Quitar diagnóstico">×</button>
                </div>
              ))}
            </div>
          </Seccion>

          <Seccion indice="04" titulo="Receta"
            accion={<button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, tratamientos: [...form.tratamientos, { ...RECETA_VACIA }] })}>Añadir medicamento</button>}>
            {todasAlergias.length > 0 && form.tratamientos.length > 0 && <p className="aviso aviso-alerta mb-3">Revise la prescripción frente a: {todasAlergias.join(' · ')}</p>}
            {form.tratamientos.length === 0 && <p className="tenue text-sm">Prescripción por principio activo (DCI). Los medicamentos sujetos a fiscalización requieren receta especial.</p>}
            {form.tratamientos.map((t, i) => (
              <div key={i} className="tarjeta-plana mb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Campo etiqueta="Principio activo (DCI)" className="col-span-2"><input className="input" value={t.nombreMedicamento} onChange={lista('tratamientos', i, 'nombreMedicamento')} placeholder="Paracetamol" /></Campo>
                <Campo etiqueta="Forma"><select className="input" value={t.formaFarmaceutica} onChange={lista('tratamientos', i, 'formaFarmaceutica')}>{FORMAS.map((f) => <option key={f}>{f}</option>)}</select></Campo>
                <Campo etiqueta="Concentración"><input className="input" value={t.concentracion} onChange={lista('tratamientos', i, 'concentracion')} placeholder="500 mg" /></Campo>
                <Campo etiqueta="Dosis"><input className="input" value={t.dosis} onChange={lista('tratamientos', i, 'dosis')} placeholder="1 tableta" /></Campo>
                <Campo etiqueta="Vía"><select className="input" value={t.via} onChange={lista('tratamientos', i, 'via')}>{VIAS.map((v) => <option key={v}>{v}</option>)}</select></Campo>
                <Campo etiqueta="Frecuencia"><input className="input" value={t.frecuencia} onChange={lista('tratamientos', i, 'frecuencia')} placeholder="Cada 8 horas" /></Campo>
                <Campo etiqueta="Duración"><input className="input" value={t.duracion} onChange={lista('tratamientos', i, 'duracion')} placeholder="3 días" /></Campo>
                <Campo etiqueta="Cantidad total"><input className="input num" inputMode="numeric" value={t.cantidad} onChange={lista('tratamientos', i, 'cantidad')} placeholder="9" /></Campo>
                <Campo etiqueta="Indicaciones" className="col-span-2 md:col-span-2"><input className="input" value={t.indicacionesDosis} onChange={lista('tratamientos', i, 'indicacionesDosis')} placeholder="Después de las comidas" /></Campo>
                <div className="flex items-end"><button type="button" className="btn btn-sm btn-texto btn-peligro" onClick={() => quitar('tratamientos', i)}>Quitar</button></div>
              </div>
            ))}
          </Seccion>

          <Seccion indice="05" titulo="Órdenes e interconsultas"
            accion={<button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, ordenes: [...form.ordenes, { ...ORDEN_VACIA }] })}>Añadir orden</button>}>
            {form.ordenes.length === 0 && <p className="tenue text-sm">Laboratorio, imagen, interconsulta o procedimiento.</p>}
            {form.ordenes.map((o, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[150px_1fr_1fr_120px_auto] gap-2 mb-2">
                <select className="input" value={o.tipo} onChange={lista('ordenes', i, 'tipo')} aria-label="Tipo de orden">{['Laboratorio', 'Imagen', 'Interconsulta', 'Procedimiento'].map((x) => <option key={x}>{x}</option>)}</select>
                <input className="input" value={o.descripcion} onChange={lista('ordenes', i, 'descripcion')} placeholder="Biometría hemática" aria-label="Descripción" />
                <input className="input" value={o.indicacion} onChange={lista('ordenes', i, 'indicacion')} placeholder="Indicación clínica" aria-label="Indicación" />
                <select className="input" value={o.prioridad} onChange={lista('ordenes', i, 'prioridad')} aria-label="Prioridad"><option>Rutina</option><option>Urgente</option></select>
                <button type="button" className="btn btn-sm btn-texto" onClick={() => quitar('ordenes', i)} aria-label="Quitar orden">×</button>
              </div>
            ))}
          </Seccion>

          <Seccion indice="06" titulo="Evaluación y plan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo etiqueta="Evaluación / evolución" className="md:col-span-2"><textarea className="input" rows={3} value={form.evolucion} onChange={set('evolucion')} /></Campo>
              <Campo etiqueta="Indicaciones y señales de alarma para el paciente" className="md:col-span-2"><textarea className="input" rows={3} value={form.recomendaciones} onChange={set('recomendaciones')} placeholder="Acudir a emergencia si presenta dificultad para respirar, fiebre que no cede…" /></Campo>
              <Campo etiqueta="Próximo control"><input type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={form.proximoControl} onChange={set('proximoControl')} /></Campo>
            </div>
          </Seccion>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-6 aparece">
          <section className="tarjeta">
            <p className="etiqueta mb-3">Triaje</p>
            {triaje ? (
              <>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2">
                  {[['PA', triaje.presionArterial], ['FC', triaje.pulso], ['FR', triaje.frecuenciaRespiratoria], ['T °C', triaje.temperatura], ['SpO₂', triaje.saturacionOxigeno], ['IMC', calcularImc(triaje.pesoKg, triaje.tallaCm)]]
                    .map(([k, v]) => <div key={k}><dt className="etiqueta">{k}</dt><dd className="num text-[17px] font-medium mt-0.5">{v ?? '—'}</dd></div>)}
                </dl>
                <div className="mt-3"><AvisosSignos avisos={alertasSignos(triaje)} /></div>
                <p className="tenue text-xs mt-3">{triaje.enfermero?.nombresCompletos}</p>
                {consulta?.notaEnfermeria && <p className="text-[13px] mt-3 pt-3 border-t border-[var(--regla)]"><span className="etiqueta block mb-1">Nota de enfermería</span>{consulta.notaEnfermeria}</p>}
              </>
            ) : (
              <>
                <p className="tenue text-xs mb-3">Sin triaje. Puede registrar los signos aquí.</p>
                <SignosVitales valor={signos} onChange={setSignos} />
              </>
            )}
          </section>
          <section className="tarjeta flex flex-col gap-2">
            <button type="button" className="btn btn-primario justify-between" disabled={enviando || !form.motivoConsulta.trim()} onClick={firmar}>
              Firmar y cerrar<span className="flecha">→</span>
            </button>
            <button type="button" className="btn" disabled={enviando || !form.motivoConsulta.trim()} onClick={borrador}>Guardar borrador</button>
            <p className="tenue text-xs mt-1">Para firmar se necesita al menos un diagnóstico. Firmada, la nota no se edita: se corrige con adendas.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
