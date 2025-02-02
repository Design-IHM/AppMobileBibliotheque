import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, getFirebaseInstances } from '../../firebaseConfig';

export const FirebaseContext = createContext({
  isFirebaseReady: false,
  db: null,
});

export function FirebaseProvider({ children }) {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firestore, setFirestore] = useState(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        const { db } = await getFirebaseInstances();
        setFirestore(db);
        setIsFirebaseReady(true);
        console.log("Firebase initialisé avec succès dans le contexte");
      } catch (error) {
        console.error("Erreur lors de l'initialisation de Firebase dans le contexte:", error);
      }
    };

    initFirebase();
  }, []);

  return (
    <FirebaseContext.Provider value={{ isFirebaseReady, db: firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase doit être utilisé dans un FirebaseProvider');
  }
  return context;
}
