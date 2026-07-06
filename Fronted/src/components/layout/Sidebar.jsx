import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Activity } from 'lucide-react';

export const Sidebar = () => {
  const userName = localStorage.getItem('userName') || 'Usuario';
  const userRol = localStorage.getItem('userRol') || 'Rol';
  const initials = userName.substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/pacientes', name: 'Pacientes', icon: <Users size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 text-slate-300 flex flex-col h-screen fixed shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Activity className="text-cyan-400 mr-2" size={24} />
        <span className="text-xl font-bold text-slate-100 tracking-wide">BioHCEMG<span className="text-cyan-400">.</span></span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Medicina General
        </p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-slate-900 text-cyan-400 font-medium'
                : 'hover:bg-slate-700 hover:text-cyan-400'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 font-bold border border-slate-700">
            {initials}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-200">{userName}</p>
            <p className="text-xs text-slate-400">{userRol}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
