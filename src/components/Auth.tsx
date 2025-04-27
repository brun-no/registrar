import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Auth: React.FC = () => {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setError('Senha incorreta');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Check if email is already pending approval
      const pendingQuery = query(
        collection(db, 'pendingUsers'),
        where('email', '==', email)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      
      if (!pendingSnapshot.empty) {
        setError('Este email já está aguardando aprovação');
        return;
      }

      // Check if email already exists in approved users
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        setError('Este email já está registrado');
        return;
      }

      // Add to pending users
      await setDoc(doc(collection(db, 'pendingUsers')), {
        email,
        password, // In production, use proper password hashing
        requestDate: new Date().toISOString(),
        status: 'pending'
      });

      setRegistrationSuccess(true);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError('Erro ao registrar. Tente novamente.');
    }
  };

  if (registrationSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Solicitação Enviada
          </h2>
          <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sua solicitação de registro foi enviada com sucesso. Aguarde a aprovação do administrador.
          </p>
          <button
            onClick={() => {
              setIsRegistering(false);
              setRegistrationSuccess(false);
            }}
            className={`w-full py-3 rounded-lg font-medium ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          QUALIDADE UPTEC
        </h2>
        <form onSubmit={isRegistering ? handleRegistration : handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`w-full p-3 rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white text-gray-900 placeholder-gray-500'
              } border border-gray-300`}
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className={`w-full p-3 rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white text-gray-900 placeholder-gray-500'
              } border border-gray-300`}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-medium ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRegistering ? 'Registrar' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
          >
            {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Registre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;