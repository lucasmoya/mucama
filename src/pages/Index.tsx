import { useAuth } from '@/components/AuthProvider';
import { Dashboard } from '@/components/Dashboard';
import { SupabaseLoginForm } from '@/components/SupabaseLoginForm';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SupabaseLoginForm />;
  }

  return <Dashboard />;
};

export default Index;
