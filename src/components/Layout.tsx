import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { ArrowUp, Menu } from 'lucide-react';
import { realtimeDb, auth } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { signOut } from 'firebase/auth';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const connectionsRef = ref(realtimeDb, 'connections');
    
    const unsubscribe = onValue(connectionsRef, (snap) => {
      setOnlineUsers(snap.size || 0);
    });

    return () => unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container') && !target.closest('.menu-button')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      <header className={`py-4 px-6 flex justify-between items-center relative ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`menu-button p-2 rounded-lg transition-colors duration-200 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold">
            Qualidade Uptec Brasil
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`px-3 py-1 rounded-md text-xs flex items-center ${
              darkMode ? 'bg-blue-600' : 'bg-blue-500'
            } text-white hover:opacity-90 transition-opacity`}
          >
            <span>{onlineUsers}</span>&nbsp;ONLINE
          </button>
          <ThemeToggle />
        </div>
        {showMenu && (
          <div className="menu-container absolute top-full left-0 mt-1 z-50">
            <Navigation currentPage="home" onPageChange={(page) => {
              setShowMenu(false);
              window.dispatchEvent(new CustomEvent('navigationChange', { detail: page }));
            }} />
          </div>
        )}
      </header>

      <main className="container mx-auto py-6 px-4">
        {children}
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Atenção!</h3>
            <p className="mb-4">Ao continuar você será desconectado. Para acessar novamente, insira seu e-mail e senha.</p>
            <p className="mb-6">Você deseja realmente sair?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-200'
                } hover:opacity-90 transition-opacity`}
              >
                Continuar Conectado
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={scrollToTop} 
        className={`fixed bottom-8 right-8 p-2 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        } ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default Layout;