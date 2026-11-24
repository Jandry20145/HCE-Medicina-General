import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiFetch } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { puede } from '../../auth/permisos';
import { Alergias, Campo, Encabezado, Estado, Mensaje, Seccion, Vacio } from '../../components/ui';
import { fecha, fechaHora } from '../../utils/formato';
import { calcularEdad, calcularImc } from '../../utils/clinica';

const TIPOS_ANT = ['Personal', 'Patológico', 'Quirúrgico', 'Familiar', 'Alergia'];
const TIPOS_PROC = { Inyectable: 'Inyectable', Curacion: 'Curación', TomaMuestra: 'Toma de muestra', Nebulizacion: 'Nebulización', Otro: 'Otro' };

export function Paciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [hce, setHce] = useState(null);
  const [antecedentes, setAntecedentes] = useState([]);
  const [ultimos, setUltimos] = useState(null);
  const [estado, setEstado] = useState(null);
  const [ant, setAnt] = useState(null);
  const [proc, setProc] = useState(null);

  const cargar = useCallback(() => api.get(`/historia-clinica/paciente/${id}`)
    .then((h) => {
      setHce(h);
      const reciente = h.consultas[0];
      if (reciente) api.get(`/consultas/${reciente.idConsulta}`).then((d) => setUltimos(d.signosVitales ? { ...d.signosVitales, fecha: reciente.fechaHoraAtencion } : null)).catch(() => {});
      return api.get(`/antecedentes/paciente/${id}`).then(setAntecedentes);
    })
    .catch((e) => setEstado({ tipo: 'error', texto: e.message })), [id]);
  useEffect(() => { cargar(); }, [cargar]);

  if (!hce) return <Mensaje estado={estado || { tipo: 'info', texto: 'Cargando historia clínica…' }} />;
  const { paciente: p, consultas, procedimientos, citas } = hce;
  const alergias = antecedentes.filter((a) => a.tipoAntecedente === 'Alergia').map((a) => a.enfermedadAsociada);
  const proximas = citas.filter((c) => ['Programada', 'Confirmada', 'EnEspera'].includes(c.estado));

  const guardarAnt = async (e) => {
    e.preventDefault();
    try {
      await api.post('/antecedentes', { idPaciente: Number(id), ...ant });
      setAnt(null);
      setEstado({ tipo: 'ok', texto: 'Antecedente registrado.' });
      cargar();
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };
  const guardarProc = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procedimientos', { idPaciente: Number(id), ...proc });
      setProc(null);
      setEstado({ tipo: 'ok', texto: 'Procedimiento registrado.' });
      cargar();
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };
  const pdf = async () => {
    try {
      const blob = await (await apiFetch(`/pdf/historia/${id}`, { raw: true })).blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };

  return (
    <>
      <Encabezado indice={`${p.numeroHistoriaClinica} · CI ${p.cedulaIdentidad}`} titulo={`${p.nombresCompletos} ${p.apellidosCompletos}`}
        subtitulo={`${calcularEdad(p.fechaNacimiento)} años · ${p.sexo}${p.seguroSalud ? ` · ${p.seguroSalud}` : ''} · historia abierta el ${fecha(hce.historia_clinica.fechaApertura)}`}>
        {puede(usuario, 'triaje') && <button className="btn btn-acento" onClick={() => navigate(`/triaje/${id}`)}>Triaje</button>}
        {puede(usuario, 'consulta') && <button className="btn btn-primario" onClick={() => navigate(`/consultas/nueva/${id}`)}>Nueva consulta<span className="flecha">→</span></button>}
        <Link to={`/pacientes/${id}/editar`} className="btn">Editar datos</Link>
        {puede(usuario, 'documentos') && <button className="btn" onClick={pdf}>Historia en PDF</button>}
      </Encabezado>

      <Mensaje estado={estado} />
      <div className="mb-6"><Alergias lista={alergias} /></div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6 escalonado">
          <Seccion indice="01" titulo="Consultas">
            {consultas.length === 0 ? <Vacio>Sin consultas registradas.</Vacio> : consultas.map((c) => (
              <Link key={c.idConsulta} to={`/consultas/${c.idConsulta}`} className="fila hover:bg-[#fafbfa] -mx-2 px-2 rounded-lg">
                <span className="num text-xs tenue w-36 shrink-0">{fechaHora(c.fechaHoraAtencion)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.motivoConsulta}</p>
                  <p className="tenue text-xs">{c.medico ? c.medico.nombresCompletos : 'Sin médico asignado'}</p>
                </div>
                <Estado valor={c.estadoConsulta} />
              </Link>
            ))}
          </Seccion>

          <Seccion indice="02" titulo="Procedimientos de enfermería"
            accion={puede(usuario, 'registrarProcedimiento') && !proc && <button className="btn btn-sm" onClick={() => setProc({ tipo: 'Inyectable', descripcion: '' })}>Registrar</button>}>
            {proc && (
              <form onSubmit={guardarProc} className="tarjeta-plana grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-3 items-end mb-4">
                <Campo etiqueta="Tipo"><select className="input" value={proc.tipo} onChange={(e) => setProc({ ...proc, tipo: e.target.value })}>{Object.entries(TIPOS_PROC).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Campo>
                <Campo etiqueta="Detalle (medicamento, dosis, vía, sitio, indicación médica)"><input className="input" required maxLength={500} value={proc.descripcion} onChange={(e) => setProc({ ...proc, descripcion: e.target.value })} /></Campo>
                <div className="flex gap-1"><button className="btn btn-sm btn-acento">Guardar</button><button type="button" className="btn btn-sm btn-texto" onClick={() => setProc(null)}>×</button></div>
              </form>
            )}
            {procedimientos.length === 0 ? <Vacio>Sin procedimientos.</Vacio> : procedimientos.map((x) => (
              <div key={x.idProcedimiento} className="fila">
                <span className="num text-xs tenue w-36 shrink-0">{fechaHora(x.fecha)}</span>
                <span className="pill">{TIPOS_PROC[x.tipo] || x.tipo}</span>
                <span className="flex-1 min-w-0">{x.descripcion}</span>
                <span className="tenue text-xs font-mono">{x.realizadoPor}</span>
              </div>
            ))}
          </Seccion>
        </div>

        <div className="flex flex-col gap-6 escalonado">
          <Seccion indice="03" titulo="Últimos signos vitales">
            {!ultimos ? <Vacio>Sin registros.</Vacio> : (
              <>
                <dl className="grid grid-cols-3 gap-y-4 gap-x-2">
                  {[['PA', ultimos.presionArterial, ''], ['FC', ultimos.pulso, 'lpm'], ['FR', ultimos.frecuenciaRespiratoria, 'rpm'],
                    ['T', ultimos.temperatura, '°C'], ['SpO₂', ultimos.saturacionOxigeno, '%'], ['IMC', calcularImc(ultimos.pesoKg, ultimos.tallaCm), '']]
                    .map(([k, v, u]) => (
                      <div key={k}><dt className="etiqueta">{k}</dt><dd className="num text-lg font-medium mt-1">{v ?? '—'}<span className="tenue text-xs"> {v != null ? u : ''}</span></dd></div>
                    ))}
                </dl>
                <p className="tenue text-xs mt-4">{fechaHora(ultimos.fecha)} · {ultimos.enfermero?.nombresCompletos}</p>
              </>
            )}
          </Seccion>

          <Seccion indice="04" titulo="Antecedentes"
            accion={puede(usuario, 'antecedentes') && !ant && <button className="btn btn-sm" onClick={() => setAnt({ tipoAntecedente: 'Personal', enfermedadAsociada: '', parentescoFamiliar: '', descripcionAdicional: '' })}>Añadir</button>}>
            {ant && (
              <form onSubmit={guardarAnt} className="tarjeta-plana flex flex-col gap-3 mb-4">
                <Campo etiqueta="Tipo"><select className="input" value={ant.tipoAntecedente} onChange={(e) => setAnt({ ...ant, tipoAntecedente: e.target.value })}>{TIPOS_ANT.map((t) => <option key={t}>{t}</option>)}</select></Campo>
                <Campo etiqueta={ant.tipoAntecedente === 'Alergia' ? 'Alérgeno y reacción' : 'Enfermedad o cirugía'}><input className="input" required maxLength={150} value={ant.enfermedadAsociada} onChange={(e) => setAnt({ ...ant, enfermedadAsociada: e.target.value })} /></Campo>
                {ant.tipoAntecedente === 'Familiar' && <Campo etiqueta="Parentesco"><input className="input" maxLength={50} value={ant.parentescoFamiliar} onChange={(e) => setAnt({ ...ant, parentescoFamiliar: e.target.value })} /></Campo>}
                <Campo etiqueta="Detalle"><input className="input" maxLength={500} value={ant.descripcionAdicional} onChange={(e) => setAnt({ ...ant, descripcionAdicional: e.target.value })} /></Campo>
                <div className="flex gap-2"><button className="btn btn-sm btn-acento">Guardar</button><button type="button" className="btn btn-sm btn-texto" onClick={() => setAnt(null)}>Cancelar</button></div>
              </form>
            )}
            {antecedentes.length === 0 ? <Vacio>Sin antecedentes registrados.</Vacio> : TIPOS_ANT.map((t) => {
              const items = antecedentes.filter((a) => a.tipoAntecedente === t);
              return items.length > 0 && (
                <div key={t} className="mb-3">
                  <p className="etiqueta mb-1.5">{t}</p>
                  <ul className="flex flex-col gap-1">
                    {items.map((a) => <li key={a.idAntecedente} className={t === 'Alergia' ? 'text-[var(--critico)] font-medium' : ''}>{a.enfermedadAsociada}{a.parentescoFamiliar ? ` (${a.parentescoFamiliar})` : ''}{a.descripcionAdicional ? <span className="tenue"> · {a.descripcionAdicional}</span> : ''}</li>)}
                  </ul>
                </div>
              );
            })}
          </Seccion>

          <Seccion indice="05" titulo="Citas próximas" accion={puede(usuario, 'agenda') && <Link to="/agenda" className="btn btn-sm">Agendar</Link>}>
            {proximas.length === 0 ? <Vacio>Sin citas pendientes.</Vacio> : proximas.map((c) => (
              <div key={c.idCita} className="fila"><span className="num text-sm flex-1">{fechaHora(c.fechaHora)}</span><Estado valor={c.estado} /></div>
            ))}
          </Seccion>

          <Seccion indice="06" titulo="Contacto">
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13.5px]">
              <dt className="tenue">Teléfono</dt><dd className="num">{p.telefono || '—'}</dd>
              <dt className="tenue">Correo</dt><dd className="truncate">{p.correoElectronico || '—'}</dd>
              <dt className="tenue">Dirección</dt><dd>{p.direccion || '—'}</dd>
              <dt className="tenue">Estado civil</dt><dd>{p.estadoCivil || '—'}</dd>
              <dt className="tenue">Ocupación</dt><dd>{p.ocupacion || '—'}</dd>
            </dl>
          </Seccion>
        </div>
      </div>
    </>
  );
}
