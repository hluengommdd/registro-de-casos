import { NavLink } from 'react-router-dom';
import {
  Home,
  Folder,
  AlertCircle,
  CheckCircle,
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from 'lucide-react';

import { BRANDING } from '../config/branding';
import { useEffect, useState, useMemo } from 'react';
import { getCasesEnSeguimiento } from '../api/db';
import { onDataUpdated } from '../utils/refreshBus';
import { logger } from '../utils/logger';
import { getStudentName } from '../utils/studentName';
import { useAsync } from '../hooks/useAsync';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem('sidebar-collapsed');
      if (v === null) {
        localStorage.setItem('sidebar-collapsed', 'false');
        return false;
      }
      return v === 'true';
    } catch {
      return false;
    }
  });
  const [expandedSeguimientos, setExpandedSeguimientos] = useState(false);
  // Sidebar items are derived from backend data via useMemo

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    } catch {
      // silently fail
    }
  }, [collapsed]);

  // Use reusable async hook to load cases and support external refresh events
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: enSeguimiento } = useAsync(
    () => getCasesEnSeguimiento(),
    [refreshKey],
  );

  // Subscribe to external refresh events and bump the refresh key
  useEffect(() => {
    const off = onDataUpdated(() => setRefreshKey((k) => k + 1));
    return () => off();
  }, []);

  // Derive sidebar items from backend data (memoized)
  const casosFormateados = useMemo(() => {
    if (!enSeguimiento) return [];

    try {
      return enSeguimiento.map((caso) => {
        const nombre = getStudentName(caso.students, 'Sin nombre');
        return { id: caso.id, nombre };
      });
    } catch (e) {
      logger.error('Error procesando casos en seguimiento:', e);
      return [];
    }
  }, [enSeguimiento]);

  const linkClass =
    'group flex items-center gap-2.5 px-3 py-2 mx-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 relative overflow-hidden';

  const activeClass =
    'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200';

  const inactiveClass =
    'text-slate-600 hover:bg-brand-50/70 hover:text-brand-700 hover:ring-1 hover:ring-brand-200';

  return (
    <>
      {/* Desktop sidebar - FLOATING */}
      <aside
        className={`hidden sm:flex flex-col m-2.5 mr-0 relative z-20
          glass-panel
          transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
          ${collapsed ? 'sidebar-collapsed w-[72px] md:w-[88px]' : 'w-52 md:w-60'}
        `}
      >
        {/* HEADER CON LOGO */}
        <div className="p-4 pb-2 flex items-center justify-between relative">
          <div
            className={`flex items-center gap-2.5 transition-all duration-300 ${collapsed ? 'opacity-0 absolute pointer-events-none translate-x-[-10px]' : 'opacity-100'}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent-500 blur-md opacity-10 rounded-full"></div>
              <img
                src={BRANDING.logoApp}
                alt={BRANDING.appName}
                className="w-10 h-10 relative z-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800 tracking-tight leading-none">
                {BRANDING.appName}
              </h1>
              <p className="text-[9px] font-bold text-brand-500 tracking-widest uppercase mt-0.5">
                {BRANDING.schoolName}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            onClick={() => setCollapsed((s) => !s)}
            className={`
              relative z-30 p-1.5 rounded-lg bg-white/50 hover:bg-white text-slate-500 hover:text-accent-600 tap-target
              transition-all shadow-sm border border-slate-100 hover:border-slate-200 
              hover:scale-110 active:scale-95
              ${collapsed ? 'mx-auto' : ''}
            `}
          >
            {collapsed ? (
              <ChevronRight size={16} strokeWidth={3} />
            ) : (
              <ChevronLeft size={16} strokeWidth={3} />
            )}
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 py-2.5 space-y-0.5 overflow-y-auto no-scrollbar">
          <p
            className={`px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 transition-opacity ${collapsed ? 'hidden' : 'block'}`}
          >
            Menu
          </p>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Home
              size={18}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className={`sidebar-label whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}
            >
              Inicio
            </span>
          </NavLink>

          <NavLink
            to="/casos-activos"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Folder
              size={18}
              className="transition-transform group-hover:scale-105"
            />
            <span
              className={`sidebar-label whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden delay-0' : 'w-auto opacity-100 delay-100'}`}
            >
              Casos Activos
            </span>
          </NavLink>

          {/* Seguimientos con submenu */}
          <div className="flex flex-col gap-1 my-1">
            <button
              type="button"
              onClick={() =>
                !collapsed && setExpandedSeguimientos(!expandedSeguimientos)
              }
              className={`
                group flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200
                ${expandedSeguimientos ? 'bg-slate-50 text-slate-900 border border-slate-100/50' : 'text-slate-500/80 hover:bg-white/50 hover:text-slate-900'}
                ${collapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              <span className="flex items-center gap-3">
                <CheckCircle
                  size={18}
                  className={`transition-colors ${expandedSeguimientos ? 'text-brand-500' : ''}`}
                />
                <span
                  className={`sidebar-label whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}
                >
                  Seguimientos
                </span>
              </span>
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 text-slate-500 ${expandedSeguimientos ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {expandedSeguimientos && !collapsed && (
              <div className="ml-7 mr-3 mt-1 space-y-1 pl-3 border-l-2 border-slate-100">
                {casosFormateados.length > 0 ? (
                  casosFormateados.map((caso) => (
                    <NavLink
                      key={caso.id}
                      to={`/seguimientos/${caso.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${
                          isActive
                            ? 'bg-brand-50/80 text-brand-700 font-bold shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                        }`
                      }
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <span className="truncate">{caso.nombre}</span>
                    </NavLink>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 px-3 py-2 italic opacity-60">
                    Sin casos activos
                  </div>
                )}
              </div>
            )}
          </div>

          <NavLink
            to="/casos-cerrados"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Archive
              size={18}
              className="transition-transform group-hover:scale-105"
            />
            <span
              className={`sidebar-label whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}
            >
              Casos Cerrados
            </span>
          </NavLink>

          <NavLink
            to="/estadisticas"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <BarChart3
              size={18}
              className="transition-transform group-hover:scale-105"
            />
            <span
              className={`sidebar-label whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}
            >
              Estadísticas
            </span>
          </NavLink>

          <div className="pt-4 mt-2 border-t border-slate-100 mx-4">
            <p
              className={`text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 transition-opacity ${collapsed ? 'hidden' : 'block'}`}
            >
              Gestión
            </p>
            <NavLink
              to="/alertas"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 -mx-1 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-red-100 text-red-800 ring-1 ring-red-200' : 'text-slate-500 hover:bg-red-50/50 hover:text-red-700'}`
              }
            >
              <AlertCircle size={18} className="text-red-500" />
              <span
                className={`flex-1 transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}
              >
                Alertas
              </span>
              {!collapsed && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                  LIVE
                </span>
              )}
            </NavLink>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 mt-auto">
          <div
            className={`p-3 rounded-2xl glass-card flex items-center gap-3 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
              U
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">
                Usuario Sistema
              </p>
              <p className="text-[10px] text-slate-500 truncate">Convivencia</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-brand-900/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-500 blur-md opacity-10 rounded-full"></div>
                  <img
                    src={BRANDING.logoApp}
                    alt={BRANDING.appName}
                    className="w-8 h-8 relative z-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
                    {BRANDING.appName}
                  </h1>
                  <p className="text-[8px] font-bold text-slate-600 tracking-widest uppercase mt-0.5">
                    {BRANDING.schoolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Nav Content */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto no-scrollbar">
              <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Menu
              </p>

              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${linkClass} mx-4 ${isActive ? activeClass : inactiveClass}`
                }
                onClick={onClose}
              >
                <Home size={18} />
                <span>Inicio</span>
              </NavLink>

              <NavLink
                to="/casos-activos"
                className={({ isActive }) =>
                  `${linkClass} mx-4 ${isActive ? activeClass : inactiveClass}`
                }
                onClick={onClose}
              >
                <Folder size={18} />
                <span>Casos Activos</span>
              </NavLink>

              {/* Submenu Seguimientos en Móvil */}
              <div className="flex flex-col gap-1 my-1 px-4">
                <button
                  type="button"
                  onClick={() => setExpandedSeguimientos(!expandedSeguimientos)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${expandedSeguimientos ? 'bg-slate-50 text-slate-900 border border-slate-100/50' : 'text-slate-500/80 hover:bg-white/50 hover:text-slate-900'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <CheckCircle
                      size={18}
                      className={expandedSeguimientos ? 'text-accent-600' : ''}
                    />
                    <span>Seguimientos</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 text-slate-500 ${expandedSeguimientos ? 'rotate-180' : ''}`}
                  />
                </button>

                {expandedSeguimientos && (
                  <div className="ml-5 mt-1 space-y-1 pl-3 border-l-2 border-slate-100">
                    {casosFormateados.length > 0 ? (
                      casosFormateados.map((caso) => (
                        <NavLink
                          key={caso.id}
                          to={`/seguimientos/${caso.id}`}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${isActive ? 'bg-brand-50/80 text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`
                          }
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          <span className="truncate">{caso.nombre}</span>
                        </NavLink>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-500 px-3 py-2 italic">
                        Sin casos activos
                      </div>
                    )}
                  </div>
                )}
              </div>

              <NavLink
                to="/casos-cerrados"
                className={({ isActive }) =>
                  `${linkClass} mx-4 ${isActive ? activeClass : inactiveClass}`
                }
                onClick={onClose}
              >
                <Archive size={18} />
                <span>Casos Cerrados</span>
              </NavLink>

              <NavLink
                to="/estadisticas"
                className={({ isActive }) =>
                  `${linkClass} mx-4 ${isActive ? activeClass : inactiveClass}`
                }
                onClick={onClose}
              >
                <BarChart3 size={18} />
                <span>Estadísticas</span>
              </NavLink>

              {/* Gestión */}
              <div className="pt-4 mt-2 border-t border-slate-100 mx-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Gestión
                </p>
                <NavLink
                  to="/alertas"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-red-100 text-red-800 ring-1 ring-red-200' : 'text-slate-500 hover:bg-red-50/50 hover:text-red-700'}`
                  }
                  onClick={onClose}
                >
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="flex-1">Alertas</span>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    LIVE
                  </span>
                </NavLink>
              </div>
            </nav>

            {/* User Footer Mobile */}
            <div className="p-4 mt-auto border-t border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                  U
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700 leading-none">
                    Usuario Sistema
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    Convivencia Escolar
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
