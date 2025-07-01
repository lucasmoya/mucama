import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-purple-900 mb-2">
          Cargando...
        </h2>
        <p className="text-purple-700">
          Verificando autenticación
        </p>
      </div>
    </div>
  );
}; 