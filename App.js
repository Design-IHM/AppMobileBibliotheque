import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import NewNav from './components/navigation/NewNav';
import { UserContextProvider } from './components/context/UserContext';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Georgia': require('./assets/fonts/Georgia.ttf'),  // Assurez-vous de fournir le bon chemin vers le fichier de la police
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <UserContextProvider>
      <NewNav />
    </UserContextProvider>
  );
}

 {/*<NavApp />*/}

 
 const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
