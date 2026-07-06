import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { API_URL } from '../services/api';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRol', data.rol);
        localStorage.setItem('userName', data.nombresCompletos);
        localStorage.setItem('userId', data.idUsuario);
        navigate('/');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm"></div>
      
      <div className="w-full max-w-md p-8 m-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
        {/* Elementos decorativos (blobs) */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-20 text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Bienvenido</h1>
          <p className="text-blue-200 mt-2 text-sm font-light">Ingrese a su portal médico</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-20 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center font-medium animate-pulse shadow-lg shadow-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100 ml-1">Usuario</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 border border-white/20 rounded-2xl leading-5 bg-white/5 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 sm:text-sm hover:bg-white/10"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-12 py-3.5 border border-white/20 rounded-2xl leading-5 bg-white/5 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 sm:text-sm hover:bg-white/10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-cyan-500 focus:ring-cyan-400 border-white/20 rounded bg-white/5 cursor-pointer accent-cyan-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-200 cursor-pointer hover:text-white transition-colors">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                ¿Olvidó su contraseña?
              </a>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-cyan-500/30 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-cyan-500 transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
