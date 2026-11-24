import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { Dato, Encabezado, Estado, Seccion, Vacio } from '../components/ui';
import { hora, fechaHora } from '../utils/formato';
import { calcularEdad } from '../utils/clinica';

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};
const hoyLargo = () => new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });

export function Hoy() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/estadisticas').then(setStats).catch(() => {}); }, []);
  // Primer nombre real: se omiten tratamientos como "Dra." o "Lcda.".
  const nombre = usuario?.nombresCompletos?.split(' ').find((p) => p && !p.endsWith('.')) || usuario?.username;

  return (
    <>
      <Encabezado indice={hoyLargo()} titulo={`${saludo()}, ${nombre}`}
        subtitulo={{
          Enfermeria: 'Agenda del día, sala de espera y triaje.',
          Medico: 'Pacientes listos para atender y notas por firmar.',
          Admin: 'Usuarios, configuración y trazabilidad. Sin acceso a información clínica.',
        }[usuario?.rol]} />
      {usuario?.rol === 'Enfermeria' && <HoyEnfermeria stats={stats} />}
      {usuario?.rol === 'Medico' && <HoyMedico stats={stats} />}
      {usuario?.rol === 'Admin' && <HoyAdmin stats={stats} />}
    </>
  );
}

function HoyEnfermeria({ stats }) {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  useEffect(() => { api.get('/citas').then(setCitas).catch(() => {}); }, []);
  const activas = citas.filter((c) => !['Atendida', 'Cancelada', 'NoAsistio'].includes(c.estado));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 escalonado">
        <Dato etiqueta="Citas hoy" valor={stats?.citasHoy} />
        <Dato etiqueta="En sala de espera" valor={stats?.enEspera} nota="Llegaron y esperan triaje" />
        <Dato etiqueta="Triados, esperan médico" valor={stats?.porAtender} />
      </div>
      <Seccion indice="01" titulo="Agenda de hoy" className="aparece"
        accion={<Link to="/agenda" className="btn btn-sm">Abrir agenda</Link>}>
        {activas.length === 0 ? <Vacio>No quedan citas pendientes hoy.</Vacio> : (
          <div>
            {activas.map((c) => (
              <div key={c.idCita} className="fila">
                <span className="num font-semibold w-14">{hora(c.fechaHora)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.paciente.nombresCompletos} {c.paciente.apellidosCompletos}</p>
                  <p className="tenue text-xs">{c.motivo || 'Sin motivo registrado'}</p>
                </div>
                <Estado valor={c.estado} />
                {c.estado === 'EnEspera' && (
                  <button className="btn btn-sm btn-acento" onClick={() => navigate(`/triaje/${c.paciente.idPaciente}?cita=${c.idCita}`)}>Triaje</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}

function HoyMedico({ stats }) {
  const [cola, setCola] = useState([]);
  useEffect(() => { api.get('/consultas/pendientes').then(setCola).catch(() => {}); }, []);
  const triados = cola.filter((c) => c.estadoConsulta === 'Triaje');
  const borradores = cola.filter((c) => c.estadoConsulta === 'Borrador');

  const Fila = ({ c, accion }) => {
    const p = c.historiaClinica.paciente;
    return (
      <div className="fila">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{p.nombresCompletos} {p.apellidosCompletos}</p>
          <p className="tenue text-xs">{calcularEdad(p.fechaNacimiento)} años · {c.motivoConsulta} · {fechaHora(c.fechaHoraAtencion)}</p>
        </div>
        {c.alergiasReportadas && <span className="pill pill-critico hidden sm:inline-flex">Alergia</span>}
        <Estado valor={c.estadoConsulta} />
        <Link to={`/consultas/${c.idConsulta}/editar`} className="btn btn-sm btn-primario">{accion}<span className="flecha" aria-hidden="true">→</span></Link>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 escalonado">
        <Dato etiqueta="Esperan atención" valor={stats?.porAtender} nota="Ya pasaron por triaje" />
        <Dato etiqueta="Borradores sin firmar" valor={stats?.borradores} />
        <Dato etiqueta="Consultas hoy" valor={stats?.consultasHoy} />
      </div>
      <Seccion indice="01" titulo="En espera" className="aparece">
        {triados.length === 0 ? <Vacio>Nadie en espera. Enfermería los enviará tras el triaje.</Vacio>
          : triados.map((c) => <Fila key={c.idConsulta} c={c} accion="Atender" />)}
      </Seccion>
      <Seccion indice="02" titulo="Por firmar" className="aparece">
        {borradores.length === 0 ? <Vacio>Todas sus notas están firmadas.</Vacio>
          : borradores.map((c) => <Fila key={c.idConsulta} c={c} accion="Continuar" />)}
      </Seccion>
    </div>
  );
}

const RIESGO = new Set(['LOGIN_FALLIDO', 'LOGIN_BLOQUEADO', 'PASSWORD_RESTABLECIDA', 'USUARIO_ACTUALIZADO']);

function HoyAdmin({ stats }) {
  const [eventos, setEventos] = useState([]);
  useEffect(() => { api.get('/admin/auditoria').then((r) => setEventos(r.filter((e) => RIESGO.has(e.accion)).slice(0, 8))).catch(() => {}); }, []);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 escalonado">
        <Dato etiqueta="Usuarios activos" valor={stats?.usuariosActivos} />
        <Dato etiqueta="Pacientes registrados" valor={stats?.pacientes} nota="Solo el conteo" />
        <Dato etiqueta="Consultas 7 días" valor={stats?.consultasSemana} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <Seccion indice="01" titulo="Eventos de seguridad recientes" className="aparece"
          accion={<Link to="/admin/auditoria" className="btn btn-sm">Ver auditoría</Link>}>
          {eventos.length === 0 ? <Vacio>Sin intentos fallidos ni cambios sensibles recientes.</Vacio> : eventos.map((e) => (
            <div key={e.id} className="fila">
              <span className="num text-xs tenue w-32 shrink-0">{fechaHora(e.fecha)}</span>
              <span className="font-mono text-[13px]">{e.usuario || '—'}</span>
              <span className="pill pill-alerta ml-auto">{e.accion.replaceAll('_', ' ').toLowerCase()}</span>
            </div>
          ))}
        </Seccion>
        <Seccion indice="02" titulo="Accesos directos" className="aparece">
          <div className="flex flex-col gap-2">
            <Link to="/admin/usuarios" className="btn justify-between">Crear o dar de baja usuarios <span aria-hidden="true">→</span></Link>
            <Link to="/admin/configuracion" className="btn justify-between">Horario y documentos <span aria-hidden="true">→</span></Link>
            <Link to="/cuenta/password" className="btn justify-between">Cambiar mi contraseña <span aria-hidden="true">→</span></Link>
          </div>
          <p className="tenue text-xs mt-4">Respaldos: <code>docker compose run --rm backup</code> (docs/OPERACION.md).</p>
        </Seccion>
      </div>
    </div>
  );
}
