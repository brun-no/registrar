import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider } from './context/AdminContext';
import Layout from './components/Layout';
import LabelCalculator from './components/LabelCalculator';
import RecordsTable from './components/RecordsTable';
import ActionButtons from './components/ActionButtons';
import Auth from './components/Auth';
import PartsManager from './components/PartsManager';
import AdminPanel from './components/AdminPanel';
import PasswordManager from './components/PasswordManager';
import { auth, db } from './services/firebase';
import { User } from 'firebase/auth';
import { handleUserPresence } from './services/firebase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        handleUserPresence(user);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail);
    };

    window.addEventListener('navigationChange', handleNavigation as EventListener);
    return () => window.removeEventListener('navigationChange', handleNavigation as EventListener);
  }, []);

  if (!user) {
    return (
      <ThemeProvider>
        <AdminProvider>
          <Auth />
        </AdminProvider>
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <LabelCalculator />
            <ActionButtons />
            <RecordsTable />
          </>
        );
      case 'parts':
        return <PartsManager />;
      case 'requests':
        return <AdminPanel />;
      case 'password':
        return <PasswordManager />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <AdminProvider>
        <Layout>
          {renderContent()}
        </Layout>
      </AdminProvider>
    </ThemeProvider>
  );
}

export default App;