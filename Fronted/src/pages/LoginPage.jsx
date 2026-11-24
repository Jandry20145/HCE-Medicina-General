import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './LoginPage.css';

// Trazo de monitor: 6 latidos por barrido. Barrido de 4,8 s → 75 latidos por minuto.
const ANCHO = 1200;
const BASE = 70;
const LATIDOS = 6;
const BARRIDO_MS = 4800;
const LPM = Math.round((LATIDOS * 60000) / BARRIDO_MS);

/** Un latido (P, QRS, T) de 200 unidades de ancho a partir de x. */
function latido(x) {
  return [
    `L${x + 40} ${BASE}`,
    `C${x + 48} ${BASE - 9} ${x + 58} ${BASE - 9} ${x + 66} ${BASE}`, // onda P
    `L${x + 80} ${BASE}`,
    `L${x + 86} ${BASE + 10}`, // Q
    `L${x + 96} ${BASE - 52}`, // R
    `L${x + 106} ${BASE + 20}`, // S
    `L${x + 114} ${BASE}`,
    `L${x + 128} ${BASE}`,
    `C${x + 140} ${BASE - 16} ${x + 158} ${BASE - 16} ${x + 170} ${BASE}`, // onda T
    `L${x + 200} ${BASE}`,
  ].join(' ');
}
const TRAZO = `M0 ${BASE} ` + Array.from({ length: LATIDOS }, (_, i) => latido(i * 200)).join(' ');

/** Barrido de monitor: el trazo nuevo aparece detrás de un punto y borra el anterior justo delante. */
function useMonitor(svgRef, puntoRef) {
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const punto = puntoRef.current;
    if (!svg || !punto) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      svg.style.setProperty('--x', '100%');
      return undefined;
    }
    // Altura del trazo para cada x, para que el punto lo siga.
    const path = svg.querySelector('path');
    const total = path.getTotalLength();
    const alturas = new Float32Array(ANCHO + 1).fill(BASE);
    for (let l = 0; l <= total; l += 1.5) {
      const p = path.getPointAtLength(l);
      alturas[Math.round(p.x)] = p.y;
    }
    let id;
    const inicio = performance.now();
    const paso = (t) => {
      const f = ((t - inicio) % BARRIDO_MS) / BARRIDO_MS;
      const x = f * ANCHO;
      svg.style.setProperty('--x', `${f * 100}%`);
      punto.setAttribute('cx', x);
      punto.setAttribute('cy', alturas[Math.round(x)]);
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [svgRef, puntoRef]);
}

function useReloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export const LoginPage = () => {
  const { usuario, login, aviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const svgRef = useRef(null);
  const puntoRef = useRef(null);
  const ahora = useReloj();
  useMonitor(svgRef, puntoRef);

  useEffect(() => { document.title = 'Acceso · HCE'; }, []);

  if (usuario) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(username.trim(), password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  const mensaje = error || aviso;
  const fecha = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <main className="acceso">
      <section className="acceso-relato">
        <header className="acceso-cabecera">
          <span className="acceso-marca">HCE</span>
          <span className="acceso-etiqueta">Medicina General</span>
        </header>

        <div className="acceso-titular">
          <p className="acceso-etiqueta acceso-entra" style={{ '--d': '0.05s' }}>Historia clínica electrónica</p>
          <h1>
            <span className="acceso-linea"><span style={{ '--d': '0.1s' }}>Cada consulta,</span></span>
            <span className="acceso-linea acceso-tenue"><span style={{ '--d': '0.22s' }}>completa y segura.</span></span>
          </h1>
          <p className="acceso-bajada acceso-entra" style={{ '--d': '0.45s' }}>
            Triaje, nota médica, diagnóstico CIE-10 y receta en un solo registro.
            Firmado, auditado y solo para el personal autorizado.
          </p>
        </div>

        <figure className="acceso-monitor acceso-entra" style={{ '--d': '0.6s' }} aria-hidden="true">
          <svg ref={svgRef} viewBox={`0 0 ${ANCHO} 110`} preserveAspectRatio="none">
            <path d={TRAZO} vectorEffect="non-scaling-stroke" />
            <circle ref={puntoRef} r="4" cx="0" cy={BASE} />
          </svg>
          <figcaption>
            <span className="acceso-latido" />
            <span className="acceso-etiqueta">FC</span>
            <strong>{LPM}</strong>
            <span className="acceso-etiqueta">lpm</span>
          </figcaption>
        </figure>

        <ol className="acceso-claves acceso-entra" style={{ '--d': '0.75s' }}>
          <li><span>01</span>Triaje con alertas en vivo</li>
          <li><span>02</span>Catálogo CIE-10 completo</li>
          <li><span>03</span>Nota firmada, corregida solo con adendas</li>
        </ol>
      </section>

      <section className="acceso-panel">
        <form className="acceso-tarjeta acceso-entra" style={{ '--d': '0.3s' }} onSubmit={enviar} noValidate>
          <div className="acceso-tarjeta-cabeza">
            <span className="acceso-etiqueta">{fecha} · <span className="num">{hora}</span></span>
            <h2>Acceso del personal</h2>
            <p>Ingrese con el usuario que le asignó el administrador.</p>
          </div>

          {mensaje && <p className="acceso-error" role="alert">{mensaje}</p>}

          <label className="acceso-campo">
            <span>Usuario</span>
            <input autoComplete="username" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="acceso-campo">
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button className="acceso-boton" disabled={enviando || !username || !password}>
            {enviando ? 'Verificando…' : 'Entrar'}
            <span className="acceso-flecha" aria-hidden="true">→</span>
          </button>

          <ul className="acceso-notas">
            <li>La sesión dura 8 horas.</li>
            <li>Tras 5 intentos fallidos el acceso se bloquea 15 minutos.</li>
            <li>¿Olvidó su contraseña? El administrador la restablece.</li>
          </ul>
        </form>
      </section>
    </main>
  );
};
