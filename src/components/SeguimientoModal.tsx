import { useMemo } from 'react';
import ModalShell from './ModalShell';
import SeguimientoPage from '../pages/SeguimientoPage';
import { getStudentName } from '../utils/studentName';

export default function SeguimientoModal({ caso, onClose }) {
  const title = useMemo(
    () => getStudentName(caso?.students, 'Caso cerrado'),
    [caso],
  );

  const subtitle = useMemo(() => {
    if (!caso) return '';
    const tip = caso.conduct_type || '';
    const curso = caso.course_incident || '';
    const fecha = caso.incident_date || '';
    return [tip, curso, fecha].filter(Boolean).join(' • ');
  }, [caso]);

  if (!caso) return null;

  return (
    <ModalShell title={title} subtitle={subtitle} onClose={onClose} size="xl">
      <div className="bg-white">
        <SeguimientoPage casoId={caso.id} readOnly />
      </div>
    </ModalShell>
  );
}
