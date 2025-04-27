import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LabelCalculator from './components/LabelCalculator';
import RecordsTable from './components/RecordsTable';
import ActionButtons from './components/ActionButtons';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { auth, db } from './services/firebase';
import { User } from 'firebase/auth';
import { handleUserPresence } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        handleUserPresence(user);
        
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().isAdmin === true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Layout isAdmin={isAdmin} onToggleAdminPanel={() => setShowAdminPanel(!showAdminPanel)}>
        {showAdminPanel && isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            <LabelCalculator />
            <ActionButtons />
            <RecordsTable />
          </>
        )}
      </Layout>
    </ThemeProvider>
  );
}

export default App;