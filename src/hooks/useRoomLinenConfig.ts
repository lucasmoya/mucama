import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface RoomLinenConfig {
  room_id: string;
  catalog_item_id: string;
  quantity: number;
  created_at?: string;
}

export const useRoomLinenConfig = () => {
  const { data: linenConfig = [], isLoading, error, refetch } = useSupabaseQuery<RoomLinenConfig[]>(
    ['room-linen-config'],
    async () => {
      const { data, error } = await supabase
        .from('room_linen_config')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  );

  // Mutación para setear cantidad (add/update/delete)
  const mutation = useSupabaseMutation(
    async (params: { roomId: string; catalogItemId: string; quantity: number }) => {
      const { roomId, catalogItemId, quantity } = params;
      if (quantity === 0) {
        // Eliminar si existe
        await supabase
          .from('room_linen_config')
          .delete()
          .eq('room_id', roomId)
          .eq('catalog_item_id', catalogItemId);
        return true;
      }
      // Buscar si ya existe
      const { data: existing } = await supabase
        .from('room_linen_config')
        .select('room_id, catalog_item_id')
        .eq('room_id', roomId)
        .eq('catalog_item_id', catalogItemId)
        .single();
      if (existing) {
        // Update
        await supabase
          .from('room_linen_config')
          .update({ quantity })
          .eq('room_id', roomId)
          .eq('catalog_item_id', catalogItemId);
      } else {
        // Insert
        await supabase
          .from('room_linen_config')
          .insert({ room_id: roomId, catalog_item_id: catalogItemId, quantity });
      }
      return true;
    },
    { invalidateQueries: [['room-linen-config']] }
  );

  const setLinenQuantity = async (roomId: string, catalogItemId: string, quantity: number) => {
    return mutation.mutateAsync({ roomId, catalogItemId, quantity });
  };

  return {
    linenConfig,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    setLinenQuantity,
    updating: mutation.isPending,
  };
}; 