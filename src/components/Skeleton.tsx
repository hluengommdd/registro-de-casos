import { memo } from 'react';

type SkeletonVariant = 'rectangular' | 'circular' | 'text';
type SkeletonAnimation = 'pulse' | 'wave' | 'none';

type SkeletonProps = {
  className?: string;
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: SkeletonAnimation;
};

/**
 * Skeleton base para estados de carga
 * Animación pulse optimizada para reduced motion
 */
export const Skeleton = memo(function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-slate-200 dark:bg-slate-700';

  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const animationClasses =
    animation === 'pulse'
      ? 'animate-pulse'
      : animation === 'wave'
        ? 'skeleton-wave'
        : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});

/**
 * Skeleton para tarjeta de caso
 */
export function CaseCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton width="60%" height="20px" />
        <Skeleton variant="circular" width="32px" height="32px" />
      </div>
      <Skeleton width="40%" height="14px" />
      <div className="flex gap-2">
        <Skeleton width="80px" height="24px" />
        <Skeleton width="100px" height="24px" />
      </div>
      <div className="pt-2 border-t border-slate-100">
        <Skeleton width="60%" height="14px" />
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de casos
 */
export function CaseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CaseCardSkeleton key={`case-${i}`} />
      ))}
    </div>
  );
}

/**
 * Skeleton para estadísticas
 */
export function StatCardSkeleton() {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width="48px" height="48px" />
        <Skeleton width="60px" height="24px" />
      </div>
      <Skeleton width="40%" height="32px" className="mb-2" />
      <Skeleton width="70%" height="14px" />
    </div>
  );
}

/**
 * Skeleton para tabla de datos
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="16px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para formulario
 */
export function FormSkeleton() {
  return (
    <div className="glass-panel p-6 space-y-4">
      <Skeleton width="30%" height="20px" />
      <Skeleton width="100%" height="40px" />
      <Skeleton width="30%" height="20px" />
      <Skeleton width="100%" height="40px" />
      <Skeleton width="30%" height="20px" />
      <Skeleton width="100%" height="80px" />
      <div className="flex gap-4 pt-4">
        <Skeleton width="120px" height="40px" />
        <Skeleton width="120px" height="40px" />
      </div>
    </div>
  );
}

/**
 * Skeleton para sidebar
 */
export function SidebarSkeleton() {
  const navItems = Array.from({ length: 8 });
  return (
    <div className="w-64 h-full glass-panel p-4 space-y-3">
      {navItems.map((_, i) => (
        <div key={`nav-${i}`} className="flex items-center gap-3">
          <Skeleton variant="circular" width="20px" height="20px" />
          <Skeleton width="60%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
