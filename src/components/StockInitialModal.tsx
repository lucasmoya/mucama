import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  icon: string;
  totalStock: number;
  inventoryStockId: string | null;
}

interface StockInitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItems: CatalogItem[];
  onUpdateStock: (items: CatalogItem[]) => Promise<void>;
  updating?: boolean;
}

export const StockInitialModal = ({ isOpen, onClose, catalogItems, onUpdateStock, updating }: StockInitialModalProps) => {
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initial: Record<string, number> = {};
    catalogItems.forEach(item => {
      initial[item.id] = item.totalStock;
    });
    setStockValues(initial);
  }, [catalogItems, isOpen]);

  const handleStockChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setStockValues(prev => ({
      ...prev,
      [itemId]: Math.max(0, numValue)
    }));
  };

  const handleSaveStock = async () => {
    setSaving(true);
    const updatedItems = catalogItems.map(item => ({
      ...item,
      totalStock: stockValues[item.id] ?? 0,
    }));
    try {
      await onUpdateStock(updatedItems);
      toast({
        title: 'Stock actualizado',
        description: 'El stock inicial fue guardado correctamente.',
        variant: 'default',
      });
      onClose();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('Error al actualizar stock:', e);
      toast({
        title: 'Error al guardar',
        description: typeof e === 'string' ? e : (e?.message || JSON.stringify(e)),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTotalStock = () => {
    return Object.values(stockValues).reduce((sum, v) => sum + (v || 0), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!saving) onClose(); }}>
      <DialogContent className="max-w-[90vw] sm:max-w-4xl w-full max-h-[80vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Registro de Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{catalogItems.length}</p>
                  <p className="text-sm text-gray-600">Items en Catálogo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{getTotalStock()}</p>
                  <p className="text-sm text-gray-600">Stock Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.values(stockValues).filter(v => v > 0).length}
                  </p>
                  <p className="text-sm text-gray-600">Items con Stock</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.values(stockValues).filter(v => v === 0).length}
                  </p>
                  <p className="text-sm text-gray-600">Items sin Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de items para stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {item.unit}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`stock-total-${item.id}`} className="text-sm">
                        Total:
                      </Label>
                      <Input
                        id={`stock-total-${item.id}`}
                        type="number"
                        min="0"
                        value={stockValues[item.id] ?? 0}
                        onChange={(e) => handleStockChange(item.id, e.target.value)}
                        className="w-20 text-center"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {catalogItems.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No hay items en el catálogo</p>
                <p className="text-sm">Primero agrega items al catálogo para poder asignar stock inicial</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={updating || saving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveStock} className="gap-2" disabled={updating || saving}>
            <Save className="h-4 w-4" />
            {(updating || saving) ? 'Guardando...' : 'Guardar Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
