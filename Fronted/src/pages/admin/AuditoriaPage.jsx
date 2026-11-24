import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Encabezado, Mensaje, Vacio } from '../../components/ui';
import { fechaHora } from '../../utils/formato';

const ACCIONES = {
  LOGIN: 'Inicio de sesión', LOGIN_FALLIDO: 'Inicio de sesión fallido', LOGIN_BLOQUEADO: 'Inicio de sesión bloqueado',
  LOGOUT: 'Cierre de sesión', CAMBIO_PASSWORD: 'Cambio de contraseña', PASSWORD_RESTABLECIDA: 'Contraseña restablecida',
  USUARIO_CREADO: 'Usuario creado', USUARIO_ACTUALIZADO: 'Usuario actualizado', CONFIGURACION_ACTUALIZADA: 'Configuración actualizada',
  PACIENTE_CREADO: 'Paciente creado', PACIENTE_ACTUALIZADO: 'Paciente actualizado', ANTECEDENTE_CREADO: 'Antecedente registrado',
  HCE_CONSULTADA: 'Historia clínica abierta', CONSULTA_VISTA: 'Consulta abierta', TRIAJE_REGISTRADO: 'Triaje registrado',
  CONSULTA_CREADA: 'Consulta creada', CONSULTA_ACTUALIZADA: 'Borrador actualizado', CONSULTA_FIRMADA: 'Consulta firmada',
  ADENDA_CREADA: 'Adenda', CERTIFICADO_EMITIDO: 'Certificado emitido', CERTIFICADO_IMPRESO: 'Certificado impreso',
  RECETA_IMPRESA: 'Receta impresa', PDF_DESCARGADO: 'Historia en PDF', ORDEN_RESULTADO: 'Resultado de orden', ORDEN_REVISADA: 'Orden revisada',
  PROCEDIMIENTO_REGISTRADO: 'Procedimiento de enfermería', CITA_CREADA: 'Cita creada', CITA_REPROGRAMADA: 'Cita reprogramada',
  CITA_CONFIRMADA: 'Cita confirmada', CITA_ENESPERA: 'Llegada del paciente', CITA_CANCELADA: 'Cita cancelada', CITA_NOASISTIO: 'Inasistencia',
};
const RIESGO = new Set(['LOGIN_FALLIDO', 'LOGIN_BLOQUEADO', 'PASSWORD_RESTABLECIDA', 'USUARIO_ACTUALIZADO']);

export function AuditoriaPage() {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState(null);
  useEffect(() => { api.get('/admin/auditoria').then(setRegistros).catch((e) => setEstado({ tipo: 'error', texto: e.message })); }, []);

  const q = filtro.trim().toLowerCase();
  const visibles = q ? registros.filter((r) => [r.usuario, r.accion, ACCIONES[r.accion], r.detalle, r.ip].some((v) => v?.toLowerCase().includes(q))) : registros;

  return (
    <>
      <Encabezado indice="Administración" titulo="Auditoría" subtitulo="Últimas 200 acciones: quién, qué, cuándo y desde dónde. Solo identificadores; ningún dato clínico." />
      <Mensaje estado={estado} />
      <input className="input max-w-md mb-5 aparece" aria-label="Filtrar auditoría" placeholder="Filtrar por usuario, acción o IP…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      <div className="tarjeta p-0 overflow-x-auto aparece">
        <table className="tabla">
          <thead><tr><th className="etiqueta">Fecha</th><th className="etiqueta">Usuario</th><th className="etiqueta">Acción</th><th className="etiqueta">Detalle</th><th className="etiqueta">IP</th></tr></thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id}>
                <td className="num tenue whitespace-nowrap">{fechaHora(r.fecha)}</td>
                <td className="font-mono text-[13px]">{r.usuario || '—'}</td>
                <td>{RIESGO.has(r.accion) ? <span className="pill pill-alerta">{ACCIONES[r.accion] || r.accion}</span> : (ACCIONES[r.accion] || r.accion)}</td>
                <td className="font-mono text-xs tenue">{r.detalle || ''}</td>
                <td className="font-mono text-xs tenue">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && <Vacio>Sin registros.</Vacio>}
      </div>
    </>
  );
}
