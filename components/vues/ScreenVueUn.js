// Example of Splash, Login and Sign Up in React Native
// https://aboutreact.com/react-native-login-and-signup/

// Import React and Component
import React, { useState, useEffect, useContext } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Image
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { auth } from '../../config';

const ScreenVueUn = ({ navigation }) => {
  const [animating, setAnimating] = useState(true);
  const { currentUserNewNav } = useContext(UserContext) || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
      navigation.navigate('VueUn', {
        // Add any required params here
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/enspy.jpg')}
        style={{width: '90%', resizeMode: 'contain', margin: 30}}
      />
      <ActivityIndicator
        animating={animating}
        color="#FFFFFF"
        size="large"
        style={styles.activityIndicator}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#307ecc',
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  },
});

export default ScreenVueUn;