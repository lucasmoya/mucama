import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCatalogItems } from '@/hooks/useCatalogItems';
import { useInventoryStock } from '@/hooks/useInventoryStock';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { PackageCheck, CheckCircle, Hourglass } from 'lucide-react';

export const LaundryReception = () => {
  const [receivedItems, setReceivedItems] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const { items: catalogItems, loading: loadingCatalog, refetch: refetchCatalog } = useCatalogItems();
  const { data: inventoryStock = [], updateStock, updating, refetch: refetchInventory } = useInventoryStock();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Unir catálogo con inventario
  const laundryItems = catalogItems.map(item => {
    const stock = inventoryStock.find(s => s.catalog_item_id === item.id);
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      expected: stock?.dirty_stock ?? 0,
      available: stock?.available_stock ?? 0,
      inventoryId: stock?.id ?? null,
    };
  });

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const handleReceiveLaundry = async () => {
    const totalReceived = Object.values(receivedItems).reduce((sum, qty) => sum + qty, 0);
    if (totalReceived === 0) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos una cantidad recibida",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'Usuario no autenticado', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Actualizar inventario y registrar movimientos
      for (const item of laundryItems) {
        const received = receivedItems[item.id] || 0;
        if (received > 0 && item.inventoryId) {
          // 1. Actualizar inventario
          const stock = inventoryStock.find(s => s.catalog_item_id === item.id);
          const newDirty = Math.max(0, (stock?.dirty_stock ?? 0) - received);
          const newAvailable = (stock?.available_stock ?? 0) + received;
          await supabase.from('inventory_stock').update({
            dirty_stock: newDirty,
            available_stock: newAvailable
          }).eq('id', item.inventoryId);
          // 2. Registrar movimiento
          await supabase.from('inventory_movements').insert({
            catalog_item_id: item.id,
            movement_type: 'reception',
            from_status: 'dirty',
            to_status: 'available',
            quantity: received,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
        }
      }
      toast({
        title: "📦 Ropa recibida registrada",
        description: `Se han registrado ${totalReceived} items recibidos de lavandería`,
      });
      setReceivedItems({});
      if (refetchCatalog) refetchCatalog();
      if (refetchInventory) refetchInventory();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo registrar la recepción', variant: 'destructive' });
    }
    setLoading(false);
  };

  const getTotalExpected = () => laundryItems.reduce((sum, item) => sum + item.expected, 0);
  const getTotalReceived = () => Object.values(receivedItems).reduce((sum, qty) => sum + qty, 0);
  const getTotalPending = () => {
    return laundryItems.reduce((sum, item) => {
      const received = receivedItems[item.id] || 0;
      return sum + Math.max(0, item.expected - received);
    }, 0);
  };

  if (loadingCatalog) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Registra la ropa limpia que llega desde lavandería</p>
      </div>
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esperado</p>
                <p className="text-xl font-bold text-blue-600">{getTotalExpected()}</p>
              </div>
              <PackageCheck className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recibido</p>
                <p className="text-xl font-bold text-green-600">{getTotalReceived()}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendiente</p>
                <p className="text-xl font-bold text-orange-600">{getTotalPending()}</p>
              </div>
              <Hourglass className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de recepción */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Llegada</CardTitle>
            <CardDescription>
              Ingresa las cantidades recibidas para cada tipo de ropa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {laundryItems.map((item) => {
              const received = receivedItems[item.id] || 0;
              const pending = item.expected - received;
              
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center space-x-2">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Label>
                    <Badge variant={pending > 0 ? "secondary" : "default"}>
                      En lavandería: {item.expected}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max={item.expected}
                      placeholder="0"
                      value={receivedItems[item.id] || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="flex-1"
                      disabled={loading}
                    />
                    {pending > 0 && received > 0 && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Pendiente: {pending}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            
            <Button 
              onClick={handleReceiveLaundry}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={loading || updating}
            >
              {loading ? 'Procesando...' : '📦 Registrar Recepción'}
            </Button>
          </CardContent>
        </Card>

        {/* Estado actual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Entrega</CardTitle>
            <CardDescription>
              Comparación entre lo esperado y lo recibido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {laundryItems.map((item) => {
                const received = receivedItems[item.id] || 0;
                const pending = item.expected - received;
                const percentage = item.expected > 0 ? (received / item.expected) * 100 : 0;
                
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {received}/{item.expected}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentage === 100 ? 'bg-green-500' : 
                          percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    {pending > 0 && received > 0 && (
                      <p className="text-xs text-orange-600">
                        ⚠️ Faltan {pending} unidades por llegar
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
