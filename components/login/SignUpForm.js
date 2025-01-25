import { Picker } from '@react-native-picker/picker';
import { Timestamp, doc, setDoc, getDoc } from "firebase/firestore";
import React, { useContext, useState } from 'react';
import { Alert, Dimensions, Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage, db } from '../../config';
import { UserContext } from '../context/UserContext';
import { Formik } from 'formik';
import * as Yup from 'yup';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const SignUpForm = ({navigation}) => {
  const {emailHigh, setEmailHigh} = useContext(UserContext);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const SignupFormSchema = Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email')
      .required('Email is required')
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Invalid email format'
      ),
    username: Yup.string()
      .required('Username is required')
      .min(2, 'Username must be at least 2 characters'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .matches(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{6,}$/,
        'Password must contain at least one letter and one number'
      ),
    confirmPassword: Yup.string()
      .required('Password confirmation is required')
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
  });

  const getPermissionAndPickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const uploadImage = async () => {
    try {
      if (!image) return null;
      
      const response = await fetch(image);
      const blob = await response.blob();
      const filename = `profilePictures/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const onSignup = async (values) => {
    if (!selectedLevel) {
      Alert.alert('Error', 'Please select your level');
      return;
    }

    try {
      const { email, password, username } = values;
      
      // Créer l'utilisateur avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Upload de l'image de profil si elle existe
      const profilePictureUrl = await uploadImage();

      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'BiblioUser', email), {
        username,
        email,
        level: selectedLevel,
        profilePicture: profilePictureUrl,
        createdAt: Timestamp.now(),
        emailVerified: false,
        lastLoginAt: Timestamp.now()
      });

      setEmailHigh(email);
      
      // Envoyer un email de vérification en arrière-plan
      sendEmailVerification(user).catch(error => {
        console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      });

      // Afficher le message de succès
      Alert.alert(
        'Welcome!',
        'Your account has been created successfully. A verification email has been sent.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainContainer' }],
              });
            },
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      // Log l'erreur en développement uniquement
      if (__DEV__) {
        console.error('Technical error:', error);
      }

      // Messages d'erreur utilisateur
      switch (error.code) {
        case 'auth/email-already-in-use':
          Alert.alert(
            'Email Already Used',
            'An account already exists with this email.',
            [
              {
                text: 'Login',
                onPress: () => navigation.navigate('LoginScreen', { email: values.email }),
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
          break;
        case 'auth/invalid-email':
          Alert.alert(
            'Invalid Email',
            'Please enter a valid email address.'
          );
          break;
        case 'auth/operation-not-allowed':
          Alert.alert(
            'Sign Up Not Available',
            'Registration is temporarily disabled. Please try again later.'
          );
          break;
        case 'auth/weak-password':
          Alert.alert(
            'Weak Password',
            'Password should be at least 6 characters long.'
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
            'Sign Up Failed',
            'An error occurred. Please try again.'
          );
      }
    }
  };

  return (
    <KeyboardAwareScrollView>
      <ImageBackground style={{flex:1, height:HEIGHT}} source={require('../../assets/biblio1.jpg')}>
        <View style={styles.wrapper}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={getPermissionAndPickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Image 
                  source={require('../../assets/userIc2.png')} 
                  style={styles.placeholderIcon}
                />
                <View style={styles.addPhotoButton}>
                  <Text style={styles.addPhotoText}>+</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <Formik
            initialValues={{ email: '', username: '', password: '', confirmPassword: '' }}
            onSubmit={values => onSignup(values)}
            validationSchema={SignupFormSchema}
            validateOnMount={true}
          >
            {({ handleChange, handleBlur, handleSubmit, values, isValid, errors, touched }) => (
              <>
                <View style={styles.inputField}>
                  <TextInput
                    placeholderTextColor="#444"
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus={true}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                  />
                  {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.inputField}>
                  <TextInput
                    placeholderTextColor="#444"
                    placeholder="Username"
                    autoCapitalize="none"
                    textContentType="username"
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    value={values.username}
                  />
                  {errors.username && touched.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputField}>
                  <TextInput
                    placeholderTextColor="#444"
                    placeholder="Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType="password"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                <View style={styles.inputField}>
                  <TextInput
                    placeholderTextColor="#444"
                    placeholder="Confirm Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType="password"
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    value={values.confirmPassword}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedLevel}
                    onValueChange={(itemValue) => setSelectedLevel(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Level" value="" />
                    <Picker.Item label="Level 1" value="level1" />
                    <Picker.Item label="Level 2" value="level2" />
                    <Picker.Item label="Level 3" value="level3" />
                    <Picker.Item label="Level 4" value="level4" />
                    <Picker.Item label="Level 5" value="level5" />
                  </Picker>
                  {!selectedLevel && touched.password && (
                    <Text style={styles.errorText}>Please select a level</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.button(isValid && selectedLevel)}
                  onPress={handleSubmit}
                  disabled={!isValid || !selectedLevel || isLoading}
                >
                  <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Sign Up'}</Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#FA8072' }}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </View>
      </ImageBackground>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 50,
    marginHorizontal: 10,
    height: HEIGHT,
    alignContent: 'center',
    alignSelf: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff'
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    position: 'relative'
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    opacity: 0.5
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FA8072',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  addPhotoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  inputField: {
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    borderWidth: 1,
    width: 350,
  },
  pickerContainer: {
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    borderWidth: 1,
    width: 350,
    borderColor: '#ccc'
  },
  picker: {
    height: 50
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
  buttonText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 5,
    marginLeft: 5
  }
});

export default SignUpForm;