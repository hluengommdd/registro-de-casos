# Registro de Casos — Smoke checks

## Smoke tests / Verificaciones rápidas

Esta sección describe un chequeo ligero para validar conectividad y comportamiento mínimo con Supabase.

Qué valida:

- Que `getCasesByStatus('En seguimiento')` sea case-insensitive y devuelva filas aunque la base de datos guarde `status` como `En Seguimiento`.
- Que el helper `getStudentName()` siempre devuelva un string (no objetos).
- Que `buildCaseUpdate` no envíe objetos a `student_name` en la actualización (extrae `.name`).

Cómo ejecutar localmente:

1. Crear un archivo `.env.local` en la raíz con al menos estas variables (o definirlas en el entorno):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

2. Ejecutar el smoke check que consulta Supabase (falla si no devuelve filas):

```bash
npm run smoke:status
```

Salida esperada:

- Mensaje `Rows returned: N` con N > 0 y lista de `Statuses returned:`.

Si el script falla (exit code !== 0):

- Puede significar falta de variables de entorno, error de conexión, permisos, o que no se encontraron filas con `status` case-insensitive igual a `En seguimiento`.

Tests unitarios rápidos:

- Para ejecutar tests unitarios (vitest):

```bash
npm test
```

Estos tests comprueban `getStudentName` y que `buildCaseUpdate` extraiga `student_name` como string.
