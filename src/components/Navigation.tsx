import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { Home, Package, UserPlus, Settings, Calculator } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { darkMode } = useTheme();
  const { isAdmin } = useAdmin();

  const navItems = [
    { id: 'home', label: 'REGISTROS', icon: Home, adminOnly: false },
    { id: 'calculator', label: 'CALCULADORA', icon: Calculator, adminOnly: false },
    { id: 'parts', label: 'PEÇAS', icon: Package, adminOnly: true },
    { id: 'requests', label: 'SOLICITAÇÕES', icon: UserPlus, adminOnly: true },
    { id: 'password', label: 'ADMINISTRAÇÕES', icon: Settings, adminOnly: true },
  ];

  // Filter items based on admin status
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg min-w-[200px] py-2`}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex items-center w-full px-4 py-3 transition-all duration-200 ${
              currentPage === item.id
                ? `${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
            }`}
          >
            <Icon size={18} className="mr-2" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;