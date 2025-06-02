import React, { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface FloatingInputProps {
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  type?: string;
  required?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  size?: 'normal' | 'large';
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(({
  id,
  value,
  onChange,
  label,
  type = 'text',
  required = false,
  onFocus,
  onBlur,
  readOnly = false,
  className = '',
  onKeyPress,
  size = 'normal'
}, ref) => {
  const { darkMode } = useTheme();
  const isNotEmpty = value !== '' && value !== 0;

  const inputSizeClasses = size === 'large' 
    ? 'px-6 py-4 text-2xl' 
    : 'px-4 py-2 text-base';

  const labelSizeClasses = size === 'large'
    ? 'text-xl'
    : 'text-sm';

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
        readOnly={readOnly}
        className={`
          block w-full
          ${inputSizeClasses}
          border rounded-lg
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2
          peer
          ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${darkMode 
            ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500' 
            : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${className}
        `}
        placeholder=" "
        required={required}
      />
      <label
        htmlFor={id}
        className={`
          absolute ${labelSizeClasses}
          transition-all duration-200 ease-in-out
          transform
          cursor-text
          ${isNotEmpty 
            ? 'top-0 translate-y-[-50%] scale-75 px-2 left-4 z-10' 
            : size === 'large' ? 'top-1/2 -translate-y-1/2 left-6' : 'top-1/2 -translate-y-1/2 left-4'
          }
          ${darkMode 
            ? `text-gray-300 ${isNotEmpty ? 'bg-gray-700' : ''} peer-focus:text-blue-400 peer-focus:bg-gray-700` 
            : `text-gray-500 ${isNotEmpty ? 'bg-white' : ''} peer-focus:text-blue-600 peer-focus:bg-white`
          }
          peer-focus:top-0 peer-focus:translate-y-[-50%] peer-focus:scale-75 peer-focus:px-2 peer-focus:left-4
        `}
      >
        {label}{required && ' *'}
      </label>
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';