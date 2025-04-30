import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, auth } from '../services/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  password: string;
  requestDate: string;
  status: 'pending' | 'approved';
}

const AdminPanel: React.FC = () => {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const q = query(collection(db, 'pendingUsers'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Sort users by status (pending first) and then by date
      users.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      });
      
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: User) => {
    try {
      setLoading(true);
      setError('');

      // Check if email already exists in Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.length > 0) {
        // Update status in pendingUsers if user already exists
        await setDoc(doc(db, 'pendingUsers', user.id), {
          ...user,
          status: 'approved'
        });
      } else {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        
        // Add user to users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: user.email,
          approvedAt: new Date().toISOString()
        });
        
        // Update status in pendingUsers
        await setDoc(doc(db, 'pendingUsers', user.id), {
          ...user,
          status: 'approved'
        });
      }
      
      // Refresh list
      await loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      setError(error.message || 'Erro ao aprovar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      setLoading(true);
      setError('');

      // If user is approved, we need to delete from Firebase Auth
      if (user.status === 'approved') {
        try {
          // Sign in as the user to get their auth object
          const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
          
          // Delete the user from Firebase Auth
          await deleteUser(userCredential.user);
          
          // Delete from users collection if exists
          const usersQuery = query(collection(db, 'users'), where('email', '==', user.email));
          const usersSnapshot = await getDocs(usersQuery);
          
          for (const doc of usersSnapshot.docs) {
            await deleteDoc(doc.ref);
          }
        } catch (error) {
          console.error('Error deleting user from Firebase Auth:', error);
          setError('Erro ao excluir usuário da autenticação');
          return;
        }
      }

      // Delete from pendingUsers collection
      await deleteDoc(doc(db, 'pendingUsers', user.id));
      
      // Refresh the users list
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h2 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {users.length === 0 ? (
        <p className="text-gray-500">Nenhuma solicitação encontrada</p>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
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
                  <p className={`text-sm font-medium ${user.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                    Status: {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </p>
                </div>
                <div className="space-x-2">
                  {user.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(user)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Excluir
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