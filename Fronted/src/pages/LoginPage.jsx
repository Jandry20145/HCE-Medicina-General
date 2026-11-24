import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './LoginPage.css';

// Video de fondo de la cápsula ("Blue Silk", MotionSites backgrounds). Para no depender de
// un servidor externo, descárguelo a /public y cambie esta ruta por '/acceso.mp4'.
const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_034306_165449ef-7d2e-4e81-850f-1939c5cb442d.mp4';

const LINEAS = Array.from({ length: 14 }, (_, i) => {
  const y = 120 + i * 62;
  return { d: `M -80 ${y + 220} C 380 ${y + 120}, 620 ${y - 260}, 1060 ${y - 180} S 1640 ${y - 420}, 1760 ${y - 520}`, w: 1.2 + (i % 4) * 0.9, o: 0.55 + (i % 3) * 0.12 };
});

/** Anima la apertura: línea plana → ranura → círculo → cápsula (2.1 s). */
function useApertura(raizRef) {
  useLayoutEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return undefined;
    const el = (nombre) => ({ current: raiz.querySelector(`[data-anim="${nombre}"]`) });
    const [pill, velo, a, b, fondo, nav, pie, regla] = ['pill', 'velo', 'a', 'b', 'fondo', 'nav', 'pie', 'regla'].map(el);
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movil = window.matchMedia('(max-width: 720px)').matches;
    if (reducido) {
      raiz.classList.add('acceso--final');
      return undefined;
    }
    const fs = parseFloat(getComputedStyle(pill.current).fontSize);
    const t = { duration: 2100, fill: 'both' };
    const ease = 'cubic-bezier(.4,0,.2,1)';
    const anims = [];
    const anim = (el, frames, extra = {}) => el.current && anims.push(el.current.animate(frames, { ...t, ...extra }));

    if (movil) {
      const ancho = pill.current.getBoundingClientRect().width;
      const alto = ancho / 1.85;
      anim(pill, [
        { height: '1.5px', clipPath: 'inset(0 50%)', offset: 0 },
        { height: '1.5px', clipPath: 'inset(0 0%)', offset: 0.14 },
        { height: `${alto * 0.1}px`, offset: 0.3 },
        { height: `${alto * 0.55}px`, offset: 0.58 },
        { height: `${alto}px`, clipPath: 'inset(0 0%)', offset: 1 },
      ], { easing: ease });
    } else {
      anim(pill, [
        { width: `${fs * 0.012}px`, clipPath: 'inset(50% 0)', offset: 0, easing: 'cubic-bezier(.5,0,.3,1)' },
        { width: `${fs * 0.012}px`, clipPath: 'inset(0% 0)', offset: 0.14, easing: 'cubic-bezier(.5,0,.3,1)' },
        { width: `${fs * 0.16}px`, offset: 0.3, easing: 'cubic-bezier(.45,0,.3,1)' },
        { width: `${fs * 1.81}px`, offset: 0.58, easing: 'cubic-bezier(.4,0,.2,1)' },
        { width: `${fs * 3.4}px`, clipPath: 'inset(0% 0)', offset: 1 },
      ]);
    }
    anim(velo, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.14 }, { opacity: 0, offset: 0.3 }, { opacity: 0, offset: 1 }]);
    const eje = movil ? 'Y' : 'X';
    anim(a, [{ transform: `translate${eje}(0.04em)`, offset: 0 }, { transform: `translate${eje}(0.02em)`, offset: 0.58 }, { transform: `translate${eje}(0)`, offset: 1 }], { easing: ease });
    anim(b, [{ transform: `translate${eje}(-0.04em)`, offset: 0 }, { transform: `translate${eje}(-0.02em)`, offset: 0.58 }, { transform: `translate${eje}(0)`, offset: 1 }], { easing: ease });
    anim(fondo, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 0.78 }, { opacity: 1, offset: 1 }]);
    anim(nav, [{ transform: 'translateY(-140%)', offset: 0 }, { transform: 'translateY(-140%)', offset: 0.5, easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'translateY(0)', offset: 0.86 }, { transform: 'translateY(0)', offset: 1 }]);
    anim(pie, [{ transform: 'translateY(160%)', opacity: 0, offset: 0 }, { transform: 'translateY(160%)', opacity: 0, offset: 0.52, easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'translateY(0)', opacity: 1, offset: 0.9 }, { transform: 'translateY(0)', opacity: 1, offset: 1 }]);
    anim(regla, [{ transform: 'scaleX(0)', offset: 0 }, { transform: 'scaleX(0)', offset: 0.4 }, { transform: 'scaleX(1)', offset: 0.95 }, { transform: 'scaleX(1)', offset: 1 }]);

    // Al cambiar el tamaño, se salta al estado final (el CSS ya tiene las medidas finales).
    const fin = () => anims.forEach((x) => x.cancel());
    window.addEventListener('resize', fin);
    return () => { window.removeEventListener('resize', fin); fin(); };
  }, [raizRef]);
}

