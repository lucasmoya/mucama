import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface Room {
  id: string;
  name: string;
  type: 'matrimonial' | 'individual' | 'doble' | 'suite';
  capacity: number;
  status: 'ocupada' | 'libre' | 'mantenimiento';
}

export const useRooms = () => {
  const { data: rooms = [], isLoading, error, refetch } = useSupabaseQuery<Room[]>(
    ['rooms'],
    async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('id');

      if (error) throw error;
      return data || [];
    }
  );

  // CREATE
  const addRoomMutation = useSupabaseMutation(
    async (room: Omit<Room, 'id'>) => {
      const { id, ...roomData } = room as any;
      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    { invalidateQueries: [['rooms']] }
  );

  // UPDATE
  const updateRoomMutation = useSupabaseMutation(
    async (room: Room) => {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          status: room.status,
        })
        .eq('id', room.id);
      if (error) throw error;
      return true;
    },
    { invalidateQueries: [['rooms']] }
  );

  // DELETE
  const deleteRoomMutation = useSupabaseMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    { invalidateQueries: [['rooms']] }
  );

  return {
    rooms,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    addRoom: addRoomMutation.mutateAsync,
    adding: addRoomMutation.isPending,
    updateRoom: updateRoomMutation.mutateAsync,
    updating: updateRoomMutation.isPending,
    deleteRoom: deleteRoomMutation.mutateAsync,
    deleting: deleteRoomMutation.isPending,
  };
};
