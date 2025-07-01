import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// Hook para obtener datos con autenticación
export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: key,
    queryFn,
    enabled: !!user && (options?.enabled !== false),
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutos por defecto
    gcTime: options?.gcTime || 10 * 60 * 1000, // 10 minutos por defecto
  });
};

// Hook para mutaciones con autenticación
export const useSupabaseMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
};

// Hook para obtener el cliente de Supabase autenticado
export const useSupabaseClient = () => {
  const { user } = useAuth();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  return supabase;
}; 