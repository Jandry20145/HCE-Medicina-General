import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen text-slate-100 bg-slate-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative">
        <div className="relative z-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
