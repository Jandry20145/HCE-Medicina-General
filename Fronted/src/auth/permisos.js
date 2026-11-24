// Espejo de la tabla de permisos de SecurityConfig.java. Solo decide qué se muestra:
// el servidor es quien autoriza.
const PERMISOS = {
  verPacientes: ['Admin', 'Admision', 'Enfermeria', 'Medico'],
  editarPacientes: ['Admin', 'Admision', 'Medico'],
  verHistoria: ['Enfermeria', 'Medico'],
  registrarAntecedentes: ['Enfermeria', 'Medico'],
  crearConsulta: ['Medico'],
  descargarPdf: ['Medico'],
  administrar: ['Admin'],
};

export const puede = (usuario, accion) => Boolean(usuario && PERMISOS[accion]?.includes(usuario.rol));

export const ROLES = [
  { valor: 'Medico', etiqueta: 'Médico' },
  { valor: 'Enfermeria', etiqueta: 'Enfermería' },
  { valor: 'Admision', etiqueta: 'Admisión' },
  { valor: 'Admin', etiqueta: 'Administrador' },
];

export const etiquetaRol = (rol) => ROLES.find((r) => r.valor === rol)?.etiqueta ?? rol;
