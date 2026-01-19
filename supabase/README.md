# Estructura de Base de Datos Supabase

Esta carpeta contiene la estructura completa de la base de datos para el sistema de **Registro de Casos de Convivencia Escolar**.

## 📁 Contenido

```
supabase/
├── migrations/           # Archivos SQL de migración
│   ├── 00_extensions.sql
│   ├── 01_tables.sql
│   ├── 02_foreign_keys.sql
│   ├── 03_indexes.sql
│   ├── 04_functions.sql
│   ├── 05_triggers.sql
│   ├── 06_rls_policies.sql
│   ├── 07_views.sql
│   └── README.md
└── README.md            # Este archivo
```

## 🎯 ¿Qué es esta carpeta?

Este directorio contiene las **migraciones SQL** que definen la estructura completa de la base de datos en Supabase. Permite:

✅ Clonar la estructura a un nuevo proyecto Supabase  
✅ Recrear la base de datos desde cero  
✅ Documentar el esquema de la base de datos  
✅ Mantener control de versiones de la estructura  
✅ Facilitar el desarrollo en múltiples ambientes

## 🚀 Cómo Clonar a un Nuevo Proyecto Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Crea un nuevo proyecto
3. Anota tu **URL del proyecto** y **anon key**

### Paso 2: Ejecutar Migraciones

Elige uno de estos métodos:

#### Método A: Editor SQL de Supabase (Más Fácil)

1. Abre tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y ejecuta cada archivo SQL **en orden** (00 → 07)
5. Verifica que no haya errores entre cada ejecución

#### Método B: Supabase CLI (Más Profesional)

```bash
# Instalar CLI
npm install -g supabase

# Inicializar en tu proyecto local
cd tu-proyecto
supabase init

# Copiar migraciones
cp -r supabase/migrations/* ./supabase/migrations/

# Vincular con tu proyecto
supabase link --project-ref tu-proyecto-ref

# Aplicar migraciones
supabase db push
```

### Paso 3: Crear Bucket de Storage

El bucket para evidencias debe crearse manualmente:

1. Ve a **Storage** en Supabase Dashboard
2. Crea un bucket llamado **`evidencias`**
3. Márcalo como **privado**
4. Las políticas de acceso se configuran automáticamente

### Paso 4: Configurar Variables de Entorno

En tu aplicación, configura:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 📊 Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `students` | Estudiantes del establecimiento |
| `cases` | Casos de convivencia escolar |
| `case_followups` | Seguimientos y acciones por caso |
| `followup_evidence` | Metadatos de archivos de evidencia |
| `involucrados` | Personas involucradas en los casos |
| `stage_sla` | Plazos (SLA) para etapas del debido proceso |
| `feriados` | Calendario de feriados (para días hábiles) |

### Vistas

| Vista | Descripción |
|-------|-------------|
| `v_control_plazos_plus` | Control de plazos por seguimiento |
| `v_control_alertas` | Alertas de indagación urgente |
| `v_control_plazos_case_resumen` | Resumen de plazo más urgente por caso |

### Funciones RPC Disponibles

El sistema incluye funciones para generar estadísticas:

- `stats_kpis` - KPIs generales del sistema
- `stats_cumplimiento_plazos` - Cumplimiento de plazos SLA
- `stats_reincidencia` - Estudiantes con múltiples casos
- `stats_mayor_carga` - Responsable con más seguimientos
- `stats_casos_por_mes` - Distribución temporal
- `stats_casos_por_tipificacion` - Distribución por gravedad
- `stats_casos_por_curso` - Distribución por curso

Y más... (ver `04_functions.sql` para la lista completa)

## ✅ Checklist de Verificación Post-Migración

Después de ejecutar las migraciones, verifica:

### Estructura
- [ ] Todas las 6 tablas fueron creadas
- [ ] La tabla de feriados fue creada
- [ ] Las 3 vistas fueron creadas
- [ ] Las claves foráneas están activas
- [ ] Los índices fueron creados correctamente

