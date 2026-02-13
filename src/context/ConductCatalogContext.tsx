/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getConductTypes, getConductCatalog } from '../api/db';
import { logger } from '../utils/logger';

const ConductCatalogContext = createContext(null);

export function ConductCatalogProvider({ children }) {
  const [conductTypes, setConductTypes] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [types, catalog] = await Promise.all([
        getConductTypes({ activeOnly: true }),
        getConductCatalog({ activeOnly: true }),
      ]);
      setConductTypes(types || []);
      setCatalogRows(catalog || []);
    } catch (e) {
      logger.error('Error cargando catálogo de conductas:', e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = {
    conductTypes,
    catalogRows,
    loading,
    error,
    refresh: load,
  };

  return (
    <ConductCatalogContext.Provider value={value}>
      {children}
    </ConductCatalogContext.Provider>
  );
}

export function useConductCatalogContext() {
  return useContext(ConductCatalogContext);
}
