// Fechas y horas en formato local de Ecuador.
export const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const hora = (v) => (v ? new Date(v).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
export const fechaHora = (v) => (v ? `${fecha(v)} · ${hora(v)}` : '—');
