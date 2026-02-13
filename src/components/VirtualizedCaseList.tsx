import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import CaseCard from './CaseCard';

type CaseLike = {
  id: string;
  [key: string]: unknown;
};

/**
 * Componente de lista virtualizada para casos
 * Optimiza el renderizado de grandes listas usando windowing
 *
 * @param {Object} props
 * @param {Array} props.casos - Array de casos a mostrar
 * @param {Map} props.plazosInfo - Map con información de plazos por caso ID
 * @param {Function} props.onViewCase - Callback al hacer click en ver caso
 */
export default function VirtualizedCaseList({
  casos,
  plazosInfo = new Map(),
  onViewCase,
}: {
  casos: CaseLike[];
  plazosInfo?: Map<string, { alerta_urgencia?: string; dias_restantes?: number | null }>;
  onViewCase?: (caso: CaseLike) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Configuración del virtualizador
  const virtualizer = useVirtualizer({
    count: casos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Altura estimada por item
    overscan: 5, // Renderizar 5 items extra fuera del viewport
  });

  // Memoizar los items virtuales para evitar re-cálculos
  const virtualItems = useMemo(
    () => virtualizer.getVirtualItems(),
    [virtualizer],
  );

  const totalSize = virtualizer.getTotalSize();

  // Padding superior para compensar los items renderizados antes del viewport
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;

  // Padding inferior para completar el espacio restante
  const paddingBottom =
    totalSize -
    (virtualItems.length > 0
      ? virtualItems[virtualItems.length - 1]?.end || 0
      : 0);

  // Memoizar el handler de view
  const handleView = useCallback(
    (caso: CaseLike) => {
      onViewCase?.(caso);
    },
    [onViewCase],
  );

  if (!casos || casos.length === 0) {
    return null;
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto custom-scrollbar">
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}

        {virtualItems.map((virtualItem) => {
          const caso = casos[virtualItem.index];
          return (
            <div
              key={caso.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="px-1 py-1">
                <CaseCard
                  caso={caso}
                  plazoInfo={plazosInfo}
                  onView={handleView}
                />
              </div>
            </div>
          );
        })}

        {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
      </div>
    </div>
  );
}
