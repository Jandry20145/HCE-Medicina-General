import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Campo, Encabezado, Mensaje } from '../../components/ui';
import { cedulaValida } from '../../utils/clinica';

const VACIO = {
  cedulaIdentidad: '', nombresCompletos: '', apellidosCompletos: '', fechaNacimiento: '', sexo: 'Femenino',
  estadoCivil: '', ocupacion: '', direccion: '', telefono: '', correoElectronico: '', seguroSalud: '',
};
const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' -]+$/;

export function PacienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [numeroHc, setNumeroHc] = useState('');
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/pacientes/${id}`).then((p) => {
      setNumeroHc(p.numeroHistoriaClinica);
      setForm(Object.fromEntries(Object.keys(VACIO).map((k) => [k, p[k] ?? ''])));
    }).catch((e) => setEstado({ tipo: 'error', texto: e.message }));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: k === 'cedulaIdentidad' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    if (!cedulaValida(form.cedulaIdentidad)) return setEstado({ tipo: 'error', texto: 'La cédula no es válida (revise el dígito verificador).' });
    if (!SOLO_LETRAS.test(form.nombresCompletos) || !SOLO_LETRAS.test(form.apellidosCompletos)) {
      return setEstado({ tipo: 'error', texto: 'Nombres y apellidos solo admiten letras.' });
    }
    setEnviando(true);
    try {
      const p = id ? await api.put(`/pacientes/${id}`, form) : await api.post('/pacientes', form);
      navigate(`/pacientes/${p.idPaciente}`);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Encabezado indice={id ? numeroHc : 'Admisión'} titulo={id ? 'Actualizar datos' : 'Nuevo paciente'}
        subtitulo="Obligatorios: cédula, nombres, apellidos, fecha de nacimiento y sexo. El número de historia lo asigna el sistema." />
      <Mensaje estado={estado} />
      <form onSubmit={guardar} className="tarjeta grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl aparece">
        <p className="etiqueta md:col-span-2">Identificación</p>
        <Campo etiqueta="Cédula *"><input className="input num" required inputMode="numeric" value={form.cedulaIdentidad} onChange={set('cedulaIdentidad')} /></Campo>
        <Campo etiqueta="Fecha de nacimiento *"><input type="date" className="input" required max={new Date().toISOString().slice(0, 10)} value={form.fechaNacimiento} onChange={set('fechaNacimiento')} /></Campo>
        <Campo etiqueta="Nombres *"><input className="input" required maxLength={100} value={form.nombresCompletos} onChange={set('nombresCompletos')} /></Campo>
        <Campo etiqueta="Apellidos *"><input className="input" required maxLength={100} value={form.apellidosCompletos} onChange={set('apellidosCompletos')} /></Campo>
        <Campo etiqueta="Sexo *">
          <select className="input" value={form.sexo} onChange={set('sexo')}><option>Femenino</option><option>Masculino</option><option>Otro</option></select>
        </Campo>
        <Campo etiqueta="Estado civil">
          <select className="input" value={form.estadoCivil} onChange={set('estadoCivil')}>
            <option value="">—</option><option>Soltero/a</option><option>Casado/a</option><option>Unión de hecho</option><option>Divorciado/a</option><option>Viudo/a</option>
          </select>
        </Campo>
        <hr className="regla md:col-span-2" />
        <p className="etiqueta md:col-span-2">Contacto</p>
        <Campo etiqueta="Teléfono"><input className="input num" inputMode="tel" maxLength={20} value={form.telefono} onChange={set('telefono')} /></Campo>
        <Campo etiqueta="Correo electrónico"><input type="email" className="input" maxLength={100} value={form.correoElectronico} onChange={set('correoElectronico')} /></Campo>
        <Campo etiqueta="Dirección" className="md:col-span-2"><input className="input" maxLength={255} value={form.direccion} onChange={set('direccion')} /></Campo>
        <Campo etiqueta="Ocupación"><input className="input" maxLength={100} value={form.ocupacion} onChange={set('ocupacion')} /></Campo>
        <Campo etiqueta="Seguro de salud"><input className="input" maxLength={100} value={form.seguroSalud} onChange={set('seguroSalud')} placeholder="IESS, privado, ninguno…" /></Campo>
        <div className="md:col-span-2 flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-texto" onClick={() => navigate(-1)}>Cancelar</button>
          <button className="btn btn-primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}<span className="flecha">→</span></button>
        </div>
      </form>
    </>
  );
}
