// Cálculos clínicos de apoyo. Orientan al médico; no sustituyen su criterio.

/** Edad en años cumplidos a una fecha (por defecto hoy). Acepta 'AAAA-MM-DD'. */
export function calcularEdad(fechaNacimiento, hoy = new Date()) {
  if (!fechaNacimiento) return null;
  const [a, m, d] = String(fechaNacimiento).split('-').map(Number);
  if (!a || !m || !d) return null;
  let edad = hoy.getFullYear() - a;
  const mes = hoy.getMonth() + 1;
  if (mes < m || (mes === m && hoy.getDate() < d)) edad--;
  return edad >= 0 ? edad : null;
}

/** IMC (kg/m²) con un decimal, o null si faltan datos. */
export function calcularImc(pesoKg, tallaCm) {
  const p = Number(pesoKg);
  const t = Number(tallaCm) / 100;
  if (!p || !t || p <= 0 || t <= 0) return null;
  return Math.round((p / (t * t)) * 10) / 10;
}

/** Clasificación OMS del IMC en adultos. */
export function clasificarImc(imc) {
  if (imc == null) return null;
  if (imc < 18.5) return { etiqueta: 'Bajo peso', nivel: 'alerta' };
  if (imc < 25) return { etiqueta: 'Normal', nivel: 'normal' };
  if (imc < 30) return { etiqueta: 'Sobrepeso', nivel: 'alerta' };
  return { etiqueta: 'Obesidad', nivel: 'critico' };
}

/**
 * Avisos sobre signos vitales de un adulto. Umbrales generales de consulta externa;
 * devuelve una lista de { texto, nivel } donde nivel es 'alerta' o 'critico'.
 */
export function alertasSignos(s) {
  const avisos = [];
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const temp = num(s.temperatura);
  const pulso = num(s.pulso);
  const fr = num(s.frecuenciaRespiratoria);
  const sat = num(s.saturacionOxigeno);

  if (temp != null) {
    if (temp >= 39.5) avisos.push({ texto: `Fiebre alta (${temp} °C)`, nivel: 'critico' });
    else if (temp >= 38) avisos.push({ texto: `Fiebre (${temp} °C)`, nivel: 'alerta' });
    else if (temp < 35) avisos.push({ texto: `Hipotermia (${temp} °C)`, nivel: 'critico' });
  }
  if (pulso != null) {
    if (pulso > 120 || pulso < 40) avisos.push({ texto: `Frecuencia cardiaca ${pulso} lpm`, nivel: 'critico' });
    else if (pulso > 100) avisos.push({ texto: `Taquicardia (${pulso} lpm)`, nivel: 'alerta' });
    else if (pulso < 50) avisos.push({ texto: `Bradicardia (${pulso} lpm)`, nivel: 'alerta' });
  }
  if (fr != null && (fr > 24 || fr < 10)) avisos.push({ texto: `Frecuencia respiratoria ${fr} rpm`, nivel: fr > 30 || fr < 8 ? 'critico' : 'alerta' });
  if (sat != null && sat < 94) avisos.push({ texto: `Saturación ${sat} %`, nivel: sat < 90 ? 'critico' : 'alerta' });

  const pa = /^(\d{2,3})\/(\d{2,3})$/.exec(String(s.presionArterial || '').trim());
  if (pa) {
    const [sis, dia] = [Number(pa[1]), Number(pa[2])];
    if (sis >= 180 || dia >= 120) avisos.push({ texto: `Crisis hipertensiva (${sis}/${dia})`, nivel: 'critico' });
    else if (sis >= 140 || dia >= 90) avisos.push({ texto: `Presión elevada (${sis}/${dia})`, nivel: 'alerta' });
    else if (sis < 90) avisos.push({ texto: `Hipotensión (${sis}/${dia})`, nivel: 'alerta' });
  }
  return avisos;
}

/** Signos del formulario → cuerpo de la API: vacíos a null (antes se guardaban como 0). */
export function signosParaApi(s) {
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const txt = (v) => (v && String(v).trim() ? String(v).trim() : null);
  return {
    presionArterial: txt(s.presionArterial),
    pulso: num(s.pulso),
    temperatura: num(s.temperatura),
    frecuenciaRespiratoria: num(s.frecuenciaRespiratoria),
    saturacionOxigeno: num(s.saturacionOxigeno),
    pesoKg: num(s.pesoKg),
    tallaCm: num(s.tallaCm),
    grupoSanguineo: txt(s.grupoSanguineo),
  };
}

/** Cédula ecuatoriana de persona natural (módulo 10). Igual que CedulaEcuatoriana.java. */
export function cedulaValida(cedula) {
  if (!/^\d{10}$/.test(cedula || '')) return false;
  const provincia = Number(cedula.slice(0, 2));
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;
  if (Number(cedula[2]) >= 6) return false;
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(cedula[i]);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  }
  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
}

/** Formulario de signos vitales vacío. */
export const SIGNOS_VACIOS = { presionArterial: '', pulso: '', frecuenciaRespiratoria: '', temperatura: '', saturacionOxigeno: '', pesoKg: '', tallaCm: '', grupoSanguineo: '' };
