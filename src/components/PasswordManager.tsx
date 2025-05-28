import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Key, Eye, EyeOff } from 'lucide-react';

const PasswordManager: React.FC = () => {
  const { darkMode } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultPage, setDefaultPage] = useState('home');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const passwordDoc = await getDoc(doc(db, 'SenhaAdmin', 'SenhaAdmin'));
        if (passwordDoc.exists()) {
          setCurrentPassword(passwordDoc.data().SenhaAdmin || '');
          setDefaultPage(passwordDoc.data().defaultPage || 'home');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Erro ao carregar as configurações');
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      await updateDoc(doc(db, 'SenhaAdmin', 'SenhaAdmin'), {
        SenhaAdmin: newPassword
      });
      setSuccess('Senha atualizada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Erro ao atualizar a senha');
    }
  };

  const handleDefaultPageChange = async (page: string) => {
    try {
      await updateDoc(doc(db, 'SenhaAdmin', 'SenhaAdmin'), {
        defaultPage: page
      });
      setDefaultPage(page);
      setSuccess('Página padrão atualizada com sucesso');
    } catch (error) {
      console.error('Error updating default page:', error);
      setError('Erro ao atualizar a página padrão');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center mb-6">
          <Key size={24} className="mr-2" />
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Configurações de Administrador
          </h2>
        </div>

        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Página Inicial Padrão
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleDefaultPageChange('home')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors duration-200 ${
                defaultPage === 'home'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Registros
            </button>
            <button
              onClick={() => handleDefaultPageChange('calculator')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors duration-200 ${
                defaultPage === 'calculator'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Calculadora
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                readOnly
                className={`w-full p-2 pr-10 rounded-md ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                } border border-gray-300`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-2 pr-10 rounded-md ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                } border border-gray-300`}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-2 pr-10 rounded-md ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                } border border-gray-300`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-green-100 text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 rounded-md ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200`}
          >
            Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordManager;