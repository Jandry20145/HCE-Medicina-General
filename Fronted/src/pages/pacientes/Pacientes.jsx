import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Encabezado, Mensaje, Vacio } from '../../components/ui';
import { calcularEdad } from '../../utils/clinica';

export function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  useEffect(() => { api.get('/pacientes').then(setPacientes).catch((e) => setError({ tipo: 'error', texto: e.message })); }, []);

  const t = q.trim().toLowerCase();
  const lista = (pacientes || []).filter((p) => !t
    || `${p.nombresCompletos} ${p.apellidosCompletos}`.toLowerCase().includes(t)
    || p.cedulaIdentidad.includes(t) || p.numeroHistoriaClinica.toLowerCase().includes(t));

  return (
    <>
      <Encabezado indice="Expedientes" titulo="Pacientes" subtitulo="Busque por nombre, cédula o número de historia clínica.">
        <Link to="/pacientes/nuevo" className="btn btn-primario">Nuevo paciente<span className="flecha">→</span></Link>
      </Encabezado>
      <Mensaje estado={error} />
      <input className="input max-w-md mb-5 aparece" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar paciente" />
      <div className="tarjeta p-0 overflow-x-auto aparece">
        <table className="tabla">
          <thead>
            <tr>
              <th className="etiqueta">HC</th><th className="etiqueta">Paciente</th><th className="etiqueta">Cédula</th>
              <th className="etiqueta">Edad</th><th className="etiqueta">Sexo</th><th className="etiqueta">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.idPaciente} className="cursor-pointer" onClick={() => navigate(`/pacientes/${p.idPaciente}`)}>
                <td className="num tenue">{p.numeroHistoriaClinica}</td>
                <td><Link to={`/pacientes/${p.idPaciente}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{p.apellidosCompletos}, {p.nombresCompletos}</Link></td>
                <td className="num">{p.cedulaIdentidad}</td>
                <td className="num">{calcularEdad(p.fechaNacimiento) ?? '—'}</td>
                <td>{p.sexo}</td>
                <td className="num tenue">{p.telefono || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pacientes && lista.length === 0 && <Vacio>{t ? 'Sin coincidencias.' : 'Aún no hay pacientes registrados.'}</Vacio>}
        {!pacientes && !error && <Vacio>Cargando…</Vacio>}
      </div>
    </>
  );
}
