import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { checkSupabaseHealth } from '../api/health'
import { useToast } from '../hooks/useToast'

export default function Layout() {
  const location = useLocation()
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [sbOk, setSbOk] = useState(true)
  const sbStatusRef = useRef(true)
  const { push } = useToast()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)

  // 🔹 Título dinámico según ruta
  function getTitle() {
    if (location.pathname.startsWith('/casos-activos')) return 'Casos Activos'
    if (location.pathname.startsWith('/seguimientos')) return 'Seguimientos'
    if (location.pathname.startsWith('/casos-cerrados')) return 'Casos Cerrados'
    if (location.pathname.startsWith('/estudiantes')) return 'Estudiantes'
    if (location.pathname === '/') return 'Inicio'
    return ''
  }

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function probe() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSbOk(false)
        sbStatusRef.current = false
        return
      }
      const res = await checkSupabaseHealth()
      if (cancelled) return
      setSbOk(res.ok)
      if (!res.ok && sbStatusRef.current) {
        push({ type: 'error', title: 'Supabase sin conexión', message: res.message })
      }
      sbStatusRef.current = res.ok
    }

    probe()
    const id = setInterval(probe, 60000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [push])

  // Detect viewport changes to handle mobile sidebar visibility
  useEffect(() => {
    function onResize() {
      const mobileNow = window.innerWidth < 640
      setIsMobile(mobileNow)
      // close mobile overlay when switching to desktop
      if (!mobileNow) setMobileSidebarOpen(false)
    }

    window.addEventListener('resize', onResize)
    // run once
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 selection:bg-brand-500/30">
      {/* Background Gradients (Global) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-400/15 rounded-full blur-[120px] animate-pulse-slow animation-delay-400" />
      </div>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col relative z-10 m-2 ml-0 sm:ml-2.5 bg-white/40 backdrop-blur-xl border border-white/50 shadow-glass rounded-3xl overflow-hidden transition-all duration-300">

        {/* HEADER SUPERIOR */}
        <div className="flex justify-between items-center px-5 py-3 shrink-0 border-b border-white/40">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-white/60 text-slate-600"
          >
            <Menu size={20} />
          </button>

          {/* Page Title (Dynamic from route) */}
          <div className="flex-1 flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
              {location.pathname === '/' ? 'Dashboard' :
                location.pathname === '/casos-activos' ? 'Casos Activos' :
                  location.pathname === '/casos-cerrados' ? 'Casos Cerrados' :
                    location.pathname.includes('seguimientos') ? 'Seguimiento de Caso' :
                      location.pathname === '/estadisticas' ? 'Estadísticas' :
                        location.pathname === '/alertas' ? 'Alertas y Plazos' :
                          'Convivencia Escolar'
              }
            </h2>
          </div>

          {/* Status Indicators */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-emerald-700">Sistema Activo</span>
            </div>
          </div>
        </div>

        {/* 👇 PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 pb-5 pt-3 scroll-smooth">
          <Outlet />
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      )}
    </div>
  )
}
