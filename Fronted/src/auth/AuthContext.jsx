import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onSesionExpirada } from '../services/api';

const AuthContext = createContext(null);

/**
 * Quién tiene la sesión. Se pregunta al servidor (/auth/me) al abrir la app: nada en el
 * navegador decide si hay sesión. Los permisos de aquí solo ocultan botones; el servidor
 * vuelve a comprobarlos en cada petición.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    onSesionExpirada(() => {
      setUsuario(null);
      setAviso('Su sesión expiró. Inicie sesión nuevamente.');
    });
    api.get('/auth/me')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const perfil = await api.post('/auth/login', { username, password });
    setAviso('');
    setUsuario(perfil);
    return perfil;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, aviso, login, logout }), [usuario, cargando, aviso, login, logout]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
