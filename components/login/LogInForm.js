import {
  signInWithEmailAndPassword
} from "firebase/auth"
import React, { useContext, useState } from 'react'
import { Alert, Dimensions, ImageBackground as Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth } from '../../config'
import { UserContext } from '../context/UserContext'
import { Formik } from 'formik'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import * as Yup from 'yup'

const WIDTH = Dimensions.get('window').width * 1;
const HEIGHT = Dimensions.get('window').height*1

const LoginForm = ({navigation}) => {
  const {emailHigh,setEmailHigh} = useContext(UserContext)

  const LoginFormSchema = Yup.object().shape({
    email: Yup.string().email('Please enter a valid email').required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  })

  const onLogin = async (values) => {
    try {
      const { email, password } = values;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setEmailHigh(email);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainContainer' }],
      });
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address');
      } else {
        Alert.alert('Error', error.message);
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

                <View style={styles.signupContainer}>
                  <Text>T'es nouveau sur ingy ? </Text>
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
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    borderWidth: 1,
    width: 350,
  },
  button: isValid => ({
    backgroundColor: isValid ? '#000' : '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 4,
    width: 250,
    alignSelf: 'center'
  }),
  buttonText:{
    fontWeight:'600',
    color:'#fff',
    fontSize:20,
  },
  signupContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 50,
  },
})

export default LoginForm