export default function InlineError({ title = 'Error', message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm mt-1">{message || 'No se pudo cargar la información.'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
