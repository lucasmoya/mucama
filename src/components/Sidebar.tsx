import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  Home,
  BedDouble,
  Package,
  PlusCircle,
  Cog,
  BookOpen,
  Users,
  Sun,
  HelpCircle,
  Folder,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: 'supervisor' | 'mucama';
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar = ({ 
  activeSection, 
  onSectionChange, 
  userRole, 
  isOpen, 
  onClose, 
  isMobile = false 
}: SidebarProps) => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email || 'Usuario';
  const role = user?.user_metadata?.role || userRole;
  const roleLabel = role === 'supervisor' ? 'Supervisor' : 'Mucama';
  const roleIconImg = role === 'supervisor' ? '/supervisor.png' : '/mucama.png';

  const menuItems = [
    { id: 'overview', label: 'Panel Principal', icon: <Home className="w-5 h-5" />, roles: ['supervisor', 'mucama'] },
    { id: 'cleaning', label: 'Limpiar Habitación', icon: <BedDouble className="w-5 h-5" />, roles: ['mucama'] },
    { id: 'laundry', label: 'Recibir Lavandería', icon: <Package className="w-5 h-5" />, roles: ['supervisor', 'mucama'] },
    { id: 'extra', label: 'Entrega Extra', icon: <PlusCircle className="w-5 h-5" />, roles: ['mucama'] },
    { id: 'config', label: 'Configuración', icon: <Cog className="w-5 h-5" />, roles: ['supervisor'] },
    { id: 'history', label: 'Historial', icon: <BookOpen className="w-5 h-5" />, roles: ['supervisor', 'mucama'] },
  ];

  const availableItems = menuItems.filter(item => item.roles.includes(userRole));

  const SidebarContent = () => (
    <div className="h-full bg-white flex flex-col w-80 max-w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0 flex items-center gap-2 justify-center">
        <img src="/mucama-logo.png" alt="Logo" className="h-8 w-auto -ml-6" />
        </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">
          {availableItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-11 text-[15px] font-normal rounded-lg transition-all",
                activeSection === item.id 
                  ? "bg-gray-100 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="mr-3 flex items-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="my-6 border-t border-gray-100" />
        {/* Sección extra opcional (ejemplo: soporte, settings) */}
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start text-left h-11 text-[15px] font-normal text-gray-700 hover:bg-gray-50">
            <HelpCircle className="w-5 h-5 mr-3" /> Soporte
          </Button>
        </div>
        </nav>
      {/* Usuario abajo */}
      <div className="p-4">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-sm p-3">
          <img src={roleIconImg} alt={roleLabel} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
          <div>
            <div className="font-normal text-gray-900 leading-tight text-[15px]">{userName}</div>
            <div className="text-xs text-gray-500">{roleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    // Custom mobile sidebar with overlay and only the custom close button
    if (!isOpen) return null;
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
        {/* Sidebar panel */}
        <div className="fixed top-0 left-0 h-screen w-80 max-w-full z-50 shadow-lg border-r border-gray-200 bg-white animate-in slide-in-from-left">
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div className="w-64 shadow-lg border-r border-gray-200 hidden lg:block fixed left-0 top-0 h-screen z-30">
      <SidebarContent />
    </div>
  );
};
