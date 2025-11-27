import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log detallado del error para debugging
    console.error('🚨 [ERROR_BOUNDARY] Error capturado:', error);
    console.error('🚨 [ERROR_BOUNDARY] Error message:', error.message);
    console.error('🚨 [ERROR_BOUNDARY] Error stack:', error.stack);
    console.error('🚨 [ERROR_BOUNDARY] Component stack:', errorInfo.componentStack);
    
    // Guardar información adicional en el estado
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              🚨 Error en el Componente Inventory
            </h1>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800">Mensaje del Error:</h3>
                <p className="text-red-600 font-mono text-sm bg-red-50 p-2 rounded">
                  {this.state.error?.message || 'Error desconocido'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800">Stack Trace:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </div>
              
              {this.state.errorInfo?.componentStack && (
                <div>
                  <h3 className="font-semibold text-gray-800">Component Stack:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Recargar Página
                </button>
                <button 
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Intentar de Nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;