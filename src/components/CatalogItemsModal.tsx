import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus } from 'lucide-react';
import { CatalogItem } from '@/hooks/useCatalogItems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInventoryStock } from '@/hooks/useInventoryStock';

interface CatalogItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CatalogItem[];
  onUpdateItems?: () => void;
}

export const CatalogItemsModal = ({ isOpen, onClose, items, onUpdateItems }: CatalogItemsModalProps) => {
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'unidad',
    icon: '🛏️'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const { data: inventoryStock = [] } = useInventoryStock();

  const handleSaveItem = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      if (isAddingNew) {
        const { data, error } = await supabase.from('catalog_items').insert({
          name: formData.name,
          unit: formData.unit,
          icon: formData.icon
        }).select().single();
        if (error) throw error;
        // Crear registro en inventory_stock con stock 0
        if (data && data.id) {
          const { error: stockError } = await supabase.from('inventory_stock').insert({
            catalog_item_id: data.id,
            total_stock: 0,
            available_stock: 0,
            in_use_stock: 0,
            dirty_stock: 0
          });
          if (stockError) throw stockError;
        }
        toast({ title: 'Item agregado', description: 'El item fue agregado correctamente.' });
      } else if (editingItem) {
        const { error } = await supabase.from('catalog_items').update({
          name: formData.name,
          unit: formData.unit,
          icon: formData.icon
        }).eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Item actualizado', description: 'El item fue editado correctamente.' });
      }
      if (onUpdateItems) onUpdateItems();
      resetForm();
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar el item', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('catalog_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Item eliminado', description: 'El item fue eliminado correctamente.' });
      if (onUpdateItems) onUpdateItems();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar el item', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      icon: item.icon
    });
    setIsAddingNew(false);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setFormData({ name: '', unit: 'unidad', icon: '🛏️' });
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'unidad', icon: '🛏️' });
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const availableIcons = ['🛏️', '🛁', '👘', '🧴', '🧽', '🏨'];

  // Helper para obtener el stock de un item
  const getStock = (itemId: string) => {
    const stock = inventoryStock.find(s => s.catalog_item_id === itemId);
    return stock ? stock.available_stock : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-4xl w-full max-h-[80vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Gestión del Catálogo</DialogTitle>
        </DialogHeader>

        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Items Registrados</h3>
            <Button 
              onClick={handleAddNew}
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Nuevo Item
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Unidad</TableHead>
                  <TableHead className="hidden sm:table-cell">Stock</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{item.unit}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{getStock(item.id)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={formOpen} onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-[90vw] sm:max-w-md w-full rounded-xl">
            <DialogHeader>
              <DialogTitle>{isAddingNew ? 'Agregar Nuevo Item' : 'Editar Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="itemName">Nombre del Item</Label>
                <Input
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sábana bajera matrimonial"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="itemUnit">Unidad de Medida</Label>
                <Input
                  id="itemUnit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ej: unidad, par, juego"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Icono</Label>
                <div className="flex gap-2 mt-2">
                  {availableIcons.map((icon) => (
                    <Button
                      key={icon}
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                      className="text-lg"
                      disabled={loading}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveItem} disabled={!formData.name.trim() || loading}>
                {isAddingNew ? 'Agregar' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
