import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiFetch } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { puede } from '../../auth/permisos';
import { AvisosSignos, Campo, Encabezado, Estado, Mensaje, Seccion, Vacio } from '../../components/ui';
import { fecha, fechaHora } from '../../utils/formato';
import { alertasSignos, calcularEdad, calcularImc } from '../../utils/clinica';

const Texto = ({ titulo, valor }) => valor ? (
  <div className="mb-4"><p className="etiqueta mb-1">{titulo}</p><p className="whitespace-pre-line leading-relaxed">{valor}</p></div>
) : null;

export function ConsultaDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esMedico = puede(usuario, 'consulta');
  const [d, setD] = useState(null);
  const [estado, setEstado] = useState(null);
  const [adenda, setAdenda] = useState(null);
  const [cert, setCert] = useState(null);
  const [resultado, setResultado] = useState({});

  const cargar = useCallback(() => api.get(`/consultas/${id}`).then(setD).catch((e) => setEstado({ tipo: 'error', texto: e.message })), [id]);
  useEffect(() => { cargar(); }, [cargar]);

  const hacer = async (fn, ok) => {
    try { await fn(); setEstado({ tipo: 'ok', texto: ok }); cargar(); } catch (e) { setEstado({ tipo: 'error', texto: e.message }); }
  };
  const abrirPdf = async (ruta) => {
    try {
      const blob = await (await apiFetch(ruta, { raw: true })).blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (e) { setEstado({ tipo: 'error', texto: e.message }); }
  };

  if (!d) return <Mensaje estado={estado || { tipo: 'info', texto: 'Cargando…' }} />;
  const { consulta: c, paciente: p, signosVitales: s } = d;
  const firmada = c.estadoConsulta === 'Firmada';

  return (
    <>
      <Encabezado indice={`${p.numeroHistoriaClinica} · ${calcularEdad(p.fechaNacimiento)} años · ${fechaHora(c.fechaHoraAtencion)}`}
        titulo={c.motivoConsulta}
        subtitulo={`${p.nombresCompletos} ${p.apellidosCompletos}${c.medico ? ` · ${c.medico.nombresCompletos}` : ''}${firmada ? ` · firmada el ${fechaHora(c.firmadaEn)}` : ''}`}>
        <Estado valor={c.estadoConsulta} />
        <Link to={`/pacientes/${p.idPaciente}`} className="btn">Historia del paciente</Link>
        {esMedico && !firmada && <Link to={`/consultas/${id}/editar`} className="btn btn-primario">Continuar nota<span className="flecha">→</span></Link>}
        {esMedico && firmada && d.tratamientos.length > 0 && <button className="btn btn-primario" onClick={() => abrirPdf(`/pdf/receta/${id}`)}>Imprimir receta<span className="flecha">→</span></button>}
      </Encabezado>
      <Mensaje estado={estado} />
      {c.alergiasReportadas && <p className="aviso aviso-critico mb-6">Alergias referidas en triaje: {c.alergiasReportadas}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-6 escalonado">
          <Seccion indice="01" titulo="Nota médica">
            <Texto titulo="Enfermedad actual" valor={c.enfermedadActual} />
            <Texto titulo="Revisión por sistemas" valor={c.revisionSistemas} />
            {d.examenFisico.length > 0 && (
              <div className="mb-4"><p className="etiqueta mb-1">Examen físico</p>
                {d.examenFisico.map((x) => <p key={x.idExamen}><span className="font-medium">{x.regionAnatomica}:</span> {x.hallazgos}</p>)}
              </div>
            )}
            <Texto titulo="Evaluación" valor={c.evolucion} />
            <Texto titulo="Indicaciones al paciente" valor={c.recomendaciones} />
            {c.proximoControl && <p><span className="etiqueta">Próximo control</span> <span className="ml-2">{fecha(`${c.proximoControl}T12:00`)}</span></p>}
            {!c.enfermedadActual && !d.examenFisico.length && !c.evolucion && <Vacio>{firmada ? 'Sin detalle registrado.' : 'El médico aún no completa la nota.'}</Vacio>}
          </Seccion>

          <Seccion indice="02" titulo="Diagnósticos">
            {d.diagnosticos.length === 0 ? <Vacio>Sin diagnósticos.</Vacio> : d.diagnosticos.map((x) => (
              <div key={x.idDiagnostic} className="fila">
                <span className="num font-semibold w-14">{x.catalogoCie10.codigoCie}</span>
                <span className="flex-1 capitalize">{x.catalogoCie10.nombreEnfermedad.toLowerCase()}</span>
                <span className="pill">{x.tipoDiagnostico}</span><span className="pill">{x.condicionDiagnostico}</span>
              </div>
            ))}
          </Seccion>

          <Seccion indice="03" titulo="Receta">
            {d.tratamientos.length === 0 ? <Vacio>Sin medicamentos.</Vacio> : d.tratamientos.map((t, i) => (
              <div key={t.idTratamiento} className="fila items-start">
                <span className="indice w-6 pt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold">{t.nombreMedicamento} <span className="font-normal tenue">{t.formaFarmaceutica} {t.concentracion}</span></p>
                  <p className="text-[13.5px]">{t.indicacionesDosis}</p>
                </div>
                {t.cantidad && <span className="num tenue text-sm">#{t.cantidad}</span>}
              </div>
            ))}
          </Seccion>

          <Seccion indice="04" titulo="Órdenes">
            {d.ordenes.length === 0 ? <Vacio>Sin órdenes.</Vacio> : d.ordenes.map((o) => (
              <div key={o.idOrden} className="fila flex-wrap items-start">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{o.descripcion} <span className="tenue font-normal">· {o.tipo}</span>{o.prioridad === 'Urgente' && <span className="pill pill-critico ml-2">Urgente</span>}</p>
                  {o.indicacion && <p className="tenue text-xs">{o.indicacion}</p>}
                  {o.resultado && <p className="mt-2 text-[13.5px] whitespace-pre-line"><span className="etiqueta mr-2">Resultado {fechaHora(o.resultadoEn)}</span>{o.resultado}</p>}
                </div>
                <Estado valor={o.estado} />
                {esMedico && firmada && o.estado === 'Resultado' && <button className="btn btn-sm btn-acento" onClick={() => hacer(() => api.post(`/ordenes/${o.idOrden}/revisar`), 'Resultado marcado como revisado.')}>Marcar revisado</button>}
                {esMedico && firmada && o.estado === 'Solicitada' && (
                  <div className="w-full flex gap-2 pt-2">
                    <input className="input" placeholder="Registrar resultado" value={resultado[o.idOrden] || ''} onChange={(e) => setResultado({ ...resultado, [o.idOrden]: e.target.value })} aria-label="Resultado" />
                    <button className="btn btn-sm" disabled={!resultado[o.idOrden]?.trim()} onClick={() => hacer(() => api.put(`/ordenes/${o.idOrden}/resultado`, { resultado: resultado[o.idOrden] }), 'Resultado registrado.')}>Guardar</button>
                  </div>
                )}
              </div>
            ))}
          </Seccion>

          <Seccion indice="05" titulo="Adendas"
            accion={esMedico && firmada && !adenda && <button className="btn btn-sm" onClick={() => setAdenda({ texto: '', motivo: '' })}>Añadir adenda</button>}>
            {adenda && (
              <form className="tarjeta-plana flex flex-col gap-3 mb-4" onSubmit={(e) => { e.preventDefault(); hacer(() => api.post(`/consultas/${id}/adendas`, adenda), 'Adenda registrada.').then(() => setAdenda(null)); }}>
                <Campo etiqueta="Motivo"><input className="input" required maxLength={255} value={adenda.motivo} onChange={(e) => setAdenda({ ...adenda, motivo: e.target.value })} placeholder="Omisión, corrección de dato, resultado recibido…" /></Campo>
                <Campo etiqueta="Texto"><textarea className="input" rows={3} required value={adenda.texto} onChange={(e) => setAdenda({ ...adenda, texto: e.target.value })} /></Campo>
                <div className="flex gap-2"><button className="btn btn-sm btn-acento">Guardar adenda</button><button type="button" className="btn btn-sm btn-texto" onClick={() => setAdenda(null)}>Cancelar</button></div>
              </form>
            )}
            {d.adendas.length === 0 ? <Vacio>{firmada ? 'Sin adendas. La nota original no se modifica.' : 'Disponibles después de firmar.'}</Vacio> : d.adendas.map((a) => (
              <div key={a.idAdenda} className="fila items-start">
                <span className="num text-xs tenue w-36 shrink-0 pt-0.5">{fechaHora(a.fecha)}</span>
                <div className="flex-1"><p className="etiqueta mb-1">{a.motivo} · {a.autor}</p><p className="whitespace-pre-line">{a.texto}</p></div>
              </div>
            ))}
          </Seccion>
        </div>

        <aside className="flex flex-col gap-6 escalonado">
          <Seccion titulo="Triaje">
            {!s ? <Vacio>Sin signos vitales.</Vacio> : (
              <>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2">
                  {[['PA', s.presionArterial], ['FC', s.pulso], ['FR', s.frecuenciaRespiratoria], ['T °C', s.temperatura], ['SpO₂', s.saturacionOxigeno], ['Peso', s.pesoKg], ['Talla', s.tallaCm], ['IMC', calcularImc(s.pesoKg, s.tallaCm)], ['Grupo', s.grupoSanguineo]]
                    .map(([k, v]) => <div key={k}><dt className="etiqueta">{k}</dt><dd className="num text-[17px] font-medium mt-0.5">{v ?? '—'}</dd></div>)}
                </dl>
                <div className="mt-3"><AvisosSignos avisos={alertasSignos(s)} /></div>
                <p className="tenue text-xs mt-3">Registró: {s.enfermero?.nombresCompletos}</p>
              </>
            )}
            {c.notaEnfermeria && <p className="text-[13px] mt-3 pt-3 border-t border-[var(--regla)]"><span className="etiqueta block mb-1">Nota de enfermería</span>{c.notaEnfermeria}</p>}
          </Seccion>

          <Seccion titulo="Certificados"
            accion={esMedico && firmada && !cert && <button className="btn btn-sm" onClick={() => setCert({ tipo: 'Asistencia', diasReposo: 1, observaciones: '' })}>Emitir</button>}>
            {cert && (
              <form className="tarjeta-plana flex flex-col gap-3 mb-4" onSubmit={(e) => {
                e.preventDefault();
                hacer(() => api.post(`/consultas/${id}/certificados`, { ...cert, diasReposo: cert.tipo === 'Reposo' ? Number(cert.diasReposo) : null }), 'Certificado emitido.').then(() => setCert(null));
              }}>
                <Campo etiqueta="Tipo"><select className="input" value={cert.tipo} onChange={(e) => setCert({ ...cert, tipo: e.target.value })}><option>Asistencia</option><option>Reposo</option><option>Salud</option></select></Campo>
                {cert.tipo === 'Reposo' && <Campo etiqueta="Días de reposo"><input type="number" className="input" min={1} max={90} value={cert.diasReposo} onChange={(e) => setCert({ ...cert, diasReposo: e.target.value })} /></Campo>}
                <Campo etiqueta="Observaciones"><input className="input" maxLength={2000} value={cert.observaciones} onChange={(e) => setCert({ ...cert, observaciones: e.target.value })} /></Campo>
                <div className="flex gap-2"><button className="btn btn-sm btn-acento">Emitir</button><button type="button" className="btn btn-sm btn-texto" onClick={() => setCert(null)}>Cancelar</button></div>
              </form>
            )}
            {d.certificados.length === 0 ? <Vacio>{firmada ? 'Sin certificados.' : 'Disponibles después de firmar.'}</Vacio> : d.certificados.map((x) => (
              <div key={x.idCertificado} className="fila">
                <div className="flex-1"><p className="font-medium">{x.tipo}{x.diasReposo ? ` · ${x.diasReposo} día(s)` : ''}</p><p className="tenue text-xs">{fechaHora(x.emitidoEn)}</p></div>
                {esMedico && <button className="btn btn-sm" onClick={() => abrirPdf(`/pdf/certificado/${x.idCertificado}`)}>PDF</button>}
              </div>
            ))}
          </Seccion>
        </aside>
      </div>
    </>
  );
}
