import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Modo Noturno</span> 
      <button
        onClick={toggleDarkMode}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ease-in-out duration-300 ${
          darkMode ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span className="sr-only"></span> 
        <span
          className={`inline-block w-5 h-5 transform rounded-full transition-transform ease-in-out duration-300 ${
            darkMode 
              ? 'translate-x-6 bg-gray-900 flex items-center justify-center' 
              : 'translate-x-1 bg-white flex items-center justify-center'
          }`}
        >
          {darkMode ? <Moon size={12} /> : <Sun size={12} />}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;