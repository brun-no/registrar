import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface PendingUser {
  id: string;
  email: string;
  password: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminPanel: React.FC = () => {
  const { darkMode } = useTheme();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const q = query(
        collection(db, 'pendingUsers'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingUser[];
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('Erro ao carregar usuários pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      // Add user to approved users collection
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        email: user.email,
        approvedAt: new Date().toISOString()
      });
      
      // Update status in pendingUsers
      await updateDoc(doc(db, 'pendingUsers', user.id), {
        status: 'approved'
      });
      
      // Refresh list
      await loadPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Erro ao aprovar usuário');
    }
  };

  const handleReject = async (user: PendingUser) => {
    try {
      await updateDoc(doc(db, 'pendingUsers', user.id), {
        status: 'rejected'
      });
      await loadPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Erro ao rejeitar usuário');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h2 className="text-2xl font-bold mb-6">Aprovação de Usuários</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">Nenhuma solicitação pendente</p>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map(user => (
            <div
              key={user.id}
              className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Solicitado em: {new Date(user.requestDate).toLocaleString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApprove(user)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;