import { useSearchParams } from 'react-router-dom';
import SeguimientoPage from './SeguimientoPage';

export default function SeguimientoWrapper() {
  const [params] = useSearchParams();
  const casoId = params.get('caso');

  return <SeguimientoPage casoId={casoId} showExport />;
}
