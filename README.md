# 📚 Registro de Casos - Plataforma de Convivencia Escolar

Sistema web para la gestión de casos de convivencia escolar, con seguimiento de procesos, control de plazos y generación de reportes.

## 🚀 Características

- **Gestión de Casos**: Registro y seguimiento de casos de convivencia escolar
- **Estudiantes**: Base de datos de estudiantes con información académica
- **Control de Plazos**: Sistema automatizado de alertas y vencimientos
- **Debido Proceso**: Seguimiento de etapas del debido proceso con plazos configurables
- **Involucrados**: Registro de personas involucradas en cada caso
- **Evidencias**: Almacenamiento seguro de archivos adjuntos
- **Estadísticas**: Dashboard con KPIs y métricas del sistema

## 🛠️ Tecnologías

- **Frontend**: React + Vite
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Reportes**: React PDF

## 📦 Instalación

### Requisitos previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Pasos de instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/hluengommdd/registro-de-casos.git
   cd registro-de-casos
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Accede a http://localhost:5173

## 🗄️ Estructura de la Base de Datos

### Tablas principales

- **students**: Información de estudiantes
- **cases**: Casos de convivencia escolar
- **case_followups**: Seguimientos y acciones del debido proceso
- **followup_evidence**: Evidencias adjuntas
- **involucrados**: Personas involucradas en casos
- **stage_sla**: Configuración de plazos por etapa

### Vistas

- **v_control_plazos_plus**: Control de plazos del debido proceso
- **v_control_alertas**: Alertas de plazos de indagación

### Funciones RPC

- **start_due_process**: Iniciar debido proceso con cálculo de días hábiles
- **stats_kpis**: Obtener estadísticas y KPIs

## 🔄 Clonar para otro colegio

Si deseas implementar esta plataforma en otro colegio, sigue estos pasos:

1. Lee las instrucciones completas en [`supabase/INSTRUCCIONES_CLONACION.md`](supabase/INSTRUCCIONES_CLONACION.md)
2. Crea un nuevo proyecto en [Supabase](https://app.supabase.com)
3. Ejecuta el script [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor
4. Configura las credenciales en tu archivo `.env.local`
5. Importa los estudiantes del nuevo colegio

**Importante**: La clonación solo copia la estructura (tablas, vistas, funciones), no los datos de estudiantes ni casos.

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la aplicación construida
- `npm run lint` - Ejecuta el linter

## 🔒 Seguridad

- Las credenciales de Supabase deben mantenerse en archivos `.env.local` (nunca en el repositorio)
- Row Level Security (RLS) configurado por defecto
- Storage privado para evidencias

## 📄 Licencia

Este proyecto es privado y está destinado exclusivamente para uso educacional interno.

## 👥 Contribución

Para contribuir al proyecto:

1. Crea una rama con tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
2. Haz commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
3. Push a la rama (`git push origin feature/nueva-funcionalidad`)
4. Abre un Pull Request

## 🆘 Soporte

Para reportar problemas o solicitar funcionalidades, abre un issue en el repositorio.
