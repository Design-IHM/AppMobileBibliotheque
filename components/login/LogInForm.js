import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth"
import React, { useContext, useState } from 'react'
import { Alert, Dimensions, ImageBackground as Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../config'
import { UserContext } from '../context/UserContext'
import { Formik } from 'formik'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import * as Yup from 'yup'
import { updateDoc, doc, Timestamp } from 'firebase/firestore'

const WIDTH = Dimensions.get('window').width * 1;
const HEIGHT = Dimensions.get('window').height*1

const LoginForm = ({navigation}) => {
  const {emailHigh,setEmailHigh} = useContext(UserContext)

  const handleForgotPassword = (email) => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to reset your password');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert(
          'Email Sent',
          'A password reset email has been sent to your address.',
          [{ text: 'OK' }]
        );
      })
      .catch((error) => {
        if (__DEV__) {
          console.error('Error sending password reset email:', error);
        }
        if (error.code === 'auth/user-not-found') {
          Alert.alert('Error', 'No account exists with this email');
        } else {
          Alert.alert('Error', 'Failed to send reset email. Please try again');
        }
      });
  };

  const LoginFormSchema = Yup.object().shape({
    email: Yup.string().email('Please enter a valid email').required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  })

  const onLogin = async (values) => {
    try {
      const { email, password } = values;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Vérifier si l'email est vérifié
        if (!user.emailVerified) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email before logging in. Would you like to receive a new verification email?',
            [
              {
                text: 'Resend',
                onPress: async () => {
                  await sendEmailVerification(user);
                  Alert.alert('Email Sent', 'Please check your inbox');
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
          return;
        }

        // Update last login in Firestore
        await updateDoc(doc(db, 'BiblioUser', email), {
          lastLoginAt: Timestamp.now()
        });

        setEmailHigh(email);
        navigation.navigate('MainContainer');
      } catch (error) {
        if (__DEV__) {
          console.error('Technical error:', error);
        }

        switch (error.code) {
          case 'auth/wrong-password':
            Alert.alert(
              'Login Failed',
              'Incorrect password. Would you like to reset it?',
              [
                {
                  text: 'Reset Password',
                  onPress: () => handleForgotPassword(values.email),
                },
                {
                  text: 'Try Again',
                  style: 'cancel',
                },
              ]
            );
            break;
          case 'auth/user-not-found':
            Alert.alert(
              'Account Not Found',
              'No account exists with this email.',
              [
                {
                  text: 'Sign Up',
                  onPress: () => navigation.navigate('SignUpScreen'),
                },
                {
                  text: 'Try Again',
                  style: 'cancel',
                },
              ]
            );
            break;
          case 'auth/too-many-requests':
            Alert.alert(
              'Too Many Attempts',
              'Please try again later or reset your password.'
            );
            break;
          case 'auth/network-request-failed':
            Alert.alert(
              'Connection Error',
              'Please check your internet connection and try again.'
            );
            break;
          default:
            Alert.alert(
              'Login Failed',
              'Please check your credentials and try again.'
            );
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Technical error:', error);
      }

      switch (error.code) {
        case 'auth/wrong-password':
          Alert.alert(
            'Login Failed',
            'Incorrect password. Would you like to reset it?',
            [
              {
                text: 'Reset Password',
                onPress: () => handleForgotPassword(values.email),
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
          break;
        case 'auth/user-not-found':
          Alert.alert(
            'Account Not Found',
            'No account exists with this email.',
            [
              {
                text: 'Sign Up',
                onPress: () => navigation.navigate('SignUpScreen'),
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
          break;
        case 'auth/too-many-requests':
          Alert.alert(
            'Too Many Attempts',
            'Please try again later or reset your password.'
          );
          break;
        case 'auth/network-request-failed':
          Alert.alert(
            'Connection Error',
            'Please check your internet connection and try again.'
          );
          break;
        default:
          Alert.alert(
            'Login Failed',
            'Please check your credentials and try again.'
          );
      }
    }
  };

  return (
    <KeyboardAwareScrollView>
      <Image style={{flex:1, height:HEIGHT}} source={require('../../assets/biblio1.jpg')}>
        <View style={styles.wrapper}>
          <Formik
            initialValues={{ email: '', password: '' }}
            onSubmit={values => onLogin(values)}
            validationSchema={LoginFormSchema}
            validateOnMount={true}
          >
            {({ handleChange, handleBlur, handleSubmit, values, isValid, errors, touched }) => (
              <>
                <View style={[
                  styles.inputField,
                  {
                    borderColor:
                      values.email.length < 1 || Yup.string().email().isValidSync(values.email)
                        ? '#ccc'
                        : 'red',
                  },
                ]}>
                  <TextInput
                    placeholderTextColor='#444'
                    placeholder='email'
                    autoCapitalize='none'
                    keyboardType='email-address'
                    textContentType='emailAddress'
                    autoFocus={true}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                  />
                </View>

                <View style={[
                  styles.inputField,
                  {
                    borderColor:
                      6 > values.password.length || values.password.length >= 6
                        ? '#ccc'
                        : 'red',
                  },
                ]}>
                  <TextInput
                    placeholderTextColor='#444'
                    placeholder='password'
                    autoCapitalize='none'
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType='password'
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                </View>

                <TouchableOpacity
                  style={styles.button(isValid)}
                  onPress={handleSubmit}
                  disabled={!isValid}
                >
                  <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => handleForgotPassword(values.email)}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text>New to ingy? </Text>
                  <TouchableOpacity onPress={() => navigation.push('SignUpScreen')}>
                    <Text style={{ color: '#FA8072' }}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </View>
      </Image>
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  wrapper:{
    marginTop:200,
    marginHorizontal:10,
    height:HEIGHT,
    alignContent:'center',
    alignSelf:'center',
  },
  inputField: {
    borderRadius: 20,
    padding: 8,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
    borderWidth: 1,
    width: 350,
  },
  button: isValid => ({
    backgroundColor: isValid ? '#582900' : '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 8,
    width: 200,
    alignSelf: 'center'
  }),
  buttonText:{
    fontWeight:'600',
    color:'#fff',
    fontSize:20,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#0096F6',
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    width: '100%',

    justifyContent: 'center',
    marginTop: 30,
  },
})

export default LoginForm