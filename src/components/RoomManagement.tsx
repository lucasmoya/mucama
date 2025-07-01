
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoomManagementProps {
  userRole: 'supervisor' | 'mucama';
}

export const RoomManagement = ({ userRole }: RoomManagementProps) => {
  if (userRole !== 'supervisor') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Esta sección está disponible solo para supervisores</p>
      </div>
    );
  }

  // Datos simulados de habitaciones y su configuración
  const roomsConfig = [
    {
      id: '101',
      name: 'Habitación 101',
      type: '1 Matrimonial + 2 Individuales',
      capacity: 4,
      linen: [
        { item: 'Sábana bajera matrimonial', quantity: 1 },
        { item: 'Sábana bajera individual', quantity: 2 },
        { item: 'Cubre plumón doble', quantity: 1 },
        { item: 'Cubre plumón individual', quantity: 2 },
        { item: 'Funda de almohada', quantity: 6 },
        { item: 'Toalla grande', quantity: 4 },
        { item: 'Toalla de mano', quantity: 2 },
      ]
    },
    {
      id: '102',
      name: 'Habitación 102',
      type: '1 Matrimonial',
      capacity: 2,
      linen: [
        { item: 'Sábana bajera matrimonial', quantity: 1 },
        { item: 'Cubre plumón doble', quantity: 1 },
        { item: 'Funda de almohada', quantity: 4 },
        { item: 'Toalla grande', quantity: 2 },
        { item: 'Toalla de mano', quantity: 1 },
      ]
    },
    {
      id: '103',
      name: 'Habitación 103',
      type: '2 Individuales',
      capacity: 2,
      linen: [
        { item: 'Sábana bajera individual', quantity: 2 },
        { item: 'Cubre plumón individual', quantity: 2 },
        { item: 'Funda de almohada', quantity: 4 },
        { item: 'Toalla grande', quantity: 2 },
        { item: 'Toalla de mano', quantity: 1 },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏨 Gestión de Habitaciones</h1>
        <p className="text-gray-600">Configuración de habitaciones y asignación de ropa blanca</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {roomsConfig.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🏨</span>
                    <span>{room.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {room.type} • Capacidad: {room.capacity} personas
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  {room.linen.length} tipos de ropa
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Configuración de Ropa Blanca:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {room.linen.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{item.item}</span>
                        <Badge variant="secondary">{item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Total items por limpieza: {' '}
                    <span className="font-medium text-gray-900">
                      {room.linen.reduce((sum, item) => sum + item.quantity, 0)} unidades
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Configurada
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen general */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📊 Resumen General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{roomsConfig.length}</p>
              <p className="text-sm text-gray-600">Habitaciones configuradas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {roomsConfig.reduce((sum, room) => sum + room.capacity, 0)}
              </p>
              <p className="text-sm text-gray-600">Capacidad total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {roomsConfig.reduce((sum, room) => 
                  sum + room.linen.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                )}
              </p>
              <p className="text-sm text-gray-600">Items por ciclo completo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
