import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

const Switch: React.FC<SwitchProps> = ({ id, label, checked, onChange }) => {
  const { darkMode } = useTheme();

  return (
    <div className="flex items-center">
      <label htmlFor={id} className="flex items-center cursor-pointer">
        <div className="mr-3 text-base font-medium">{label}</div>
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="sr-only"
            checked={checked}
            onChange={onChange}
          />
          <div className={`
            w-[80px] h-[32px] rounded-full
            transition-all duration-300 ease-in-out
            shadow-inner
            ${checked 
              ? (darkMode ? 'bg-blue-600' : 'bg-blue-500') 
              : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
            }
          `}>
            <div className={`
              absolute top-[6px] h-[20px] w-[35px]
              flex items-center justify-center
              rounded-full text-xs font-medium
              transition-all duration-300 ease-in-out
              shadow-lg
              ${checked 
                ? 'right-[6px] bg-white text-blue-600'
                : 'left-[6px] bg-gray-200 text-gray-600'
              }
            `}>
              {checked ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default Switch;