import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { InventoryOverview } from '@/components/InventoryOverview';
import { RoomManagement } from '@/components/RoomManagement';
import { CleaningFlow } from '@/components/CleaningFlow';
import { LaundryReception } from '@/components/LaundryReception';
import { ExtraDelivery } from '@/components/ExtraDelivery';
import { MovementHistory } from '@/components/MovementHistory';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { useAuth } from './AuthProvider';

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Extract user info from Supabase user metadata
  const userName = user?.user_metadata?.name || user?.email || 'Usuario';
  const userRole = user?.user_metadata?.role || 'mucama';
  const establishmentName = 'Blumen Hotel'; // Esto será dinámico en el futuro

  const handleLogout = async () => {
    await signOut();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <InventoryOverview userRole={userRole} />;
      case 'rooms':
        return <RoomManagement userRole={userRole} />;
      case 'cleaning':
        return <CleaningFlow />;
      case 'laundry':
        return <LaundryReception />;
      case 'extra':
        return <ExtraDelivery />;
      case 'history':
        return <MovementHistory userRole={userRole} />;
      case 'config':
        return <ConfigurationPanel />;
      default:
        return <InventoryOverview userRole={userRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Header 
          establishmentName={establishmentName}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
          isMobile={true}
        />
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            setActiveSection(section);
            setSidebarOpen(false);
          }}
          userRole={userRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={true}
        />
        <main className="p-4 pt-2">
          {renderContent()}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          userRole={userRole}
          isMobile={false}
        />
        <div className="flex-1 flex flex-col lg:ml-64">
          <Header establishmentName={establishmentName} onLogout={handleLogout} isMobile={false} />
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};
