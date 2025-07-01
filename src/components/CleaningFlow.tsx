import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRooms } from '@/hooks/useRooms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { BedDouble } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

export const CleaningFlow = () => {
  const { rooms } = useRooms();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user } = useAuth();
  const [loadingClean, setLoadingClean] = useState(false);

  // Leer estado de limpieza de localStorage
  const getCleanedRooms = () => {
    const raw = localStorage.getItem('cleanedRooms');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, number>;
    } catch {
      return {};
    }
  };
  const [cleanedRooms, setCleanedRooms] = useState<Record<string, number>>(getCleanedRooms());

  // Limpiar habitaciones expiradas
  useEffect(() => {
    const now = Date.now();
    const updated: Record<string, number> = {};
    Object.entries(cleanedRooms).forEach(([roomId, ts]) => {
      if (now - ts < 12 * 60 * 60 * 1000) {
        updated[roomId] = ts;
      }
    });
    if (Object.keys(updated).length !== Object.keys(cleanedRooms).length) {
      setCleanedRooms(updated);
      localStorage.setItem('cleanedRooms', JSON.stringify(updated));
    }
  }, [cleanedRooms]);

  // Abrir modal al seleccionar tarjeta
  const handleCardClick = (roomId: string) => {
    setSelectedRoom(roomId);
    setConfirmOpen(true);
  };

  // Confirmar limpieza
  const handleConfirmClean = async () => {
    if (!selectedRoom || !user) return;
    setLoadingClean(true);
    // Lógica local (localStorage)
    const now = Date.now();
    const updated = { ...cleanedRooms, [selectedRoom]: now };
    setCleanedRooms(updated);
    localStorage.setItem('cleanedRooms', JSON.stringify(updated));
    // Llamar función mark_room_clean en Supabase
    const { error } = await supabase.rpc('mark_room_clean', {
      p_room_id: selectedRoom,
      p_user_id: user.id
    });
    if (error) {
      toast({ title: 'Error al registrar limpieza', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🧹 Habitación marcada como limpia', description: 'La habitación ha sido registrada como limpia y el inventario actualizado.' });
    }
    setLoadingClean(false);
    setConfirmOpen(false);
    setSelectedRoom(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Selecciona una habitación para marcarla como limpia</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map(room => {
          const cleanedAt = cleanedRooms[room.id];
          const isClean = cleanedAt && (Date.now() - cleanedAt < 12 * 60 * 60 * 1000);
          return (
            <Card
              key={room.id}
              className={`cursor-pointer transition-shadow relative ${isClean ? 'border-green-500 bg-green-50' : 'hover:shadow-lg'}`}
              onClick={() => handleCardClick(room.id)}
            >
              <CardContent className="p-6 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <BedDouble className="w-6 h-6 text-blue-500" />
                    <div>
                    <h4 className="font-semibold text-lg">{room.name}</h4>
                      <p className="text-sm text-gray-600">{room.type}</p>
                    <Badge variant="outline" className="mt-1">Capacidad: {room.capacity}</Badge>
                  </div>
                  {isClean && (
                    <CheckCircle className="text-green-600 ml-auto" size={28} />
                  )}
              </div>
                {isClean && (
                  <div className="text-green-700 text-xs mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Marcada como limpia hace {Math.floor((Date.now() - cleanedAt) / (60 * 60 * 1000))}h
                  </div>
                )}
            </CardContent>
          </Card>
          );
        })}
      </div>
      <Dialog open={confirmOpen} onOpenChange={open => { if (!open) setConfirmOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar limpieza?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            ¿Estás segura de que quieres marcar la habitación <b>{rooms?.find(r => r.id === selectedRoom)?.name}</b> como limpia?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmClean} disabled={loadingClean}>
              {loadingClean ? 'Procesando...' : 'Confirmar limpieza'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
