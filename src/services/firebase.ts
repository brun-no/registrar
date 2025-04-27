import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onDisconnect, set, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC1TFyTLIdzULpZmHQGwvoG4v8IfoQnDSI",
  authDomain: "etiquetasuptec.firebaseapp.com",
  databaseURL: "https://etiquetasuptec-default-rtdb.firebaseio.com",
  projectId: "etiquetasuptec",
  storageBucket: "etiquetasuptec.appspot.com",
  messagingSenderId: "1020897973081",
  appId: "1:1020897973081:web:3a3f6ff6397d7d688ab248",
  measurementId: "G-6TS0PYEMRV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const realtimeDb = getDatabase(app);

// Function to handle user presence
export const handleUserPresence = (user: any) => {
  if (!user) return;

  // Create a reference to this user's presence
  const userStatusRef = ref(realtimeDb, `status/${user.uid}`);
  const userRef = ref(realtimeDb, `users/${user.uid}`);

  // Create a safe connection ID by encoding the email
  const safeConnectionId = user.email
    .replace(/[.@]/g, '_') // Replace both . and @ with underscore
    .replace(/[[\]#$]/g, '_'); // Replace any other invalid characters

  const userConnectionRef = ref(realtimeDb, `connections/${safeConnectionId}`);

  // When this device disconnects, remove all presence references
  onDisconnect(userStatusRef).remove();
  onDisconnect(userRef).remove();
  onDisconnect(userConnectionRef).remove();

  // When this device connects, set the user's presence
  set(userStatusRef, true);
  set(userRef, {
    email: user.email,
    lastSeen: new Date().toISOString()
  });
  set(userConnectionRef, {
    email: user.email,
    timestamp: new Date().toISOString()
  });
};

export { app, db, auth, realtimeDb };