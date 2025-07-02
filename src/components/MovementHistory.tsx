import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useCatalogItems } from '@/hooks/useCatalogItems';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from './AuthProvider';
import { Activity, ListChecks, BedDouble, DiamondPlus, Sparkles, PackageCheck, User, Clock, XCircle } from 'lucide-react';

interface MovementHistoryProps {
  userRole: 'supervisor' | 'mucama';
}

// Utilidad para agrupar movimientos por evento principal
function groupMovements(movements, catalogItems, users, rooms) {
  // Agrupar por tipo de evento principal
  const grouped = [];
  const used = new Set();
  for (let i = 0; i < movements.length; i++) {
    if (used.has(movements[i].id)) continue;
    const m = movements[i];
    // Limpieza: collect_dirty/deliver_clean para misma room y timestamp cercano
    if (['collect_dirty', 'deliver_clean'].includes(m.movement_type) && m.room_id) {
      const sameEvent = movements.filter(x =>
        ['collect_dirty', 'deliver_clean'].includes(x.movement_type) &&
        x.room_id === m.room_id &&
        Math.abs(new Date(x.created_at).getTime() - new Date(m.created_at).getTime()) < 5 * 60 * 1000 // 5 min
      );
      sameEvent.forEach(x => used.add(x.id));
      grouped.push({
        type: 'cleaning',
        room: rooms.find(r => r.id === m.room_id),
        user: users[m.user_id] || 'Sin registrar',
        timestamp: m.created_at,
        items: sameEvent.map(ev => ({
          ...ev,
          item: catalogItems.find(ci => ci.id === ev.catalog_item_id)
        }))
      });
      continue;
    }
    // Recepción lavandería
    if (m.movement_type === 'reception') {
      const sameEvent = movements.filter(x =>
        x.movement_type === 'reception' &&
        Math.abs(new Date(x.created_at).getTime() - new Date(m.created_at).getTime()) < 5 * 60 * 1000
      );
      sameEvent.forEach(x => used.add(x.id));
      grouped.push({
        type: 'reception',
        user: users[m.user_id] || 'Sin registrar',
        timestamp: m.created_at,
        items: sameEvent.map(ev => ({
          ...ev,
          item: catalogItems.find(ci => ci.id === ev.catalog_item_id)
        }))
      });
      continue;
    }
    // Entrega extra
    if (m.movement_type === 'entrega_extra') {
      const sameEvent = movements.filter(x =>
        x.movement_type === 'entrega_extra' &&
        x.room_id === m.room_id &&
        Math.abs(new Date(x.created_at).getTime() - new Date(m.created_at).getTime()) < 5 * 60 * 1000
      );
      sameEvent.forEach(x => used.add(x.id));
      grouped.push({
        type: 'extra',
        room: rooms.find(r => r.id === m.room_id),
        user: users[m.user_id] || 'Sin registrar',
        timestamp: m.created_at,
        items: sameEvent.map(ev => ({
          ...ev,
          item: catalogItems.find(ci => ci.id === ev.catalog_item_id)
        }))
      });
      continue;
    }
    // Otros movimientos individuales
    used.add(m.id);
    grouped.push({
      type: m.movement_type,
      user: users[m.user_id] || 'Sin registrar',
      timestamp: m.created_at,
      items: [{ ...m, item: catalogItems.find(ci => ci.id === m.catalog_item_id) }]
    });
  }
  // Ordenar por fecha descendente
  return grouped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MovementHistory = ({ userRole }: MovementHistoryProps) => {
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [movements, setMovements] = useState([]);
  const [users, setUsers] = useState({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const { items: catalogItems } = useCatalogItems();
  const { rooms } = useRooms();

  useEffect(() => {
    // Cargar movimientos reales
    const fetchMovements = async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setMovements(data);
    };
    // Cargar usuarios
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name');
      if (data) {
        const map = {};
        data.forEach(u => { map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim(); });
        setUsers(map);
      }
    };
    fetchMovements();
    fetchUsers();
  }, []);

  // Agrupar movimientos principales
  const grouped = groupMovements(movements, catalogItems, users, rooms);

  // Filtros
  const filtered = grouped.filter(ev => {
    if (filterType !== 'all') {
      if (filterType === 'cleaning' && ev.type !== 'cleaning') return false;
      if (filterType === 'reception' && ev.type !== 'reception') return false;
      if (filterType === 'extra' && ev.type !== 'extra') return false;
      if (filterType === 'damage' && ev.type !== 'damage') return false;
    }
    // Filtro por fecha (solo hoy, semana, mes)
    const now = new Date();
    const evDate = new Date(ev.timestamp);
    if (filterDate === 'today' && (evDate.toDateString() !== now.toDateString())) return false;
    if (filterDate === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      if (evDate < weekAgo) return false;
    }
    if (filterDate === 'month') {
      const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
      if (evDate < monthAgo) return false;
    }
    return true;
  });

  // Estadísticas
  const todayMovements = filtered.filter(ev => {
    const d = new Date(ev.timestamp);
    return d.toDateString() === new Date().toDateString();
  }).length;
  const totalItems = filtered.reduce((sum, ev) => sum + ev.items.reduce((s, i) => s + Math.abs(i.quantity || 0), 0), 0);
  const uniqueRooms = new Set(filtered.filter(ev => ev.room).map(ev => ev.room?.id)).size;

  const getTypeLabel = (type: string) => {
    const types: {[key: string]: string} = {
      'cleaning': 'Limpieza',
      'reception': 'Recepción',
      'extra': 'Entrega Extra',
      'damage': 'Baja/Daño',
    };
    return types[type] || type;
  };
  const getTypeIcon = (type: string) => {
    if (type === 'cleaning') return <Sparkles className="w-5 h-5 text-green-600" />;
    if (type === 'reception') return <PackageCheck className="w-5 h-5 text-blue-500" />;
    if (type === 'extra') return <DiamondPlus className="w-5 h-5 text-yellow-500" />;
    if (type === 'damage') return '❌';
    return '🔄';
  };
  const getTypeColor = (type: string) => {
    if (type === 'cleaning') return 'bg-green-100 text-green-800';
    if (type === 'reception') return 'bg-blue-100 text-blue-800';
    if (type === 'extra') return 'bg-yellow-100 text-yellow-800';
    if (type === 'damage') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">
          {userRole === 'supervisor' 
            ? 'Registro completo de todos los movimientos del sistema'
            : 'Historial de movimientos del día actual'
          }
        </p>
      </div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Movimientos Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{todayMovements}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Items Procesados</p>
                <p className="text-2xl font-bold text-green-600">{totalItems}</p>
              </div>
              <ListChecks className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Habitaciones</p>
                <p className="text-2xl font-bold text-purple-600">{uniqueRooms}</p>
              </div>
              <BedDouble className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Movimiento</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cleaning"><Sparkles className="w-4 h-4 inline mr-1 text-green-600" /> Limpieza</SelectItem>
                  <SelectItem value="reception"><PackageCheck className="w-4 h-4 inline mr-1 text-blue-500" /> Recepción</SelectItem>
                  <SelectItem value="extra"><DiamondPlus className="w-4 h-4 inline mr-1 text-yellow-500" /> Entrega Extra</SelectItem>
                  <SelectItem value="damage"><XCircle className="w-4 h-4 inline mr-1 text-red-500" /> Bajas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Lista de movimientos agrupados y colapsables */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad</CardTitle>
              <CardDescription>
                {filtered.length} movimientos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((ev, idx) => (
                  <div key={idx} className="border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4 p-4 cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>
                      <div className="text-2xl">{getTypeIcon(ev.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">
                              {ev.type === 'cleaning' && ev.room ? `Habitación ${ev.room.name} limpiada` :
                               ev.type === 'reception' ? 'Recepción de lavandería' :
                               ev.type === 'extra' && ev.room ? `Entrega extra Habitación ${ev.room.name}` :
                               getTypeLabel(ev.type)}
                            </h4>
                          <div className="flex items-center space-x-4 mt-2 -ml-8 sm:ml-0">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-4 h-4 inline" /> {ev.user}
                            </span>
                              {ev.room && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <BedDouble className="w-4 h-4 inline" /> Habitación {ev.room.name}
                              </span>
                            )}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4 inline" /> {new Date(ev.timestamp).toLocaleString('es-ES')}
                            </span>
                            </div>
                          </div>
                          <Badge className={getTypeColor(ev.type) + ' hidden sm:inline-flex'}>
                            {getTypeLabel(ev.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* Detalle colapsable */}
                    {expanded === idx && (
                      <div className="bg-gray-50 border-t px-8 py-4">
                        <div className="font-semibold mb-2">Detalle de items:</div>
                        <ul className="space-y-1">
                          {ev.items.map((i, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <span className="text-lg">{i.item?.icon}</span>
                              <span>{i.item?.name}</span>
                              <Badge 
                                variant="outline" 
                                className={
                                  ev.type === 'cleaning' && i.from_status === 'in_use' && i.to_status === 'dirty'
                                    ? 'border-red-300 text-red-600 bg-red-50'
                                    : ''
                                }
                              >
                                {Math.abs(i.quantity)}
                                {ev.type === 'cleaning' && i.from_status === 'in_use' && i.to_status === 'dirty' && (
                                  <span className="ml-1" title="Sale sucia">🧺</span>
                                )}
                                {ev.type === 'cleaning' && i.from_status === 'available' && i.to_status === 'in_use' && (
                                  <span className="ml-1" title="Entra limpia">🛏️</span>
                                )}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