export const LoginPage = () => {
  const { usuario, login, aviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const raizRef = useRef(null);
  useApertura(raizRef);

  useEffect(() => { document.title = 'Acceso · BioHCEMG'; }, []);

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

  return (
    <main className="acceso" ref={raizRef}>
      <div className="acceso-fondo" data-anim="fondo" aria-hidden="true">
        <svg viewBox="0 0 1680 960" preserveAspectRatio="none">
          {LINEAS.map((l, i) => <path key={i} d={l.d} fill="none" stroke="#fff" strokeWidth={l.w} strokeOpacity={l.o} />)}
        </svg>
      </div>

      <header className="acceso-nav" data-anim="nav">
        <span className="acceso-marca">BioHCEMG<sup>®</sup></span>
        <span className="acceso-nav-der">
          <span>Medicina General</span>
          <span aria-hidden="true">·</span>
          <span>Acceso del personal</span>
        </span>
      </header>

      <section className="acceso-hero">
        <h1 className="sr-only">Acceso a la Historia Clínica Electrónica de Medicina General</h1>
        <div className="acceso-palabra" aria-hidden="true">
          <span className="acceso-mitad" data-anim="a">VI</span>
          <span className="acceso-pill" data-anim="pill">
            <video src={VIDEO} autoPlay muted loop playsInline preload="auto" />
            <span className="acceso-velo" data-anim="velo" />
            <svg className="acceso-icono acceso-icono--izq" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12h4l2-5 4 10 2.5-6H22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="acceso-icono acceso-icono--der" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="acceso-mitad" data-anim="b">TAL</span>
        </div>
      </section>

      <footer className="acceso-pie" data-anim="pie">
        <p className="acceso-texto">
          <span className="acceso-capital">C</span>ada consulta, completa y en un solo lugar: signos vitales, examen físico,
          diagnóstico CIE-10 y tratamiento. Solo para el personal autorizado del servicio.
        </p>
        <span className="acceso-regla" data-anim="regla" aria-hidden="true" />
        <form className="acceso-form" onSubmit={enviar} noValidate>
          {mensaje && <p className="acceso-error" role="alert">{mensaje}</p>}
          <label className="sr-only" htmlFor="acceso-usuario">Usuario</label>
          <input id="acceso-usuario" className="acceso-campo" placeholder="Usuario" autoComplete="username" required
            value={username} onChange={(e) => setUsername(e.target.value)} />
          <label className="sr-only" htmlFor="acceso-clave">Contraseña</label>
          <input id="acceso-clave" className="acceso-campo" type="password" placeholder="Contraseña" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="acceso-boton" disabled={enviando || !username || !password}>
            {enviando ? 'Entrando…' : 'Entrar'}
            <span className="acceso-flecha" aria-hidden="true">→</span>
          </button>
        </form>
      </footer>
    </main>
  );
};
