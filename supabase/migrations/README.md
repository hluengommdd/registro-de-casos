# Migraciones SQL - Registro de Casos

Esta carpeta contiene las migraciones SQL para crear la estructura completa de la base de datos del sistema de registro de casos de convivencia escolar en Supabase.

## 📋 Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

1. **00_extensions.sql** - Extensiones PostgreSQL (uuid-ossp, pg_trgm)
2. **01_tables.sql** - Creación de todas las tablas
3. **02_foreign_keys.sql** - Claves foráneas entre tablas
4. **03_indexes.sql** - Índices para optimización de consultas
5. **04_functions.sql** - Funciones RPC para estadísticas
6. **05_triggers.sql** - Triggers para campos automáticos
7. **06_rls_policies.sql** - Políticas de Row Level Security
8. **07_views.sql** - Vistas para consultas complejas (control de plazos y alertas)

## 🚀 Cómo Usar en un Nuevo Proyecto

### Opción 1: Usando el Editor SQL de Supabase (Recomendado)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia el contenido de cada archivo **en orden** (00 → 07)
5. Ejecuta cada migración haciendo clic en **RUN**
6. Verifica que no haya errores antes de continuar con la siguiente

### Opción 2: Usando Supabase CLI

```bash
# Instalar Supabase CLI si aún no lo tienes
npm install -g supabase

# Inicializar proyecto (si es nuevo)
supabase init

# Copiar archivos de migración a supabase/migrations/
cp 00_extensions.sql supabase/migrations/
cp 01_tables.sql supabase/migrations/
# ... continuar con todos los archivos

# Aplicar migraciones
supabase db push
```

### Opción 3: Ejecución Manual con psql

```bash
# Conectar a tu base de datos
psql "postgresql://postgres:[TU-PASSWORD]@db.[TU-PROYECTO].supabase.co:5432/postgres"

# Ejecutar cada migración
\i 00_extensions.sql
\i 01_tables.sql
\i 02_foreign_keys.sql
\i 03_indexes.sql
\i 04_functions.sql
\i 05_triggers.sql
\i 06_rls_policies.sql
\i 07_views.sql
```

## 📦 Estructura de Tablas Creadas

### Tablas Principales

- **students** - Estudiantes del establecimiento
- **cases** - Casos de convivencia escolar
- **case_followups** - Seguimientos y acciones de cada caso
- **followup_evidence** - Metadatos de evidencias (archivos)
- **involucrados** - Personas involucradas en los casos
- **stage_sla** - Plazos (SLA) para etapas del debido proceso
- **feriados** - Calendario de feriados para cálculo de días hábiles (opcional)

### Vistas

- **v_control_plazos_plus** - Control de plazos por seguimiento con alertas
- **v_control_alertas** - Alertas de indagación urgente
- **v_control_plazos_case_resumen** - Resumen de plazo más urgente por caso

## 🪣 Configuración de Storage Buckets

⚠️ **IMPORTANTE**: Las migraciones SQL no pueden crear buckets de storage automáticamente.

### Crear el Bucket 'evidencias'

1. Ve a **Storage** en el panel de Supabase
2. Crea un nuevo bucket llamado **`evidencias`**
3. Configura como **privado** (no público)
4. Las políticas de acceso se crean automáticamente con la migración `06_rls_policies.sql`

O usando SQL:

```sql
-- Ejecutar desde el SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', false);
```

## 🔐 Configuración de Seguridad (RLS)

Las políticas de Row Level Security incluidas son **permisivas** para facilitar la configuración inicial. 

⚠️ **DEBES personalizar las políticas según las necesidades de tu colegio:**

- Restringir acceso por roles (inspector, profesor, admin)
- Limitar quién puede cerrar casos
- Controlar quién puede modificar seguimientos
- Configurar permisos de storage por usuario

Consulta los ejemplos comentados en `06_rls_policies.sql`.

## 📊 Funciones RPC Implementadas

Las siguientes funciones están disponibles para estadísticas:

- `stats_kpis(desde, hasta)` - KPIs generales
- `stats_cumplimiento_plazos(desde, hasta)` - Cumplimiento de plazos
- `stats_reincidencia(desde, hasta)` - Estudiantes reincidentes
- `stats_mayor_carga(desde, hasta)` - Responsable con más carga
- `stats_mayor_nivel(desde, hasta)` - Tipo de falta más frecuente
- `stats_promedio_seguimientos_por_caso(desde, hasta)` - Promedio de seguimientos
- `stats_tiempo_primer_seguimiento(desde, hasta)` - Tiempo al primer seguimiento
- `stats_casos_por_mes(desde, hasta)` - Distribución por mes
- `stats_casos_por_tipificacion(desde, hasta)` - Distribución por tipo
- `stats_casos_por_curso(desde, hasta)` - Distribución por curso
- `start_due_process(case_id, sla_days)` - Iniciar debido proceso

**Nota**: Algunas funciones son stubs básicos. Revisa `04_functions.sql` para personalizarlas.

## ⚙️ Variables de Entorno Necesarias

Asegúrate de configurar estas variables en tu aplicación:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## ✅ Checklist Post-Migración

Después de ejecutar las migraciones, verifica:

- [ ] Todas las tablas fueron creadas sin errores
- [ ] Las claves foráneas están activas
- [ ] Los índices fueron creados
- [ ] Las funciones RPC están disponibles
- [ ] El bucket 'evidencias' existe en Storage
- [ ] Las políticas RLS están habilitadas
- [ ] Puedes insertar un registro de prueba en cada tabla
- [ ] Las funciones de estadísticas retornan datos

### Prueba Rápida

```sql
-- Insertar estudiante de prueba
INSERT INTO students (first_name, last_name, course)
VALUES ('Juan', 'Pérez', '5A BASICO');

-- Verificar que existe
SELECT * FROM students;

-- Probar función RPC
SELECT * FROM stats_kpis('2024-01-01', '2024-12-31');
```

## 🔧 Solución de Problemas

### Error: "extension uuid-ossp does not exist"
Ejecuta `00_extensions.sql` primero.

### Error: "relation already exists"
Las migraciones usan `IF NOT EXISTS`, por lo que es seguro re-ejecutarlas.

### Error: "foreign key violation"
Asegúrate de ejecutar las migraciones en orden.

### Error al subir evidencias
Verifica que el bucket 'evidencias' existe y tiene las políticas correctas.

## 📝 Notas Importantes

- **No se incluyen datos**: Estas migraciones solo crean la estructura, no incluyen datos de ejemplo
- **Convenciones PostgreSQL**: Se siguen las convenciones estándar de PostgreSQL
- **Formato legible**: Los scripts están comentados y formateados para facilitar su lectura
- **Idempotencia**: Se usan `IF NOT EXISTS` y `DROP IF EXISTS` cuando corresponde

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de error en Supabase Dashboard
2. Verifica que tu plan de Supabase permite las operaciones necesarias
3. Consulta la documentación oficial: https://supabase.com/docs
