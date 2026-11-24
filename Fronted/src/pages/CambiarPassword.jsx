import { useState } from 'react';
import { api } from '../services/api';
import { Campo, Encabezado, Mensaje } from '../components/ui';

export const CambiarPassword = () => {
  const [form, setForm] = useState({ passwordActual: '', passwordNueva: '', confirmacion: '' });
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (form.passwordNueva !== form.confirmacion) {
      setEstado({ tipo: 'error', texto: 'La confirmación no coincide con la contraseña nueva.' });
      return;
    }
    setEnviando(true);
    try {
      await api.post('/auth/password', { passwordActual: form.passwordActual, passwordNueva: form.passwordNueva });
      setForm({ passwordActual: '', passwordNueva: '', confirmacion: '' });
      setEstado({ tipo: 'ok', texto: 'Contraseña actualizada. Las sesiones abiertas en otros equipos se cerraron.' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <Encabezado indice="Cuenta" titulo="Contraseña" subtitulo="Mínimo 8 caracteres. Al cambiarla, se cierran sus sesiones en otros equipos." />
      <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 max-w-md aparece">
        <Mensaje estado={estado} />
        <Campo etiqueta="Contraseña actual"><input type="password" className="input" autoComplete="current-password" required value={form.passwordActual} onChange={set('passwordActual')} /></Campo>
        <Campo etiqueta="Contraseña nueva"><input type="password" className="input" autoComplete="new-password" required minLength={8} value={form.passwordNueva} onChange={set('passwordNueva')} /></Campo>
        <Campo etiqueta="Repita la contraseña nueva"><input type="password" className="input" autoComplete="new-password" required minLength={8} value={form.confirmacion} onChange={set('confirmacion')} /></Campo>
        <button className="btn btn-primario self-start" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}<span className="flecha">→</span></button>
      </form>
    </>
  );
};
