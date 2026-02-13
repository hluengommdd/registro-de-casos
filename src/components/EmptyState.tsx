import { memo } from 'react';
import { Link } from 'react-router-dom';

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

type Action = {
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: Action;
  actionLabel?: string;
  className?: string;
};

/**
 * Componente base para estados vacíos
 * Proporciona UX consistente cuando no hay datos
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel = 'Ir a inicio',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link to={action.href} className="btn-primary px-6 py-2">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary px-6 py-2">
            {actionLabel}
          </button>
        ))}
    </div>
  );
});

/**
 * Empty state para casos
 */
export function EmptyCasesState({
  filter = 'all',
  onClearFilter,
}: {
  filter?: 'all' | 'active' | 'closed' | 'search';
  onClearFilter?: () => void;
}) {
  const content = {
    all: {
      icon: 'FileX',
      title: 'No hay casos registrados',
      description:
        'Los casos de convivencia escolar aparecerán aquí cuando se creen.',
    },
    active: {
      icon: 'FolderOpen',
      title: 'No hay casos activos',
      description: 'No hay casos abiertos en este momento.',
    },
    closed: {
      icon: 'Archive',
      title: 'No hay casos cerrados',
      description: 'Los casos cerrados aparecerán aquí.',
    },
    search: {
      icon: 'SearchX',
      title: 'No se encontraron resultados',
      description: 'Intenta con otros términos de búsqueda.',
    },
  };

  const current = content[filter] || content.all;

  return (
    <EmptyState
      icon={getIcon(current.icon)}
      title={current.title}
      description={current.description}
      action={filter !== 'all' ? { onClick: onClearFilter } : undefined}
      actionLabel={filter !== 'all' ? 'Limpiar filtro' : undefined}
    />
  );
}

/**
 * Empty state para estudiantes
 */
export function EmptyStudentsState() {
  return (
    <EmptyState
      icon={getIcon('Users')}
      title="No hay estudiantes involucrados"
      description="Los estudiantes aparecerán cuando agregues involucrados al caso."
    />
  );
}

/**
 * Empty state para seguimientos
 */
export function EmptyFollowUpsState() {
  return (
    <EmptyState
      icon={getIcon('MessageSquare')}
      title="Sin seguimientos"
      description="Los seguimientos del caso aparecerán aquí."
    />
  );
}

/**
 * Empty state para búsquedas
 */
export function EmptySearchState({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={getIcon('SearchX')}
      title="Sin resultados"
      description="No se encontraron elementos que coincidan con tu búsqueda."
      action={onClear ? { onClick: onClear } : undefined}
      actionLabel="Limpiar búsqueda"
    />
  );
}

/**
 * Empty state genérico para listas
 */
export function EmptyListState({
  title = 'No hay elementos',
  description,
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      icon={getIcon('Inbox')}
      title={title}
      description={description}
      action={onAction ? { onClick: onAction } : undefined}
      actionLabel={actionLabel}
    />
  );
}

// Map icon names to lucide-react components
function getIcon(name: string): IconComponent {
  const icons = {
    FileX: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    FolderOpen: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
        />
      </svg>
    ),
    Archive: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    ),
    SearchX: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    Users: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    MessageSquare: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    Inbox: ({ className, ...props }) => (
      <svg
        className={className}
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    ),
  };
  return icons[name] || icons.Inbox;
}

export default EmptyState;
