
-- Crear enum para tipos de habitación
CREATE TYPE room_type AS ENUM ('matrimonial', 'individual', 'doble', 'suite');

-- Crear enum para roles de usuario
CREATE TYPE user_role AS ENUM ('supervisor', 'mucama');

-- Crear enum para estados de habitación
CREATE TYPE room_status AS ENUM ('ocupada', 'libre', 'mantenimiento');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'mucama',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de catálogo de items de ropa blanca
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidad',
  icon TEXT NOT NULL DEFAULT '🧺',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de habitaciones
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY, -- usando room number como ID (ej: '101', '102')
  name TEXT NOT NULL,
  type room_type NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  status room_status NOT NULL DEFAULT 'libre',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de ropa por habitación
CREATE TABLE public.room_linen_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, catalog_item_id)
);

-- Tabla de stock de inventario
CREATE TABLE public.inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  total_stock INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER NOT NULL DEFAULT 0,
  in_use_stock INTEGER NOT NULL DEFAULT 0,
  dirty_stock INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(catalog_item_id)
);

-- Tabla de entregas extras a huéspedes
CREATE TABLE public.extra_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id),
  quantity INTEGER NOT NULL,
  delivered_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de inventario
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id),
  room_id TEXT REFERENCES public.rooms(id),
  movement_type TEXT NOT NULL, -- 'entrada', 'salida', 'limpieza', 'entrega_extra'
  quantity INTEGER NOT NULL,
  from_status TEXT, -- 'disponible', 'en_uso', 'sucio'
  to_status TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_linen_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (todos los usuarios autenticados pueden acceder por ahora)
CREATE POLICY "Authenticated users can manage profiles" ON public.profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage catalog_items" ON public.catalog_items
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage rooms" ON public.rooms
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage room_linen_config" ON public.room_linen_config
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory_stock" ON public.inventory_stock
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage extra_deliveries" ON public.extra_deliveries
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory_movements" ON public.inventory_movements
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mucama')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar datos iniciales del catálogo
INSERT INTO public.catalog_items (name, unit, icon) VALUES
('Sábana bajera matrimonial', 'unidad', '🛏️'),
('Sábana bajera individual', 'unidad', '🛏️'),
('Toalla grande', 'unidad', '🛁'),
('Toalla de mano', 'unidad', '🛁'),
('Funda de almohada', 'unidad', '🛏️'),
('Cubre plumón doble', 'unidad', '🛏️'),
('Cubre plumón individual', 'unidad', '🛏️'),
('Bata de baño', 'unidad', '👘'),
('Pantuflas', 'par', '🥿');

-- Insertar habitaciones de ejemplo
INSERT INTO public.rooms (id, name, type, capacity, status) VALUES
('101', 'Habitación 101', 'matrimonial', 2, 'ocupada'),
('102', 'Habitación 102', 'individual', 1, 'ocupada'),
('103', 'Habitación 103', 'doble', 2, 'libre'),
('104', 'Habitación 104', 'suite', 4, 'ocupada'),
('105', 'Habitación 105', 'matrimonial', 2, 'ocupada'),
('201', 'Habitación 201', 'individual', 1, 'libre'),
('202', 'Habitación 202', 'doble', 2, 'ocupada'),
('203', 'Habitación 203', 'suite', 4, 'ocupada'),
('204', 'Habitación 204', 'matrimonial', 2, 'libre'),
('205', 'Habitación 205', 'individual', 1, 'ocupada'),
('301', 'Habitación 301', 'suite', 4, 'ocupada'),
('302', 'Habitación 302', 'doble', 2, 'libre'),
('303', 'Habitación 303', 'matrimonial', 2, 'ocupada'),
('304', 'Habitación 304', 'individual', 1, 'ocupada'),
('305', 'Habitación 305', 'suite', 4, 'libre');

-- Insertar stock inicial para cada item del catálogo
INSERT INTO public.inventory_stock (catalog_item_id, total_stock, available_stock)
SELECT 
  id,
  CASE name
    WHEN 'Sábana bajera matrimonial' THEN 60
    WHEN 'Sábana bajera individual' THEN 100
    WHEN 'Toalla grande' THEN 155
    WHEN 'Toalla de mano' THEN 85
    WHEN 'Funda de almohada' THEN 122
    WHEN 'Cubre plumón doble' THEN 34
    WHEN 'Cubre plumón individual' THEN 45
    WHEN 'Bata de baño' THEN 30
    WHEN 'Pantuflas' THEN 40
    ELSE 50
  END as stock,
  CASE name
    WHEN 'Sábana bajera matrimonial' THEN 45
    WHEN 'Sábana bajera individual' THEN 78
    WHEN 'Toalla grande' THEN 120
    WHEN 'Toalla de mano' THEN 85
    WHEN 'Funda de almohada' THEN 95
    WHEN 'Cubre plumón doble' THEN 25
    WHEN 'Cubre plumón individual' THEN 45
    WHEN 'Bata de baño' THEN 30
    WHEN 'Pantuflas' THEN 40
    ELSE 40
  END as available
FROM public.catalog_items;
