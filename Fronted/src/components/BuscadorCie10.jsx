import { useEffect, useState } from 'react';
import { buscarCie10 } from '../services/api';

/** Busca en el catálogo CIE-10 por código o nombre (desde 2 caracteres, con espera de 250 ms). */
export function BuscadorCie10({ onElegir }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) return undefined;
    let vigente = true;
    const id = setTimeout(() => buscarCie10(t).then((r) => vigente && setResultados(r.slice(0, 8))), 250);
    return () => { vigente = false; clearTimeout(id); };
  }, [q]);

  const visibles = q.trim().length < 2 ? [] : resultados;

  return (
    <div className="relative">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar CIE-10: J02, faringitis…" aria-label="Buscar diagnóstico CIE-10" />
      {visibles.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 tarjeta p-1 max-h-72 overflow-auto">
          {visibles.map((r) => (
            <li key={r.idCie10}>
              <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--hundido)] bg-transparent border-0 cursor-pointer flex gap-3"
                onClick={() => { onElegir(r); setQ(''); }}>
                <span className="num font-semibold w-14 shrink-0">{r.codigoCie}</span>
                <span className="capitalize">{r.nombreEnfermedad.toLowerCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
