import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryStock {
  id: string;
  catalog_item_id: string;
  total_stock: number;
  available_stock: number;
  in_use_stock: number;
  dirty_stock: number;
  updated_at: string | null;
}

export const useInventoryStock = () => {
  const query = useSupabaseQuery<InventoryStock[]>(
    ['inventory-stock'],
    async () => {
      const { data, error } = await supabase
        .from('inventory_stock')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  );

  const mutation = useSupabaseMutation(
    async (updates: { id: string; total_stock: number; available_stock: number }[]) => {
      // Actualizar cada item individualmente
      for (const update of updates) {
        const { error } = await supabase
          .from('inventory_stock')
          .update({
            total_stock: update.total_stock,
            available_stock: update.available_stock,
          })
          .eq('id', update.id);
        if (error) throw error;
      }
      return true;
    },
    {
      invalidateQueries: [['inventory-stock']]
    }
  );

  return {
    ...query,
    updateStock: mutation.mutateAsync,
    updating: mutation.isPending,
  };
}; 