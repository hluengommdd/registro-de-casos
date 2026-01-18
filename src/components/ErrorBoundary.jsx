import React from 'react'
import { emitToast } from './toastBus'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado:', error, errorInfo)
    this.setState({ error, errorInfo })
    emitToast({
      type: 'error',
      title: 'Error en la aplicación',
      message: error?.message || 'Ha ocurrido un error inesperado',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-red-900 mb-4">
            Error en la aplicación
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-red-700 font-semibold">
              {this.state.error?.toString()}
            </p>
            <details className="text-red-600">
              <summary className="cursor-pointer font-medium">
                Ver detalles
              </summary>
              <pre className="mt-2 p-4 bg-white rounded overflow-auto text-xs">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
