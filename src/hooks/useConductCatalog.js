import { useConductCatalogContext } from '../context/ConductCatalogContext';

export default function useConductCatalog() {
  const ctx = useConductCatalogContext();
  if (!ctx)
    throw new Error(
      'useConductCatalog must be used within ConductCatalogProvider',
    );
  return ctx;
}
