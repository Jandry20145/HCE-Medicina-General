import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { cedulaValida } from '../../utils/clinica';

export const FormularioPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Si hay ID, es edición

  // La ruta ya exige permiso de edición (Admin, Admisión o Médico).
  const isReadOnly = false;

  const [formData, setFormData] = useState({
    numeroHistoriaClinica: '',
    cedulaIdentidad: '',
    nombresCompletos: '',
    apellidosCompletos: '',
    fechaNacimiento: '',
    sexo: 'Masculino',
    estadoCivil: '',
    ocupacion: '',
    direccion: '',
    telefono: '',
    correoElectronico: '',
    seguroSalud: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch paciente para editar
      api.get(`/pacientes/${id}`)
        .then(data => {
          setFormData({
            numeroHistoriaClinica: data.numeroHistoriaClinica || '',
            cedulaIdentidad: data.cedulaIdentidad || '',
            nombresCompletos: data.nombresCompletos || '',
            apellidosCompletos: data.apellidosCompletos || '',
            fechaNacimiento: data.fechaNacimiento || '',
            sexo: data.sexo || 'Masculino',
            estadoCivil: data.estadoCivil || '',
            ocupacion: data.ocupacion || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            correoElectronico: data.correoElectronico || '',
            seguroSalud: data.seguroSalud || ''
          });
        })
        .catch(err => setError(err.message));
    }
  }, [id]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cedulaIdentidad') {
      // Remover todo lo que no sea número y limitar a 10
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      alert("Solo el personal médico puede guardar o editar pacientes.");
      return;
    }
    setLoading(true);
    setError('');

    if (!cedulaValida(formData.cedulaIdentidad)) {
      setError('La Cédula de Identidad ingresada no es válida.');
      setLoading(false);
      return;
    }

    const regexTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    
    if (!regexTexto.test(formData.nombresCompletos)) {
      setError('El nombre ingresado es incorrecto. Solo se permiten letras, sin números ni caracteres especiales.');
      setLoading(false);
      return;
    }

    if (!regexTexto.test(formData.apellidosCompletos)) {
      setError('El apellido ingresado es incorrecto. Solo se permiten letras, sin números ni caracteres especiales.');
      setLoading(false);
      return;
    }

    try {
      // El N° de HC lo asigna el servidor: no se envía.
      // eslint-disable-next-line no-unused-vars
      const { numeroHistoriaClinica, ...datos } = formData;
      if (id) await api.put(`/pacientes/${id}`, datos);
      else await api.post('/pacientes', datos);

      navigate('/pacientes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/pacientes')}
            className="p-2 mr-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">{id ? 'Editar Paciente' : 'Nuevo Paciente'}</h1>
            <p className="text-slate-400">Complete los datos sociodemográficos del paciente.</p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold">Acceso Restringido</h4>
            <p className="text-sm">Solo el médico o el personal de salud puede llenar o modificar el registro de pacientes. Los campos han sido bloqueados.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">

        <h2 className="text-lg font-semibold text-cyan-400 border-b border-slate-700 pb-2">Identificación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cédula de Identidad *</label>
            <input
              required type="text" name="cedulaIdentidad" value={formData.cedulaIdentidad} onChange={handleChange}
              disabled={!!id || isReadOnly}
              maxLength="10"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:border-cyan-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombres *</label>
            <input
              disabled={isReadOnly}
              required
              value={formData.nombresCompletos}
              onChange={(e) => setFormData({ ...formData, nombresCompletos: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Apellidos *</label>
            <input
              disabled={isReadOnly}
              required
              value={formData.apellidosCompletos}
              onChange={(e) => setFormData({ ...formData, apellidosCompletos: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-cyan-400 border-b border-slate-700 pb-2">Datos Biológicos y Demográficos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Nacimiento *</label>
            <input
              disabled={isReadOnly}
              required type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.fechaNacimiento}
              onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sexo *</label>
            <select
              disabled={isReadOnly}
              required
              value={formData.sexo}
              onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Estado Civil *</label>
            <select
              disabled={isReadOnly}
              required
              value={formData.estadoCivil}
              onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione...</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="Unión Libre">Unión Libre</option>
            </select>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-cyan-400 border-b border-slate-700 pb-2">Información de Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Dirección de Residencia</label>
            <input
              disabled={isReadOnly}
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
            <input
              disabled={isReadOnly}
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <input
              disabled={isReadOnly}
              type="email"
              value={formData.correoElectronico}
              onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          {!isReadOnly ? (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="mr-2" size={20} />
              {loading ? 'Guardando...' : (id ? 'Actualizar Paciente' : 'Guardar Paciente')}
            </button>
          ) : (
            <button disabled className="flex items-center px-6 py-3 bg-slate-700 text-slate-400 rounded-lg font-semibold cursor-not-allowed">
              <span className="text-lg mr-2">🔒</span> Formulario Bloqueado
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
