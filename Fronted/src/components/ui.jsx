import { useEffect, useRef, useState } from 'react';

/** Título de página: sube desde una máscara y lo acompaña el trazo de pulso (firma visual). */
export function Encabezado({ indice, titulo, subtitulo, children }) {
  useEffect(() => { document.title = `${titulo} · HCE`; }, [titulo]);
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
      <div className="min-w-0">
        {indice && <p className="etiqueta mb-3 aparece">{indice}</p>}
        <div className="flex items-center gap-5">
          <h1 className="titulo"><span className="titulo-mascara"><span>{titulo}</span></span></h1>
          <Pulso />
        </div>
        {subtitulo && <p className="subtitulo aparece">{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 aparece">{children}</div>}
    </header>
  );
}

export function Pulso() {
  return (
    <svg className="pulso hidden sm:block" viewBox="0 0 120 28" fill="none" aria-hidden="true">
      <path d="M0 14h42l6-10 8 20 6-14 4 4h54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Número que cuenta hasta su valor (0,9 s). Sin animación si el usuario la redujo. */
export function Dato({ valor, etiqueta, nota }) {
  const [mostrado, setMostrado] = useState(0);
  const anterior = useRef(0);
  useEffect(() => {
    if (valor == null) return undefined;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desde = anterior.current;
    anterior.current = valor;
    if (reducido || valor === desde) {
      const id = requestAnimationFrame(() => setMostrado(valor));
      return () => cancelAnimationFrame(id);
    }
    const inicio = performance.now();
    let id;
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      setMostrado(Math.round(desde + (valor - desde) * e));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor]);
  return (
    <div className="tarjeta">
      <p className="etiqueta">{etiqueta}</p>
      <p className="dato mt-4">{valor == null ? '—' : mostrado}</p>
      {nota && <p className="tenue text-xs mt-2">{nota}</p>}
    </div>
  );
}

export function Campo({ etiqueta, children, ayuda, className = '' }) {
  return (
    <label className={`campo ${className}`}>
      <span>{etiqueta}</span>
      {children}
      {ayuda && <small className="tenue text-xs">{ayuda}</small>}
    </label>
  );
}

export function Seccion({ titulo, indice, accion, children, className = '' }) {
  return (
    <section className={`tarjeta ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3">
          {indice && <span className="indice">{indice}</span>}
          <h2 className="h2">{titulo}</h2>
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Vacio({ children }) {
  return <p className="tenue text-sm py-6 text-center">{children}</p>;
}

export function Mensaje({ estado }) {
  if (!estado?.texto) return null;
  const clase = estado.tipo === 'error' ? 'aviso-critico' : estado.tipo === 'ok' ? 'aviso-ok' : 'aviso-info';
  return <p role={estado.tipo === 'error' ? 'alert' : 'status'} className={`aviso ${clase} mb-4`}>{estado.texto}</p>;
}

const ESTADOS = {
  // Citas
  Programada: ['pill', 'Programada'],
  Confirmada: ['pill pill-acento', 'Confirmada'],
  EnEspera: ['pill pill-alerta', 'En sala de espera'],
  EnAtencion: ['pill pill-acento', 'En atención'],
  Atendida: ['pill pill-ok', 'Atendida'],
  Cancelada: ['pill', 'Cancelada'],
  NoAsistio: ['pill pill-critico', 'No asistió'],
  // Consultas
  Triaje: ['pill pill-alerta', 'Triaje · espera médico'],
  Borrador: ['pill pill-acento', 'Borrador'],
  Firmada: ['pill pill-tinta', 'Firmada'],
  // Órdenes
  Solicitada: ['pill', 'Solicitada'],
  Resultado: ['pill pill-alerta', 'Resultado sin revisar'],
  Revisada: ['pill pill-ok', 'Revisada'],
};

export function Estado({ valor }) {
  const [clase, texto] = ESTADOS[valor] || ['pill', valor];
  return <span className={clase}>{texto}</span>;
}

/** Avisos de signos vitales (utils/clinica.alertasSignos). */
export function AvisosSignos({ avisos }) {
  if (!avisos?.length) return null;
  return (
    <ul className="flex flex-col gap-1.5" aria-live="polite">
      {avisos.map((a) => (
        <li key={a.texto} className={`pill ${a.nivel === 'critico' ? 'pill-critico' : 'pill-alerta'}`}>
          {a.nivel === 'critico' ? 'Crítico · ' : 'Atención · '}{a.texto}
        </li>
      ))}
    </ul>
  );
}

export function Alergias({ lista }) {
  if (!lista?.length) return null;
  return (
    <div role="alert" className="aviso aviso-critico">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
        <path d="M12 3 2 21h20L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 10v5M12 18v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div>
        <p className="font-semibold">Alergias registradas</p>
        <p>{lista.join(' · ')}</p>
      </div>
    </div>
  );
}
