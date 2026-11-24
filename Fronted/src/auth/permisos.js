// Espejo de la tabla de permisos de SecurityConfig.java (especificación §4.3). Solo decide
// qué se muestra: el servidor es quien autoriza.
const PERMISOS = {
  pacientes: ['Enfermeria', 'Medico'],
  agenda: ['Enfermeria', 'Medico'],
  triaje: ['Enfermeria', 'Medico'],
  antecedentes: ['Enfermeria', 'Medico'],
  registrarProcedimiento: ['Enfermeria'],
  consulta: ['Medico'],
  documentos: ['Medico'],
  administrar: ['Admin'],
};

export const puede = (usuario, accion) => Boolean(usuario && PERMISOS[accion]?.includes(usuario.rol));

export const ROLES = [
  { valor: 'Medico', etiqueta: 'Médico general' },
  { valor: 'Enfermeria', etiqueta: 'Enfermería' },
  { valor: 'Admin', etiqueta: 'Administración' },
];

export const etiquetaRol = (rol) => ROLES.find((r) => r.valor === rol)?.etiqueta ?? rol;
