import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCatalogItems } from '@/hooks/useCatalogItems';
import { useInventoryStock } from '@/hooks/useInventoryStock';
import { useRooms } from '@/hooks/useRooms';
import { useRoomLinenConfig } from '@/hooks/useRoomLinenConfig';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InventoryOverviewProps {
  userRole: 'supervisor' | 'mucama';
}

export const InventoryOverview = ({ userRole }: InventoryOverviewProps) => {
  const { items: catalogItems } = useCatalogItems();
  const { data: inventoryStock = [] } = useInventoryStock();
  const { rooms } = useRooms();
  const { linenConfig } = useRoomLinenConfig();
  const [extraDeliveries, setExtraDeliveries] = useState<any[]>([]);

  useEffect(() => {
    // Traer todos los extras no procesados
    const fetchExtras = async () => {
      const { data, error } = await supabase
        .from('extra_deliveries')
        .select('*')
        .eq('processed', false);
      if (!error && data) setExtraDeliveries(data);
    };
    fetchExtras();
  }, []);

  // Mapear catálogo con stock real
  const inventoryData = catalogItems.map(item => {
    const stock = inventoryStock.find(s => s.catalog_item_id === item.id);
    return {
      name: item.name,
      icon: item.icon,
      clean: stock?.available_stock ?? 0,
      inLaundry: stock?.dirty_stock ?? 0,
      pending: stock?.in_use_stock ?? 0,
      total: stock?.total_stock ?? 0,
    };
  });

  // Mostrar warnings en consola para elementos pendientes
  inventoryData.forEach(item => {
    if (item.pending > 0) {
      console.info(`⚠️ ${item.pending} ${item.name} pendientes de llegada`);
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Panel principal
        </h2>
        <Badge variant="outline" className="w-fit">
          {userRole === 'supervisor' ? 'Vista Supervisor' : 'Vista Mucama'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {inventoryData.map((item, index) => (
          <Card key={index} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl sm:text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total: {item.total} unidades
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disponible:</span>
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  {item.clean}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En ropa sucia:</span>
                <Badge variant="secondary" className="text-xs">
                  {item.inLaundry}
                </Badge>
              </div>

              {item.pending > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En uso:</span>
                  <Badge variant="destructive" className="text-xs">
                    {item.pending}
                  </Badge>
                </div>
              )}

              {/* Barra de progreso visual */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(item.clean / item.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((item.clean / item.total) * 100)}% disponible
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Resumen rápido para móvil */}
      <div className="sm:hidden">
        <Card className="p-4 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-2">Resumen Rápido</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Total Disponible:</p>
              <p className="font-bold text-green-600">
                {inventoryData.reduce((sum, item) => sum + item.clean, 0)}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Total en uso:</p>
              <p className="font-bold text-red-600">
                {inventoryData.reduce((sum, item) => sum + item.pending, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tarjetas de habitaciones con ropa en uso */}
      <div className="space-y-6 mt-8">
        {rooms.map(room => {
          // Base: items de room_linen_config
          const base = linenConfig.filter(l => l.room_id === room.id);
          // Extras: items de extra_deliveries no procesados
          const extras = extraDeliveries.filter(e => e.room_id === room.id);
          // Agrupar por catalog_item_id
          const itemsMap: Record<string, { base: number; extra: number }> = {};
          base.forEach(l => {
            itemsMap[l.catalog_item_id] = { base: l.quantity, extra: 0 };
          });
          extras.forEach(e => {
            if (!itemsMap[e.catalog_item_id]) itemsMap[e.catalog_item_id] = { base: 0, extra: 0 };
            itemsMap[e.catalog_item_id].extra += e.quantity;
          });
          // Mostrar solo los que tienen algo en uso
          const items = Object.entries(itemsMap)
            .map(([itemId, val]) => {
              const item = catalogItems.find(i => i.id === itemId);
              return item ? { ...item, base: val.base, extra: val.extra, total: val.base + val.extra } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
          const total = items.reduce((sum, i) => sum + i.total, 0);
          return (
            <Card key={room.id} className="p-6 shadow-md border-2 border-gray-200">
              <div className="mb-4">
                <h4 className="font-bold text-lg">{room.name}</h4>
                <div className="flex gap-2 text-sm text-gray-600">
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{room.type}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded">Capacidad: {room.capacity}</span>
                </div>
              </div>
              <div className="mb-2 font-semibold text-gray-800">Ropa en uso:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                {items.length === 0 && <span className="text-gray-400 text-sm">Sin ropa asignada</span>}
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1">
                    <span className="flex items-center gap-2"><span className="text-lg">{item.icon}</span> {item.name}</span>
                    <span className="font-bold">{item.total}</span>
                    {item.extra > 0 && <Badge variant="secondary" className="ml-2">+{item.extra} extra</Badge>}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-600">Total items en uso: <span className="font-bold">{total} unidades</span></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
