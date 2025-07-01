export interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  icon: string;
  stock?: number; // opcional, para mostrar stock si se consulta con join
}

import { useSupabaseQuery } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export const useCatalogItems = () => {
  const { data: items = [], isLoading, error, refetch } = useSupabaseQuery<CatalogItem[]>(
    ['catalog-items'],
    async () => {
      const { data, error } = await supabase
        .from('catalog_items')
        .select(`
          *,
          inventory_stock(available_stock)
        `);

      if (error) throw error;
      
      return data?.map(item => ({
        ...item,
        stock: item.inventory_stock?.available_stock ?? 0
      })) || [];
    }
  );

  return { 
    items, 
    loading: isLoading, 
    error: error?.message || null, 
    refetch 
  };
};
