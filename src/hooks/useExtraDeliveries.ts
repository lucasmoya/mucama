import { useSupabaseMutation, useSupabaseQuery } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useExtraDeliveries = () => {
  const { toast } = useToast();

  const createDeliveryMutation = useSupabaseMutation(
    async (data: { roomId: string; items: { catalogItemId: string; quantity: number }[] }) => {
      const { roomId, items } = data;
      
      const deliveries = items.map(item => ({
        room_id: roomId,
        catalog_item_id: item.catalogItemId,
        quantity: item.quantity,
        reason: 'Solicitud huésped'
      }));

      const { error } = await supabase
        .from('extra_deliveries')
        .insert(deliveries);

      if (error) throw error;

      // También crear movimientos de inventario
      const movements = items.map(item => ({
        catalog_item_id: item.catalogItemId,
        room_id: roomId,
        movement_type: 'entrega_extra',
        quantity: -item.quantity, // Negativo porque sale del inventario
        from_status: 'disponible',
        to_status: 'en_uso'
      }));

      await supabase
        .from('inventory_movements')
        .insert(movements);

      // Actualizar stock disponible
      for (const item of items) {
        const { data: currentStock } = await supabase
          .from('inventory_stock')
          .select('available_stock, in_use_stock')
          .eq('catalog_item_id', item.catalogItemId)
          .single();

        if (currentStock) {
          await supabase
            .from('inventory_stock')
            .update({
              available_stock: currentStock.available_stock - item.quantity,
              in_use_stock: currentStock.in_use_stock + item.quantity
            })
            .eq('catalog_item_id', item.catalogItemId);
        }
      }

      return { success: true };
    },
    {
      onSuccess: () => {
        toast({
          title: "Entrega registrada",
          description: "La entrega se ha registrado correctamente",
        });
      },
      onError: (error) => {
        console.error('Error creating delivery:', error);
        toast({
          title: "Error",
          description: "No se pudo registrar la entrega",
          variant: "destructive"
        });
      },
      invalidateQueries: [['extra-deliveries']]
    }
  );

  const { data: recentDeliveries = [], isLoading, error } = useSupabaseQuery(
    ['extra-deliveries'],
    async () => {
      const { data, error } = await supabase
        .from('extra_deliveries')
        .select(`
          *,
          rooms(name),
          catalog_items(name)
        `)
        .order('delivered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  );

  const createDelivery = async (
    roomId: string,
    items: { catalogItemId: string; quantity: number }[]
  ) => {
    return createDeliveryMutation.mutateAsync({ roomId, items });
  };

  return { 
    createDelivery, 
    getRecentDeliveries: () => recentDeliveries,
    loading: isLoading,
    error: error?.message || null
  };
};
