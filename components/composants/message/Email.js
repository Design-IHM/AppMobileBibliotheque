import { View, Text, SafeAreaView, TextInput, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, StatusBar, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect, useContext, createContext, useRef } from 'react'
import { UserContext } from '../../context/UserContext'
import { doc, updateDoc, arrayUnion, collection, Timestamp, onSnapshot, setDoc, getFirestore } from "firebase/firestore";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { onAuthStateChanged } from "firebase/auth"
import { auth } from '../../../config';
import { getDoc, getDocs } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import MessageBubble from './MessageBubble';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import ChatBackground from './ChatBackground';

const db = getFirestore();

const HEIGHT = Dimensions.get('window').height
const WIDTH = Dimensions.get('window').width

const MessageContexte = createContext({
  signale: true,
  setSignale: () => {}
})

const Email = () => {
  const {datUser, setDatUser, datUserTest, setDatUserTest} = useContext(UserContext)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [values, setValues] = useState("")
  const [dat, setDat] = useState(0)
  const [mes, setMes] = useState([])
  const [data, setData] = useState([])
  const [loader, setLoader] = useState(true)
  const [signale, setSignale] = useState(true)
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setCurrentUserEmail(currentUser)
    })
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setDatUserTest(false);
    }, 500);
  }, []);

  function subscriber() {
    if (!datUser?.email) return;
    
    const docRef = doc(db, 'BiblioUser', datUser.email);
    onSnapshot(docRef, (documentSnapshot) => {
      if (documentSnapshot.exists()) {
        const userData = documentSnapshot.data();
        if (!userData.messages) {
          userData.messages = [];
        }
        setDat(userData);
        setDatUser(userData);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const newUserData = {
          email: datUser.email,
          messages: []
        };
        setDoc(docRef, newUserData);
        setDat(newUserData);
        setDatUser(newUserData);
      }
    });
  }

  function getData() {
    const colRef = collection(db, 'BiblioUser');
    onSnapshot(colRef, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setData(items);
      setLoader(false);
    });
  }

  useEffect(() => {
    getData();
    subscriber();
  }, []);

  async function ajouter() {
    if (!currentUserEmail?.email || !values.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const washingtonRef = doc(db, "BiblioUser", currentUserEmail.email);
    const dt = Timestamp.fromDate(new Date());
    
    try {
      await updateDoc(washingtonRef, {
        messages: arrayUnion({"recue":"E", "texte": values.trim(), "heure": dt})
      });
      await res();
      setValues("");
      scrollToBottom();
    } catch (error) {
      console.error("Error adding message:", error);
    }
  }

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const res = async function() {
    try {
      const docRef = doc(db, 'MessagesEnvoyé', values);
      await setDoc(docRef, {
        email: datUser.email,
        messages: values,
        nom: datUser.email
      });
    } catch (error) {
      console.error("Error in res:", error);
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <MessageContexte.Provider value={{signale, setSignale}}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ChatBackground />
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <BlurView intensity={20} tint="dark" style={styles.headerContent}>
              <Image 
                source={require('../../../assets/userIcone.png')} 
                style={styles.adminAvatar}
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.adminName}>Bibliothèque ENSPY</Text>
                <Text style={styles.adminStatus}>Service d'assistance</Text>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Messages */}
          <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.messagesContainer}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {datUserTest ? null : !datUser ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#D97706" />
                  <Text style={styles.loadingText}>Chargement de la conversation...</Text>
                </View>
              ) : (
                <>
                  {datUser.messages?.length > 0 ? (
                    datUser.messages.map((dev, index) => (
                      <MessageBubble
                        key={index}
                        message={dev.texte}
                        time={formatTime(dev.heure)}
                        isReceived={dev.recue === "R"}
                        isLast={index === datUser.messages.length - 1}
                      />
                    ))
                  ) : (
                    <Animated.View 
                      style={[styles.welcomeContainer, { opacity: fadeAnim }]}
                    >
                      <LinearGradient
                        colors={['#D97706', '#B45309']}
                        style={styles.welcomeIconContainer}
                      >
                        <Image 
                          source={require('../../../assets/userIcone.png')}
                          style={styles.welcomeIcon}
                        />
                      </LinearGradient>
                      <Text style={styles.welcomeTitle}>
                        Bienvenue dans le chat!
                      </Text>
                      <Text style={styles.welcomeText}>
                        Notre équipe est là pour vous aider avec toutes vos questions concernant la bibliothèque.
                      </Text>
                    </Animated.View>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>

          {/* Input Zone */}
          <BlurView intensity={30} tint="light" style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.messageInput}
                placeholder="Écrivez votre message..."
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => {
                  setValues(text);
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }}
                value={values}
                multiline
                maxLength={500}
                onContentSizeChange={() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }}
              />
              <TouchableOpacity
                onPress={ajouter}
                style={styles.sendButton}
                disabled={!values.trim()}
              >
                <LinearGradient
                  colors={values.trim() ? ['#D97706', '#B45309'] : ['#D1D5DB', '#9CA3AF']}
                  style={styles.sendButtonGradient}
                >
                  <Image
                    source={require('../../../assets/send.png')}
                    style={[styles.sendIcon, !values.trim() && styles.sendIconDisabled]}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MessageContexte.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingTop: StatusBar.currentHeight,
  },
  headerGradient: {
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    overflow: 'hidden',
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  adminName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  adminStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    paddingVertical: 20,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: HEIGHT * 0.15,
  },
  welcomeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    tintColor: '#fff',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingRight: 45,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  sendIconDisabled: {
    opacity: 0.5,
  },
});

export default Email;