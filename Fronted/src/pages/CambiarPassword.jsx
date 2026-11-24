import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api } from '../services/api';

const campo = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-cyan-500 outline-none';

export const CambiarPassword = () => {
  const [form, setForm] = useState({ passwordActual: '', passwordNueva: '', confirmacion: '' });
  const [estado, setEstado] = useState({ tipo: '', texto: '' });
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
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3"><KeyRound className="text-cyan-400" aria-hidden="true" /> Cambiar contraseña</h1>
      <form onSubmit={enviar} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <label className="block text-sm text-slate-400">Contraseña actual
          <input type="password" autoComplete="current-password" required value={form.passwordActual} onChange={set('passwordActual')} className={`${campo} mt-1`} />
        </label>
        <label className="block text-sm text-slate-400">Contraseña nueva (mínimo 8 caracteres)
          <input type="password" autoComplete="new-password" required minLength={8} value={form.passwordNueva} onChange={set('passwordNueva')} className={`${campo} mt-1`} />
        </label>
        <label className="block text-sm text-slate-400">Repita la contraseña nueva
          <input type="password" autoComplete="new-password" required minLength={8} value={form.confirmacion} onChange={set('confirmacion')} className={`${campo} mt-1`} />
        </label>
        {estado.texto && (
          <p role={estado.tipo === 'error' ? 'alert' : 'status'} className={estado.tipo === 'error' ? 'text-red-300 text-sm' : 'text-teal-300 text-sm'}>{estado.texto}</p>
        )}
        <button disabled={enviando} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white px-4 py-3 rounded-xl font-semibold">
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
};
