import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRooms } from '@/hooks/useRooms';
import { useCatalogItems } from '@/hooks/useCatalogItems';
import { useExtraDeliveries } from '@/hooks/useExtraDeliveries';
import { BedDouble, PlusCircle } from 'lucide-react';

export const ExtraDelivery = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const { toast } = useToast();

  const { rooms, loading: roomsLoading } = useRooms();
  const { items: catalogItems, loading: itemsLoading } = useCatalogItems();
  const { createDelivery, getRecentDeliveries } = useExtraDeliveries();

  useEffect(() => {
    loadRecentDeliveries();
  }, []);

  const loadRecentDeliveries = async () => {
    const deliveries = await getRecentDeliveries();
    setRecentDeliveries(deliveries);
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    setSelectedItems({});
    setIsModalOpen(true);
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    const newSelectedItems = { ...selectedItems };
    if (quantity <= 0) {
      delete newSelectedItems[itemId];
    } else {
      const item = catalogItems.find(i => i.id === itemId);
      if (item && quantity <= (item.stock || 0)) {
        newSelectedItems[itemId] = quantity;
      } else {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${item?.stock || 0} unidades disponibles`,
          variant: "destructive"
        });
        return;
      }
    }
    setSelectedItems(newSelectedItems);
  };

  const handleDelivery = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un artículo",
        variant: "destructive"
      });
      return;
    }

    const itemsToDeliver = Object.entries(selectedItems).map(([catalogItemId, quantity]) => ({
      catalogItemId,
      quantity
    }));

    const result = await createDelivery(selectedRoom, itemsToDeliver);

    if (result.success) {
      const itemNames = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const item = catalogItems.find(i => i.id === itemId);
        return `${quantity} ${item?.name}`;
      }).join(', ');

      toast({
        title: "➕ Entrega registrada",
        description: `${itemNames} entregado(s) a la habitación ${selectedRoom}`,
      });

      // Limpiar selección y cerrar modal
      setSelectedItems({});
      setIsModalOpen(false);
      setSelectedRoom('');
      
      // Recargar entregas recientes
      loadRecentDeliveries();
    }
  };

  const getTotalSelectedItems = () => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  };

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  if (roomsLoading || itemsLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Selecciona una habitación para entregar ropa blanca adicional</p>
      </div>

      {/* Tarjetas de habitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {rooms.map((room) => (
          <Card
            key={room.id}
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => handleRoomSelect(room.id)}
          >
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <BedDouble className="w-6 h-6 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-lg">{room.name}</h4>
                  <p className="text-sm text-gray-600">{room.type}</p>
                  <Badge variant="outline" className="mt-1">Capacidad: {room.capacity}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para selección de artículos */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ➕ Entrega Extra - Habitación {selectedRoom}
            </DialogTitle>
            <DialogDescription>
              {selectedRoomData?.type} • Selecciona los artículos y cantidades a entregar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Artículos Disponibles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <Badge 
                            variant={(item.stock || 0) > 10 ? "default" : (item.stock || 0) > 5 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            Stock: {item.stock || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)}
                        disabled={(selectedItems[item.id] || 0) <= 0}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={item.stock || 0}
                        value={selectedItems[item.id] || 0}
                        onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        className="text-center h-8 w-16"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)}
                        disabled={(selectedItems[item.id] || 0) >= (item.stock || 0)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Entrega abajo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Entrega</CardTitle>
                <CardDescription>Habitación {selectedRoom}</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(selectedItems).length === 0 ? (
                  <p className="text-gray-500 text-sm">No has seleccionado ningún artículo</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedItems).map(([itemId, quantity]) => {
                      const item = catalogItems.find(i => i.id === itemId);
                      return (
                        <div key={itemId} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span>{item?.icon}</span>
                            <span className="text-sm font-medium">{item?.name}</span>
                          </div>
                          <Badge variant="default">{quantity}</Badge>
                        </div>
                      );
                    })}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total artículos:</span>
                        <Badge variant="default">{getTotalSelectedItems()}</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDelivery}
                      className="w-full bg-green-600 hover:bg-green-700 mt-4"
                      size="lg"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" /> Confirmar Entrega
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entregas recientes abajo */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Entregas Recientes</CardTitle>
            <CardDescription>Últimas entregas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDeliveries.slice(0, 4).map((delivery, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Habitación {delivery.room_id}</p>
                    <p className="text-xs text-gray-600">
                      {delivery.quantity} {delivery.catalog_items?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(delivery.delivered_at).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
