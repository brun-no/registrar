import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';

interface AutocompleteInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isBatchNumberDuplicate?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  onKeyPress,
  isBatchNumberDuplicate = false
}) => {
  const { darkMode } = useTheme();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent part codes
    const q = query(
      collection(db, 'codigospecas'),
      orderBy('lastUsed', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codes = snapshot.docs.map(doc => doc.data().code);
      setSuggestions(codes);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (value.trim()) {
      // Real-time search for part codes
      const q = query(
        collection(db, 'codigospecas'),
        where('code', '>=', value),
        where('code', '<=', value + '\uf8ff'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const codes = snapshot.docs.map(doc => doc.data().code);
        setSuggestions(codes);
        setShowSuggestions(true);
      });

      return () => unsubscribe();
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className={`
          w-full px-4 py-2.5 text-base
          border rounded-lg
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2
          ${darkMode 
            ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500' 
            : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${isBatchNumberDuplicate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        placeholder=" "
        required={required}
      />
      <label
        htmlFor={id}
        className={`
          absolute text-sm
          transition-all duration-200 ease-in-out
          transform
          cursor-text
          ${value 
            ? 'top-0 translate-y-[-50%] scale-75 px-2 left-3 z-10' 
            : 'top-1/2 -translate-y-1/2 left-4'
          }
          ${darkMode 
            ? `text-gray-300 ${value ? 'bg-gray-700' : ''} peer-focus:text-blue-400` 
            : `text-gray-500 ${value ? 'bg-white' : ''} peer-focus:text-blue-600`
          }
        `}
      >
        {label}{required && ' *'}
      </label>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul
          className={`
            absolute z-50 w-full mt-1
            border rounded-md shadow-lg
            max-h-60 overflow-auto
            ${darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          {suggestions.map((suggestion) => (
            <li
              key={suggestion}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
              className={`
                px-4 py-2 cursor-pointer
                ${darkMode 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-blue-50 text-gray-900'
                }
              `}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};