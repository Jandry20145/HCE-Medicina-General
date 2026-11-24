import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Campo, Encabezado, Mensaje } from '../../components/ui';

export function ConfiguracionPage() {
  const [form, setForm] = useState(null);
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    api.get('/configuracion').then((c) => setForm({
      ...c, horaApertura: c.horaApertura.slice(0, 5), horaCierre: c.horaCierre.slice(0, 5),
      direccion: c.direccion || '', telefono: c.telefono || '', pieDocumentos: c.pieDocumentos || '',
    })).catch((e) => setEstado({ tipo: 'error', texto: e.message }));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/configuracion', { ...form, duracionCitaMin: Number(form.duracionCitaMin) });
      setEstado({ tipo: 'ok', texto: 'Configuración guardada.' });
    } catch (err) { setEstado({ tipo: 'error', texto: err.message }); }
  };

  if (!form) return <Mensaje estado={estado || { tipo: 'info', texto: 'Cargando…' }} />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <Encabezado indice="Administración" titulo="Configuración" subtitulo="Datos del establecimiento que aparecen en recetas y certificados, y horario que usa la agenda." />
      <Mensaje estado={estado} />
      <form onSubmit={guardar} className="tarjeta grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl aparece">
        <p className="etiqueta md:col-span-2">Establecimiento</p>
        <Campo etiqueta="Nombre" className="md:col-span-2"><input className="input" required maxLength={150} value={form.nombreEstablecimiento} onChange={set('nombreEstablecimiento')} /></Campo>
        <Campo etiqueta="Dirección"><input className="input" maxLength={255} value={form.direccion} onChange={set('direccion')} /></Campo>
        <Campo etiqueta="Teléfono"><input className="input" maxLength={30} value={form.telefono} onChange={set('telefono')} /></Campo>
        <hr className="regla md:col-span-2" />
        <p className="etiqueta md:col-span-2">Agenda</p>
        <Campo etiqueta="Apertura"><input type="time" className="input" required value={form.horaApertura} onChange={set('horaApertura')} /></Campo>
        <Campo etiqueta="Cierre"><input type="time" className="input" required value={form.horaCierre} onChange={set('horaCierre')} /></Campo>
        <Campo etiqueta="Duración de cita (min)"><input type="number" className="input" min={5} max={240} required value={form.duracionCitaMin} onChange={set('duracionCitaMin')} /></Campo>
        <hr className="regla md:col-span-2" />
        <Campo etiqueta="Pie de recetas y certificados" className="md:col-span-2" ayuda="Ej.: horario, número de licencia de funcionamiento, aviso de privacidad breve.">
          <textarea className="input" rows={3} maxLength={500} value={form.pieDocumentos} onChange={set('pieDocumentos')} />
        </Campo>
        <div className="md:col-span-2"><button className="btn btn-primario">Guardar<span className="flecha">→</span></button></div>
      </form>
    </>
  );
}
