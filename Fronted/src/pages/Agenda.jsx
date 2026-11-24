import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Campo, Encabezado, Estado, Mensaje, Seccion, Vacio } from '../components/ui';
import { hora } from '../utils/formato';
import { BuscadorPaciente } from '../components/BuscadorPaciente';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mover = (dia, n) => { const d = new Date(`${dia}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const largo = (dia) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });

export function Agenda() {
  const navigate = useNavigate();
  const [dia, setDia] = useState(iso(new Date()));
  const [citas, setCitas] = useState([]);
  const [config, setConfig] = useState(null);
  const [estado, setEstado] = useState(null);
  const [nueva, setNueva] = useState({ paciente: null, hora: '', motivo: '' });
  const [reprogramando, setReprogramando] = useState(null);

  const cargar = useCallback(() => api.get(`/citas?fecha=${dia}`).then(setCitas).catch((e) => setEstado({ tipo: 'error', texto: e.message })), [dia]);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { api.get('/configuracion').then(setConfig).catch(() => {}); }, []);

  const accion = async (fn, ok) => {
    try {
      await fn();
      setEstado(ok ? { tipo: 'ok', texto: ok } : null);
      cargar();
    } catch (e) {
      setEstado({ tipo: 'error', texto: e.message });
    }
  };

  const crear = (e) => {
    e.preventDefault();
    if (!nueva.paciente) return setEstado({ tipo: 'error', texto: 'Seleccione el paciente.' });
    accion(() => api.post('/citas', { idPaciente: nueva.paciente.idPaciente, fechaHora: `${dia}T${nueva.hora}:00`, motivo: nueva.motivo }),
      `Cita agendada para ${nueva.paciente.nombresCompletos} a las ${nueva.hora}.`).then(() => setNueva({ paciente: null, hora: '', motivo: '' }));
  };

  const sinCita = () => {
    if (!nueva.paciente) return setEstado({ tipo: 'error', texto: 'Seleccione el paciente que llegó sin cita.' });
    accion(() => api.post('/citas', { idPaciente: nueva.paciente.idPaciente, motivo: nueva.motivo, espontanea: true }),
      `${nueva.paciente.nombresCompletos} quedó en sala de espera.`).then(() => setNueva({ paciente: null, hora: '', motivo: '' }));
  };

  const esHoy = dia === iso(new Date());

  return (
    <>
      <Encabezado indice="Agenda" titulo={largo(dia)}
        subtitulo={config ? `Atención de ${config.horaApertura.slice(0, 5)} a ${config.horaCierre.slice(0, 5)} · citas de ${config.duracionCitaMin} min` : null}>
        <button className="btn" onClick={() => setDia(mover(dia, -1))} aria-label="Día anterior">←</button>
        <button className="btn" onClick={() => setDia(iso(new Date()))} disabled={esHoy}>Hoy</button>
        <button className="btn" onClick={() => setDia(mover(dia, 1))} aria-label="Día siguiente">→</button>
        <input type="date" className="input w-auto" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} aria-label="Ir a fecha" />
      </Encabezado>

      <Mensaje estado={estado} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <Seccion indice="01" titulo={`${citas.length} cita${citas.length === 1 ? '' : 's'}`} className="aparece">
          {citas.length === 0 ? <Vacio>Sin citas este día.</Vacio> : citas.map((c) => (
            <div key={c.idCita} className="fila flex-wrap">
              <span className="num font-semibold w-14">{hora(c.fechaHora)}</span>
              <div className="min-w-0 flex-1">
                <button className="font-medium text-left hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => navigate(`/pacientes/${c.paciente.idPaciente}`)}>
                  {c.paciente.nombresCompletos} {c.paciente.apellidosCompletos}
                </button>
                <p className="tenue text-xs">{c.motivo || 'Sin motivo'} · {c.duracionMin} min{c.llegadaEn ? ` · llegó ${hora(c.llegadaEn)}` : ''}</p>
              </div>
              <Estado valor={c.estado} />
              <div className="flex gap-1.5">
                {c.estado === 'Programada' && <button className="btn btn-sm" onClick={() => accion(() => api.post(`/citas/${c.idCita}/estado`, { estado: 'Confirmada' }))}>Confirmar</button>}
                {['Programada', 'Confirmada'].includes(c.estado) && (
                  <>
                    <button className="btn btn-sm btn-acento" onClick={() => accion(() => api.post(`/citas/${c.idCita}/estado`, { estado: 'EnEspera' }), 'Llegada registrada.')}>Llegó</button>
                    <button className="btn btn-sm btn-texto" onClick={() => setReprogramando({ cita: c, fecha: dia, hora: hora(c.fechaHora) })}>Reprogramar</button>
                    <button className="btn btn-sm btn-texto" onClick={() => accion(() => api.post(`/citas/${c.idCita}/estado`, { estado: 'NoAsistio' }))}>No asistió</button>
                    <button className="btn btn-sm btn-texto btn-peligro" onClick={() => window.confirm('¿Cancelar esta cita?') && accion(() => api.post(`/citas/${c.idCita}/estado`, { estado: 'Cancelada' }))}>Cancelar</button>
                  </>
                )}
                {c.estado === 'EnEspera' && <button className="btn btn-sm btn-primario" onClick={() => navigate(`/triaje/${c.paciente.idPaciente}?cita=${c.idCita}`)}>Triaje<span className="flecha">→</span></button>}
              </div>
              {reprogramando?.cita.idCita === c.idCita && (
                <div className="w-full flex flex-wrap gap-2 items-end pt-3">
                  <Campo etiqueta="Nueva fecha"><input type="date" className="input" value={reprogramando.fecha} onChange={(e) => setReprogramando({ ...reprogramando, fecha: e.target.value })} /></Campo>
                  <Campo etiqueta="Hora"><input type="time" className="input" value={reprogramando.hora} onChange={(e) => setReprogramando({ ...reprogramando, hora: e.target.value })} /></Campo>
                  <button className="btn btn-sm btn-acento" onClick={() => accion(() => api.put(`/citas/${c.idCita}`, { idPaciente: c.paciente.idPaciente, fechaHora: `${reprogramando.fecha}T${reprogramando.hora}:00` }), 'Cita reprogramada.').then(() => setReprogramando(null))}>Guardar</button>
                  <button className="btn btn-sm btn-texto" onClick={() => setReprogramando(null)}>Cerrar</button>
                </div>
              )}
            </div>
          ))}
        </Seccion>

        <form onSubmit={crear} className="tarjeta flex flex-col gap-4 aparece">
          <div className="flex items-baseline gap-3"><span className="indice">02</span><h2 className="h2">Nueva cita</h2></div>
          <BuscadorPaciente valor={nueva.paciente} onElegir={(p) => setNueva({ ...nueva, paciente: p })} />
          <Campo etiqueta={`Hora (${largo(dia)})`}>
            <input type="time" className="input" required value={nueva.hora} step={300}
              min={config?.horaApertura?.slice(0, 5)} max={config?.horaCierre?.slice(0, 5)}
              onChange={(e) => setNueva({ ...nueva, hora: e.target.value })} />
          </Campo>
          <Campo etiqueta="Motivo breve (opcional)">
            <input className="input" maxLength={255} value={nueva.motivo} onChange={(e) => setNueva({ ...nueva, motivo: e.target.value })} placeholder="Control, chequeo, resultados…" />
          </Campo>
          <button className="btn btn-primario self-start">Agendar<span className="flecha">→</span></button>
          <hr className="regla" />
          <p className="tenue text-xs">¿Llegó sin cita? Selecciónelo arriba y regístrelo directamente en sala de espera.</p>
          <button type="button" className="btn self-start" onClick={sinCita}>Registrar llegada sin cita</button>
        </form>
      </div>
    </>
  );
}
