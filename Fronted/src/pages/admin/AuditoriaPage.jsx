import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { api } from '../../services/api';

const ACCIONES = {
  LOGIN: 'Inicio de sesión',
  LOGIN_FALLIDO: 'Inicio de sesión fallido',
  LOGIN_BLOQUEADO: 'Inicio de sesión bloqueado',
  LOGOUT: 'Cierre de sesión',
  CAMBIO_PASSWORD: 'Cambio de contraseña',
  PASSWORD_RESTABLECIDA: 'Contraseña restablecida',
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_ACTUALIZADO: 'Usuario actualizado',
  PACIENTE_CREADO: 'Paciente creado',
  PACIENTE_ACTUALIZADO: 'Paciente actualizado',
  ANTECEDENTE_CREADO: 'Antecedente registrado',
  HCE_CONSULTADA: 'Historia clínica abierta',
  CONSULTA_CREADA: 'Consulta registrada',
  CONSULTA_VISTA: 'Consulta abierta',
  PDF_DESCARGADO: 'PDF descargado',
};

const RIESGO = new Set(['LOGIN_FALLIDO', 'LOGIN_BLOQUEADO', 'PASSWORD_RESTABLECIDA']);

export const AuditoriaPage = () => {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get('/admin/auditoria').then(setRegistros).catch((e) => setError(e.message)); }, []);

  const q = filtro.trim().toLowerCase();
  const visibles = q
    ? registros.filter((r) => [r.usuario, r.accion, ACCIONES[r.accion], r.detalle, r.ip].some((v) => v?.toLowerCase().includes(q)))
    : registros;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3"><ScrollText className="text-cyan-400" aria-hidden="true" /> Auditoría</h1>
        <p className="text-slate-400">Últimas 200 acciones: quién, qué, cuándo y desde dónde. No contiene datos clínicos.</p>
      </div>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <input aria-label="Filtrar auditoría" placeholder="Filtrar por usuario, acción o IP…" value={filtro} onChange={(e) => setFiltro(e.target.value)}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none" />
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Detalle</th><th className="px-4 py-3">IP</th></tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id} className="border-b border-slate-700/60 last:border-0">
                <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{new Date(r.fecha).toLocaleString('es-EC')}</td>
                <td className="px-4 py-2 font-mono text-slate-200">{r.usuario || '—'}</td>
                <td className={`px-4 py-2 ${RIESGO.has(r.accion) ? 'text-amber-300' : 'text-slate-300'}`}>{ACCIONES[r.accion] || r.accion}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.detalle || ''}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && <p className="p-6 text-slate-500 text-sm">Sin registros.</p>}
      </div>
    </div>
  );
};
