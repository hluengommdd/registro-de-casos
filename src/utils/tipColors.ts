// Utiles para mapear tipificación a clases de Tailwind (badges y chips)
// NOTA: Estos colores deben coincidir con el Badge component en CaseDetailModal.jsx

export function tipBadgeClasses(tip) {
  switch (String(tip || '').trim()) {
    case 'Leve':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Grave':
      return 'bg-amber-200 text-amber-800 border-amber-300';
    case 'Muy Grave':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Gravísima':
    case 'Gravisima':
    case 'Gravisimo':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function tipChipClasses(tip) {
  switch (String(tip || '').trim()) {
    case 'Leve':
      return 'bg-emerald-100 text-emerald-800';
    case 'Grave':
      return 'bg-amber-200 text-amber-900';
    case 'Muy Grave':
      return 'bg-purple-100 text-purple-800';
    case 'Gravísima':
    case 'Gravisima':
    case 'Gravisimo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function tipHeaderClasses(tip) {
  switch (String(tip || '').trim()) {
    case 'Leve':
      return 'bg-emerald-600 text-white';
    case 'Grave':
      return 'bg-amber-500 text-white';
    case 'Muy Grave':
      return 'bg-violet-600 text-white';
    case 'Gravísima':
    case 'Gravisima':
    case 'Gravisimo':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

// Mapa de colores consistente para reutilizar
export const TIP_COLORS = {
  Leve: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  Grave: {
    bg: 'bg-amber-200',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  'Muy Grave': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  Gravísima: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
};
