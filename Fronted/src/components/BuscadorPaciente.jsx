import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { calcularEdad } from '../utils/clinica';

/** Selector de paciente por nombre, cédula o N.º de HC. Muestra dos identificadores para confirmar. */
export function BuscadorPaciente({ valor, onElegir }) {
  const [pacientes, setPacientes] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/pacientes').then(setPacientes).catch(() => {}); }, []);

  if (valor) {
    return (
      <div className="tarjeta-plana flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{valor.nombresCompletos} {valor.apellidosCompletos}</p>
          <p className="tenue text-xs num">CI {valor.cedulaIdentidad} · {calcularEdad(valor.fechaNacimiento)} años · {valor.numeroHistoriaClinica}</p>
        </div>
        <button type="button" className="btn btn-sm btn-texto" onClick={() => onElegir(null)}>Cambiar</button>
      </div>
    );
  }

  const t = q.trim().toLowerCase();
  const resultados = t.length < 2 ? [] : pacientes.filter((p) =>
    `${p.nombresCompletos} ${p.apellidosCompletos}`.toLowerCase().includes(t) || p.cedulaIdentidad.includes(t)
    || p.numeroHistoriaClinica.toLowerCase().includes(t)).slice(0, 6);

  return (
    <div className="campo">
      <span>Paciente</span>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, cédula o N.º de HC" aria-label="Buscar paciente" />
      {t.length >= 2 && (
        <ul className="tarjeta-plana p-1 flex flex-col">
          {resultados.map((p) => (
            <li key={p.idPaciente}>
              <button type="button" onClick={() => { onElegir(p); setQ(''); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--hundido)] bg-transparent border-0 cursor-pointer">
                <span className="font-medium">{p.nombresCompletos} {p.apellidosCompletos}</span>
                <span className="tenue text-xs num block">CI {p.cedulaIdentidad} · {calcularEdad(p.fechaNacimiento)} años</span>
              </button>
            </li>
          ))}
          {resultados.length === 0 && <li className="tenue text-xs px-3 py-2">Sin coincidencias. <Link to="/pacientes/nuevo" className="underline">Registrar paciente nuevo</Link></li>}
        </ul>
      )}
    </div>
  );
}
