import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CatalogItemsModal } from '@/components/CatalogItemsModal';
import { RoomConfigModal } from '@/components/RoomConfigModal';
import { StockInitialModal } from '@/components/StockInitialModal';
import { useCatalogItems, CatalogItem } from '@/hooks/useCatalogItems';
import { useRooms } from '@/hooks/useRooms';
import { useInventoryStock } from '@/hooks/useInventoryStock';
import {
  ClipboardList,
  BedDouble,
  Package,
  Users,
  BarChart2,
  Settings,
} from 'lucide-react';

// Tipo extendido solo para el modal de stock inicial
interface CatalogItemWithStock extends CatalogItem {
  totalStock: number;
  inventoryStockId: string | null;
}

export const ConfigurationPanel = () => {
  // Estado para modales
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { items: catalogItems, loading: itemsLoading, refetch: refetchCatalog } = useCatalogItems();
  const { rooms, loading: roomsLoading } = useRooms();
  const { data: inventoryStock = [], updateStock, updating } = useInventoryStock();

  // Solo para StockInitialModal
  const catalogWithStock: CatalogItemWithStock[] = catalogItems.map((item) => {
    const stock = inventoryStock.find(s => s.catalog_item_id === item.id);
    return {
      ...item,
      totalStock: stock?.total_stock ?? 0,
      inventoryStockId: stock?.id ?? null,
    };
  });

  const configSections = [
    {
      title: 'Catálogo de Items',
      description: 'Gestión de tipos de ropa blanca',
      icon: <ClipboardList className="w-6 h-6 text-blue-500" />,
      action: 'Editar Catálogo',
      modalKey: 'catalog'
    },
    {
      title: 'Configuración de Habitaciones',
      description: 'Tipos de cama y asignación de ropa',
      icon: <BedDouble className="w-6 h-6 text-purple-500" />,
      action: 'Gestionar Habitaciones',
      modalKey: 'rooms'
    },
    {
      title: 'Stock Inicial',
      description: 'Registro de inventario base',
      icon: <Package className="w-6 h-6 text-orange-500" />,
      action: 'Actualizar Stock',
      modalKey: 'stock'
    },
    {
      title: 'Usuarios del Sistema',
      description: 'Mucamas y supervisores',
      icon: <Users className="w-6 h-6 text-green-500" />,
      action: 'Gestionar Usuarios',
      modalKey: 'users'
    },
    {
      title: 'Reportes y Exportación',
      description: 'Generar informes del sistema',
      icon: <BarChart2 className="w-6 h-6 text-indigo-500" />,
      action: 'Ver Reportes',
      modalKey: 'reports'
    },
    {
      title: 'Configuración General',
      description: 'Ajustes del sistema',
      icon: <Settings className="w-6 h-6 text-gray-500" />,
      action: 'Configurar',
      modalKey: 'general'
    }
  ];

  const handleSectionClick = (modalKey: string) => {
    if (['catalog', 'rooms', 'stock'].includes(modalKey)) {
      setActiveModal(modalKey);
    } else {
      // Para las otras secciones, mostrar un mensaje temporal
      alert(`Funcionalidad "${modalKey}" en desarrollo`);
    }
  };

  if (itemsLoading || roomsLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Gestión y configuración del sistema de ropa blanca</p>
      </div>

      {/* Secciones de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configSections.map((section, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div>{section.icon}</div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSectionClick(section.modalKey)}
              >
                {section.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Catálogo actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Catálogo actual de items</CardTitle>
            <CardDescription>
              Items de ropa blanca registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {catalogItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Unidad: {item.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      Stock: {item.stock ?? 0}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del sistema</CardTitle>
            <CardDescription>
              Información general y estadísticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{rooms.length}</p>
                <p className="text-sm text-gray-600">Habitaciones Configuradas</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{catalogItems.length}</p>
                <p className="text-sm text-gray-600">Items en Catálogo</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {catalogItems.reduce((sum, item) => sum + (item.stock ?? 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Stock Total</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">4</p>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Acciones Rápidas</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  📤 Exportar datos del día
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🔄 Sincronizar inventario
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📋 Generar reporte semanal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <CatalogItemsModal
        isOpen={activeModal === 'catalog'}
        onClose={() => setActiveModal(null)}
        items={catalogItems}
        onUpdateItems={refetchCatalog as any}
      />

      <RoomConfigModal
        isOpen={activeModal === 'rooms'}
        onClose={() => setActiveModal(null)}
        catalogItems={catalogItems}
      />

      <StockInitialModal
        isOpen={activeModal === 'stock'}
        onClose={() => setActiveModal(null)}
        catalogItems={catalogWithStock}
        onUpdateStock={async (updatedItems) => {
          // Solo actualizar los que tengan id de inventoryStock
          const updates = updatedItems
            .filter(i => i.inventoryStockId)
            .map(i => ({
              id: i.inventoryStockId!,
              total_stock: i.totalStock,
              available_stock: i.totalStock, // por ahora igual al total
            }));
          if (updates.length > 0) {
            await updateStock(updates);
          }
        }}
        updating={updating}
      />
    </div>
  );
};