### Funcionalidad
- [ ] Las funciones RPC están disponibles
- [ ] Los triggers funcionan (updated_at se actualiza automáticamente)
- [ ] Las políticas RLS están habilitadas

### Storage
- [ ] El bucket 'evidencias' existe
- [ ] Las políticas de storage están configuradas
- [ ] Puedes subir un archivo de prueba

### Pruebas
- [ ] Puedes insertar un estudiante
- [ ] Puedes crear un caso
- [ ] Puedes agregar un seguimiento
- [ ] Las funciones de estadísticas retornan datos

### Ejemplo de Prueba Rápida

```sql
-- 1. Insertar estudiante
INSERT INTO students (first_name, last_name, course)
VALUES ('María', 'González', '6A BASICO')
RETURNING *;

-- 2. Crear caso (usar el ID del estudiante anterior)
INSERT INTO cases (student_id, incident_date, incident_time, status, conduct_type, short_description)
VALUES ('uuid-del-estudiante', '2024-01-15', '10:30', 'Reportado', 'Leve', 'Caso de prueba')
RETURNING *;

-- 3. Verificar funciones RPC
SELECT * FROM stats_kpis('2024-01-01', '2024-12-31');

-- 4. Verificar vistas
SELECT * FROM v_control_plazos_plus LIMIT 5;
SELECT * FROM v_control_alertas LIMIT 5;
```

## 🔐 Seguridad y Permisos

⚠️ **IMPORTANTE**: Las políticas RLS incluidas son **básicas y permisivas**.

Antes de usar en producción, **DEBES**:

1. Revisar y ajustar las políticas en `06_rls_policies.sql`
2. Implementar autenticación apropiada
3. Definir roles de usuario (inspector, profesor, admin)
4. Restringir operaciones sensibles (cerrar casos, eliminar registros)
5. Configurar políticas de storage adecuadas

### Ejemplo de Política Restrictiva

```sql
-- Solo inspectores pueden cerrar casos
CREATE POLICY "Solo inspectores cierran casos"
  ON cases FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'inspector'
    OR status != 'Cerrado'
  );
```

## 🔄 Actualizaciones Futuras

Para agregar cambios a la estructura:

1. Crea un nuevo archivo de migración con número secuencial (ej: `07_nueva_funcionalidad.sql`)
2. Documenta los cambios en comentarios
3. Actualiza este README con la nueva funcionalidad
4. Aplica la migración en todos los ambientes

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## 🆘 Solución de Problemas Comunes

### Error: "permission denied for schema public"
Tu usuario necesita permisos. Ejecuta:
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Error: "extension already exists"
No es un problema. Las extensiones ya están instaladas.

### No puedo insertar registros
Verifica las políticas RLS:
```sql
-- Ver políticas activas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Las funciones RPC no aparecen
Asegúrate de que `04_functions.sql` se ejecutó sin errores:
```sql
-- Ver funciones creadas
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE 'stats_%';
```

## 📝 Notas Importantes

- Esta estructura está diseñada para PostgreSQL 14+ (versión de Supabase)
- Las funciones de estadísticas incluyen implementaciones básicas que pueden necesitar ajustes
- Los SLA (plazos) están configurados con valores de ejemplo que deben personalizarse
- El cálculo de días hábiles en `start_due_process` es simplificado y debe mejorarse para producción
- No se incluyen datos de ejemplo, solo estructura

## 🤝 Contribuciones

Para contribuir mejoras a la estructura:

1. Documenta claramente los cambios
2. Mantén la compatibilidad hacia atrás cuando sea posible
3. Incluye comentarios en español
4. Prueba en un ambiente de desarrollo primero
5. Actualiza los READMEs correspondientes

## 📄 Licencia

Esta estructura de base de datos es parte del sistema de Registro de Casos y sigue la misma licencia del proyecto principal.

---

**Última actualización**: Enero 2026  
**Versión de Supabase**: Compatible con proyectos PostgreSQL 14+  
**Mantenido por**: Equipo de Desarrollo
