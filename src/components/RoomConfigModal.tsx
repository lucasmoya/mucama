import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { CatalogItem } from '@/hooks/useCatalogItems';
import { useRooms, Room as DBRoom } from '@/hooks/useRooms';
import { useToast } from '@/hooks/use-toast';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle, DialogFooter as ConfirmDialogFooter } from '@/components/ui/dialog';
import { useRoomLinenConfig } from '@/hooks/useRoomLinenConfig';

interface RoomLinenAssignment {
  roomId: string;
  itemId: string;
  quantity: number;
}

interface RoomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItems: CatalogItem[];
}

export const RoomConfigModal = ({ isOpen, onClose, catalogItems }: RoomConfigModalProps) => {
  const { rooms, loading, error, addRoom, adding, updateRoom, updating, deleteRoom, deleting, refetch } = useRooms();
  const { toast } = useToast();
  const { linenConfig, loading: linenLoading, setLinenQuantity, updating: linenUpdating, refetch: refetchLinen } = useRoomLinenConfig();

  const [selectedRoom, setSelectedRoom] = useState<DBRoom | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState<Partial<DBRoom>>({
    name: '',
    type: 'matrimonial',
    capacity: 2,
    status: 'libre',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setExpandedRoomId(null);
  }, [isOpen]);

  const handleSaveRoom = async () => {
    if (!roomForm.name?.trim() || !roomForm.type || !roomForm.capacity) return;
    try {
      if (isAddingRoom) {
        await addRoom({
          name: roomForm.name!,
          type: roomForm.type!,
          capacity: roomForm.capacity!,
          status: roomForm.status || 'libre',
        });
        toast({ title: 'Habitación agregada', description: 'La habitación fue agregada correctamente.' });
      } else if (selectedRoom) {
        await updateRoom({
          id: selectedRoom.id,
          name: roomForm.name!,
          type: roomForm.type!,
          capacity: roomForm.capacity!,
          status: roomForm.status || 'libre',
        });
        toast({ title: 'Habitación actualizada', description: 'La habitación fue editada correctamente.' });
      }
      resetRoomForm();
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar la habitación', variant: 'destructive' });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteRoom(confirmDeleteId);
      toast({ title: 'Habitación eliminada', description: 'La habitación fue eliminada correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar la habitación', variant: 'destructive' });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEditRoom = (room: DBRoom) => {
    setSelectedRoom(room);
    setRoomForm({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      status: room.status,
    });
    setIsAddingRoom(false);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setIsAddingRoom(true);
    setSelectedRoom(null);
    setRoomForm({ name: '', type: 'matrimonial', capacity: 2, status: 'libre' });
    setFormOpen(true);
  };

  const resetRoomForm = () => {
    setRoomForm({ name: '', type: 'matrimonial', capacity: 2, status: 'libre' });
    setSelectedRoom(null);
    setIsAddingRoom(false);
  };

  const getLinenQuantity = (roomId: string, itemId: string) => {
    const assignment = linenConfig.find(
      a => a.room_id === roomId && a.catalog_item_id === itemId
    );
    return assignment?.quantity || 0;
  };

  const getRoomLinenSummary = (roomId: string) => {
    return linenConfig
      .filter(a => a.room_id === roomId && a.quantity > 0)
      .map(a => {
        const item = catalogItems.find(i => i.id === a.catalog_item_id);
        return item ? { ...item, quantity: a.quantity } : null;
      })
      .filter(Boolean) as (CatalogItem & { quantity: number })[];
  };

  const getRoomLinenTotal = (roomId: string) => {
    return linenConfig
      .filter(a => a.room_id === roomId)
      .reduce((acc, a) => acc + a.quantity, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🏨 Configuración de Habitaciones</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms">Habitaciones</TabsTrigger>
            <TabsTrigger value="linen">Asignación de Ropa</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Habitaciones Registradas</h3>
                <Button 
                  onClick={handleAddNew}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Habitación
                </Button>
              </div>

              <div className="space-y-3">
                {rooms?.map((room) => (
                  <Card key={room.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Home className="h-5 w-5 text-blue-600 mt-1" />
                          <div>
                            <h4 className="font-semibold">{room.name}</h4>
                            <p className="text-sm text-gray-600">{room.type}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">Capacidad: {room.capacity}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Dialog open={formOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) resetRoomForm();
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{isAddingRoom ? 'Agregar Nueva Habitación' : 'Editar Habitación'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="roomName">Nombre de la Habitación</Label>
                    <Input
                      id="roomName"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                      placeholder="Ej: Habitación 101, Suite Presidencial"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de Habitación</Label>
                    <select
                      id="type"
                      value={roomForm.type || 'matrimonial'}
                      onChange={e => setRoomForm({ ...roomForm, type: e.target.value as DBRoom['type'] })}
                      className="w-full border rounded px-3 py-2 mt-1"
                      disabled={adding || updating}
                    >
                      <option value="matrimonial">Matrimonial</option>
                      <option value="individual">Individual</option>
                      <option value="doble">Doble</option>
                      <option value="suite">Suite</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacidad (personas)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 2 })}
                      min={1}
                      max={10}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleSaveRoom} 
                    disabled={!roomForm.name?.trim() || !roomForm.type || !roomForm.capacity}
                  >
                    {isAddingRoom ? 'Agregar' : 'Guardar'}
                  </Button>
                  <Button variant="outline" onClick={() => setFormOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="linen" className="space-y-6">
            {rooms?.map((room) => {
              const linenSummary = getRoomLinenSummary(room.id);
              const totalLinen = getRoomLinenTotal(room.id);
              const isExpanded = expandedRoomId === room.id;
              return (
                <Card key={room.id} className="transition-shadow">
                  <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer"
                    onClick={() => {
                      setExpandedRoomId(prev => (prev === room.id ? null : room.id));
                    }}
                  >
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        {room.name}
                        <Badge variant="outline">{room.type}</Badge>
                        <span className="ml-2 text-gray-500 text-sm">Capacidad: {room.capacity}</span>
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{linenSummary.length} tipos de ropa</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation();
                          setExpandedRoomId(prev => (prev === room.id ? null : room.id));
                        }}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <div className="font-semibold mb-1">Configuración de Ropa Blanca:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {linenSummary.length === 0 && <span className="text-gray-400 text-sm">Sin asignación</span>}
                        {linenSummary.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1">
                            <span className="flex items-center gap-2"><span className="text-lg">{item.icon}</span> {item.name}</span>
                            <span className="font-bold">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-600">Total items por limpieza: <span className="font-bold">{totalLinen} unidades</span></div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        <div className="font-semibold mb-2">Editar Asignación de Ropa</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {catalogItems.map((item) => {
                            const currentQuantity = getLinenQuantity(room.id, item.id);
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{item.icon}</span>
                                  <div>
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.unit}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLinenQuantity(room.id, item.id, Math.max(0, currentQuantity - 1))}
                                    disabled={currentQuantity === 0}
                                  >
                                    -
                                  </Button>
                                  <span className="mx-2 font-medium">{currentQuantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLinenQuantity(room.id, item.id, currentQuantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        <ConfirmDialog open={!!confirmDeleteId} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
          <ConfirmDialogContent>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>¿Eliminar habitación?</ConfirmDialogTitle>
            </ConfirmDialogHeader>
            <div className="py-2">¿Estás seguro de que deseas eliminar esta habitación? Esta acción no se puede deshacer.</div>
            <ConfirmDialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
            </ConfirmDialogFooter>
          </ConfirmDialogContent>
        </ConfirmDialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
