# 📋 Instrucciones de Clonación de Base de Datos Supabase

## Objetivo
Clonar la estructura completa de la base de datos para implementar la plataforma en un nuevo colegio, **sin incluir datos de estudiantes ni casos existentes**.

## ⚠️ Requisitos
- Cuenta de Supabase (gratuita o de pago)
- Acceso a la consola web de Supabase: https://app.supabase.com
- Navegador web moderno

## 🚀 Pasos de Clonación

### Paso 1: Crear un nuevo proyecto en Supabase

1. Accede a https://app.supabase.com
2. Click en **"New Project"**
3. Completa los datos:
   - **Name**: `registro-casos-[nombre-colegio]`
   - **Database Password**: Genera una contraseña segura y guárdala
   - **Region**: Elige la más cercana a tu ubicación
   - **Pricing Plan**: Selecciona según tu necesidad (Free tier es suficiente para empezar)
4. Click en **"Create new project"**
5. Espera 2-3 minutos mientras Supabase crea tu base de datos

### Paso 2: Ejecutar el script de schema

1. En tu nuevo proyecto, ve al menú lateral **SQL Editor**
2. Click en **"New query"**
3. Abre el archivo `supabase/schema.sql` de este repositorio
4. Copia **todo el contenido** del archivo
5. Pégalo en el editor SQL de Supabase
6. Click en **"Run"** (botón verde en la esquina inferior derecha)
7. Verifica que aparezca el mensaje: **"Success. No rows returned"**

### Paso 3: Crear el Storage Bucket para evidencias

1. Ve al menú lateral **Storage**
2. Click en **"Create bucket"**
3. Configuración:
   - **Name**: `evidencias`
   - **Public bucket**: ❌ **Desmarcar** (debe ser privado)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: Dejar en blanco o especificar: `image/*,application/pdf,video/*`
4. Click en **"Save"**

### Paso 4: Verificar la instalación

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver las siguientes tablas:
   - ✅ `students`
   - ✅ `cases`
   - ✅ `case_followups`
   - ✅ `followup_evidence`
   - ✅ `involucrados`
   - ✅ `stage_sla`
3. Click en la tabla `stage_sla` - debe tener 8 filas con las etapas del proceso

### Paso 5: Obtener las credenciales de conexión

1. Ve a **Settings** > **API** en el menú lateral
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public key** (ejemplo: `eyJhbGc...`)
3. Guárdalos en un archivo `.env.local` en tu aplicación:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Paso 6: Configurar la aplicación frontend

1. En tu repositorio local, actualiza el archivo `.env.local` con las credenciales del Paso 5
2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Accede a http://localhost:5173
4. Verifica la conexión en la esquina superior derecha (debe mostrar el indicador verde)

## 🎯 Cargar Datos Iniciales (Opcional)

### Importar estudiantes desde CSV

1. Ve a **Table Editor** > **students**
2. Click en **"Insert"** > **"Import data from CSV"**
3. Prepara un archivo CSV con esta estructura:

```csv
rut,first_name,last_name,level,course
12345678-9,Juan,Pérez,Primaria,5A BASICO
87654321-0,María,González,Secundaria,1A MEDIO
```

4. Arrastra el archivo o selecciónalo
5. Mapea las columnas correctamente
6. Click en **"Import"**

### Nota importante sobre datos
- **NO importes** los archivos CSV de la carpeta `supabase archivos/` ya que contienen datos del colegio original
- Crea tus propios archivos CSV con los estudiantes del nuevo colegio
- Los IDs (UUID) se generarán automáticamente

## 🔒 Seguridad y RLS

Por defecto, las políticas RLS (Row Level Security) están configuradas para permitir acceso total a usuarios autenticados. 

Si deseas implementar autenticación de usuarios específica:

1. Ve a **Authentication** > **Policies**
2. Selecciona cada tabla y personaliza las políticas según tus necesidades
3. Considera implementar roles (inspector, coordinador, administrador)

## 🆘 Solución de Problemas

### Error: "relation already exists"
- Esto significa que ya ejecutaste el script antes
- Puedes ignorarlo si las tablas ya existen, o
- Elimina las tablas manualmente en **Table Editor** y vuelve a ejecutar el script

### Error: "permission denied"
- Verifica que estés usando el proyecto correcto
- Asegúrate de estar logueado con una cuenta que tenga permisos de administrador

### La aplicación no se conecta
- Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sean correctas
- Reinicia el servidor de desarrollo
- Verifica en la consola del navegador (F12) si hay errores de CORS o red

## 📞 Soporte

Para más información sobre Supabase:
- Documentación oficial: https://supabase.com/docs
- Comunidad Discord: https://discord.supabase.com
