// Todas las llamadas a la API pasan por aquí. La sesión viaja en una cookie HttpOnly que
// el navegador envía solo; este código nunca ve el token.
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Error de la API con el mensaje que explica el servidor y el código HTTP. */
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let alExpirarSesion = () => {};
/** El AuthProvider registra aquí qué hacer cuando el servidor responde 401. */
export const onSesionExpirada = (fn) => { alExpirarSesion = fn; };

export async function apiFetch(path, { method = 'GET', body, raw = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revise la red.', 0);
  }

  // /auth/* responde 401 sin que haya una sesión que "expire" (p. ej. al abrir la app sin sesión).
  if (res.status === 401 && !path.startsWith('/auth/')) {
    alExpirarSesion();
    throw new ApiError('Su sesión expiró. Inicie sesión nuevamente.', 401);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const porDefecto = res.status === 403 ? 'No tiene permiso para realizar esta acción.' : 'Ocurrió un error en el servidor.';
    throw new ApiError(data.error || porDefecto, res.status, data.errors);
  }
  if (raw) return res;
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body }),
};

export const buscarCie10 = async (query) => {
  try {
    return await api.get(`/catalogos/cie10/buscar?q=${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
};

export const getAntecedentesPaciente = (idPaciente) => api.get(`/antecedentes/paciente/${idPaciente}`);

export const saveAntecedente = (antecedente) => api.post('/antecedentes', antecedente);
