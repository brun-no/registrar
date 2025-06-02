import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, realtimeDb } from '../services/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { Users, UserPlus, UserX } from 'lucide-react';

interface User {
  id: string;
  email: string;
  password: string;
  requestDate: string;
  status: 'pending' | 'approved';
}

interface OnlineUser {
  email: string;
  timestamp: string;
}

const ADMIN_EMAIL = 'uptecbrasilqualidade@gmail.com';

const AdminPanel: React.FC = () => {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    
    const connectionsRef = ref(realtimeDb, 'connections');
    const unsubscribe = onValue(connectionsRef, (snapshot) => {
      const connections: OnlineUser[] = [];
      snapshot.forEach((childSnapshot) => {
        connections.push(childSnapshot.val());
      });
      setOnlineUsers(connections);
    });

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      const pendingQuery = query(collection(db, 'pendingUsers'));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingUsers = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const approvedUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'approved'
      })) as User[];
      
      const allUsers = [...pendingUsers, ...approvedUsers];
      allUsers.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      });
      
      setUsers(allUsers);
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

      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.length > 0) {
        await setDoc(doc(db, 'pendingUsers', user.id), {
          ...user,
          status: 'approved'
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: user.email,
          approvedAt: new Date().toISOString()
        });
        
        await setDoc(doc(db, 'pendingUsers', user.id), {
          ...user,
          status: 'approved'
        });
      }
      
      await loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      setError(error.message || 'Erro ao aprovar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    // Prevent deletion of admin account
    if (user.email === ADMIN_EMAIL) {
      setError('Não é possível excluir a conta de administrador');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (user.status === 'approved') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
          
          await deleteUser(userCredential.user);
          
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

      if (user.id) {
        await deleteDoc(doc(db, 'pendingUsers', user.id));
      }
      
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Usuários Online</h2>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center mb-4">
            <Users className="mr-2" />
            <span className="text-lg font-semibold">Total Online: {onlineUsers.length}</span>
          </div>
          <div className="space-y-2">
            {onlineUsers.map((user, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } ${user.email === ADMIN_EMAIL ? 'border-l-4 border-green-500' : ''}`}
              >
                <p className="font-medium">
                  {user.email}
                  {user.email === ADMIN_EMAIL && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Conectado desde: {new Date(user.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              } ${user.email === ADMIN_EMAIL ? 'border-l-4 border-green-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {user.email}
                    {user.email === ADMIN_EMAIL && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.status === 'approved' 
                      ? 'Aprovado em: ' 
                      : 'Solicitado em: '}{new Date(user.requestDate).toLocaleString()}
                  </p>
                  <p className={`text-sm font-medium ${user.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                    Status: {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </p>
                </div>
                <div className="space-x-2">
                  {user.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(user)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                    >
                      <UserPlus size={18} className="mr-2" />
                      Aprovar
                    </button>
                  )}
                  {user.email !== ADMIN_EMAIL && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                    >
                      <UserX size={18} className="mr-2" />
                      Excluir
                    </button>
                  )}
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