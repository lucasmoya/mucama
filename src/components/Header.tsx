import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Menu } from 'lucide-react';

interface HeaderProps {
  establishmentName: string;
  onLogout: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export const Header = ({ establishmentName, onLogout, onMenuClick, isMobile = false }: HeaderProps) => {
  return (
    <Card className={`shadow-sm border-gray-200 ${isMobile ? 'm-4 mb-2' : 'm-6 mb-0'}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>{establishmentName}</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className={`text-gray-500 ${isMobile ? 'text-xs hidden sm:block' : 'text-sm'}`}> 
            {new Date().toLocaleDateString('es-ES', { 
              weekday: isMobile ? 'short' : 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            size={isMobile ? "sm" : "default"}
            className="hover:bg-gray-50"
          >
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
