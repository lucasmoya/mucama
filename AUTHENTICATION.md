# Sistema de Autenticación - Lavander App

## Descripción

Este proyecto implementa un sistema de autenticación completo usando Supabase Auth que permite a los usuarios registrarse e iniciar sesión con email y contraseña. El sistema está diseñado para funcionar con las políticas RLS (Row Level Security) de Supabase.

## Características

- ✅ Registro de usuarios con email y contraseña
- ✅ Inicio de sesión con email y contraseña
- ✅ Gestión de estado de autenticación global
- ✅ Protección de rutas basada en autenticación
- ✅ Integración con políticas RLS de Supabase
- ✅ Hooks personalizados para consultas autenticadas
- ✅ Manejo de errores y notificaciones

## Componentes Principales

### AuthProvider
El componente principal que maneja el estado de autenticación global.

```tsx
import { AuthProvider } from '@/components/AuthProvider';

// Envuelve tu app
<AuthProvider>
  <App />
</AuthProvider>
```

### useAuth Hook
Hook para acceder al contexto de autenticación.

```tsx
import { useAuth } from '@/components/AuthProvider';

const { user, signIn, signUp, signOut, loading } = useAuth();
```

### SupabaseLoginForm
Formulario de login/registro con validación.

```tsx
import { SupabaseLoginForm } from '@/components/SupabaseLoginForm';
```

## Hooks de Datos Autenticados

### useSupabaseQuery
Hook para consultas que requieren autenticación.

```tsx
import { useSupabaseQuery } from '@/hooks/useSupabase';

const { data, isLoading, error } = useSupabaseQuery(
  ['catalog-items'],
  async () => {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*');
    if (error) throw error;
    return data;
  }
);
```

### useSupabaseMutation
Hook para mutaciones que requieren autenticación.

```tsx
import { useSupabaseMutation } from '@/hooks/useSupabase';

const mutation = useSupabaseMutation(
  async (data) => {
    const { error } = await supabase
      .from('table')
      .insert(data);
    if (error) throw error;
  },
  {
    onSuccess: () => console.log('Success!'),
    invalidateQueries: [['catalog-items']]
  }
);
```

## Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## Políticas RLS

El sistema está configurado para trabajar con las siguientes políticas RLS en Supabase:

```sql
-- Ejemplo de política básica
CREATE POLICY "Authenticated users can access data" ON public.table_name
  FOR ALL USING (auth.uid() IS NOT NULL);
```

## Flujo de Autenticación

1. **Registro**: El usuario se registra con email, contraseña, nombre y rol
2. **Verificación**: Se envía un email de confirmación (configurable en Supabase)
3. **Login**: El usuario inicia sesión con email y contraseña
4. **Sesión**: La sesión se mantiene automáticamente
5. **Logout**: El usuario puede cerrar sesión

## Estructura de Usuario

Los usuarios tienen la siguiente estructura de metadatos:

```typescript
interface UserMetadata {
  name: string;
  role: 'supervisor' | 'mucama';
}
```

## Manejo de Errores

El sistema incluye manejo de errores para:
- Credenciales inválidas
- Usuario no encontrado
- Errores de red
- Errores de validación

## Seguridad

- Todas las consultas requieren autenticación
- Las políticas RLS protegen los datos
- Las contraseñas se manejan de forma segura
- Las sesiones se gestionan automáticamente

## Uso en Componentes

```tsx
import { useAuth } from '@/components/AuthProvider';

const MyComponent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return <div>Bienvenido, {user.user_metadata.name}!</div>;
};
``` 