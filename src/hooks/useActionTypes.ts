import { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

/**
 * Hook para obtener los tipos de acciones desde Supabase
 * Útil para el catálogo dinámico en formularios de seguimiento
 */
export default function useActionTypes() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('action_types')
          .select('name, category, sort_order')
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (cancelled) return;

        if (fetchError) {
          console.warn(
            'Error fetching action_types, falling back to defaults:',
            fetchError,
          );
          setActions([
            'Entrevista',
            'Notificación',
            'Recopilación',
            'Medida',
            'Indagacion',
            'Resolucion',
            'Apelacion',
            'Monitoreo',
          ]);
        } else if (data) {
          setActions(data.map((d) => d.name));
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('Error in useActionTypes:', err);
        // Fallback to defaults
        setActions([
          'Entrevista',
          'Notificación',
          'Recopilación',
          'Medida',
          'Indagacion',
          'Resolucion',
          'Apelacion',
          'Monitoreo',
        ]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, []);

  return { actions, loading };
}
