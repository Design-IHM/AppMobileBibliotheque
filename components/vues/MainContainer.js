import { View, Text, SafeAreaView, Image, Dimensions, TouchableOpacity, FlatList, Modal, ScrollView, TextInput, StyleSheet, Button, ActivityIndicator, Linking } from 'react-native'
import React, { createContext, useState, useEffect, useContext } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config'
import { collection, getDocs, doc, updateDoc, query, where, limit } from 'firebase/firestore'

// Créer un seul contexte utilisateur (suppression du doublon)
export const UserContext = createContext()

import SearchModal from '../composants/SearchModal';

//Screens
import VueUn from './VueUn'
import PubCar from '../composants/PubCar'
import PubRect from '../composants/PubRect'
import Messages from './Messages'
import Email from '../composants/message/Email'
import Recommend from '../composants/Recommend'
import Produit from '../composants/achats/Produit'
import Panier from '../composants/achats/Panier'
import FichePaie from '../composants/achats/FichePaie'
import Accueil from '../openclassroom/Accueil'
import Departement from '../openclassroom/Departement'
import Semestre from '../openclassroom/Semestre'
import TableMatiere from '../openclassroom/TableMatiere'
import Matiere from '../openclassroom/Matiere'
import Cours from '../openclassroom/Cours'
import Quizz from '../openclassroom/Quizz'
import NavOpenClass from '../navigation/NavOpenClass'
import NavShop from '../navigation/NavShop'
import BigRect from '../composants/BigRect'
import Carre from '../parameter/Carre'
import PageWeb2 from '../composants/PageWeb2'
import Parametre from './Parametre'
import NavParams from '../navigation/NavParams'

// Screen names
const homeName = 'Home'
const detailsName = 'Settings'
const settingsName = 'E-learning'
const search = 'Search'
const messagesName = 'Chat'

//Dimension
const HEIGHT = Dimensions.get('window').height
const WIDTH = Dimensions.get('window').width

const Tab = createBottomTabNavigator();

// Suppression du doublon de contexte
// Utilisation du UserContext défini plus haut

const MainContainer = ({ navigation, route }) => {
  const screenOptions = ({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      switch (route.name) {
        case 'Home':
          iconName = focused ? 'home' : 'home-outline';
          break;
        case 'Messages':
          iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          break;
        case 'OpenClass':
          iconName = focused ? 'school' : 'school-outline';
          break;
        case 'Shop':
          iconName = focused ? 'cart' : 'cart-outline';
          break;
        default:
          iconName = 'help-outline';
          break;
      }

      return <Ionicons name={iconName} size={size} color={color}/>;
    }
  });

  const voirMessage = () => {
    navigation.navigate('Panier', {})
  }

  const handlePress = () => {
    Linking.openURL('https://www.google.com').catch(err => {
      console.error("Erreur lors de l'ouverture de Google :", err);
    });
  };

  const [modal, setModal] = useState(false);
  const [datUser1, setDatUser1] = useState(route.params?.datUser || null);
  const [VuePartCours, setPartVueCours] = useState("");
  const [signalMain, setSignalMain] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  function lire() {
    setSignalMain(true)
    navigation.navigate('Email')
  }

  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(true);

  const getData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "BiblioInformatique"));
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setData(items);
      setDatUser1(items);
      setLoader(false);
    } catch (error) {
      console.error("Error getting documents: ", error);
      setLoader(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const annuler = async (dos) => {
    try {
      const userRef = doc(db, "BiblioUser", dos.email);
      await updateDoc(userRef, {
        tabMessages: [""],
        signalMessage: 'ras'
      });
      navigation.navigate('Email');
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
      <UserContext.Provider value={{ VuePartCours, setPartVueCours, modal, setModal, signalMain, setSignalMain, datUser1 }}>
        <React.Fragment>
          <Tab.Navigator
              initialRouteName={homeName}
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;
                  let rn = route.name;

                  if (rn === homeName) {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (rn === detailsName) {
                    iconName = focused ? 'cog' : 'cog-outline';
                  } else if (rn === settingsName) {
                    iconName = focused ? 'book' : 'book-outline';
                  } else if (rn === search) {
                    iconName = focused ? 'search' : 'search-outline';
                  } else if(rn === messagesName) {
                    iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                  }
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF8A50',
                tabBarInactiveTintColor: 'gray',
              })}
          >
            {!signalMain ? (
                <Tab.Screen
                    name={homeName}
                    component={NavShop}
                    options={{
                      headerTitle: (props) => (
                          <SafeAreaView>
                            <View style={styles.headerContainer}>
                              <View style={styles.logoContainer}>
                                <Image
                                    style={styles.logo}
                                    source={require('../../assets/enspy.jpg')}
                                />
                                <Text style={styles.title}>BIBLIO ENSPY</Text>
                              </View>
                              <TouchableOpacity onPress={handlePress}>
                                <FontAwesome name="google" size={24} color="blue" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
                                <Ionicons name="search-outline" size={24} color="black" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => navigation.navigate('Panier')}>
                                <Ionicons name="cart-outline" size={24} color="black" />
                              </TouchableOpacity>
                            </View>
                          </SafeAreaView>
                      ),
                      headerTitleAlign: 'center',
                      headerTitleStyle: { flex: 1, textAlign: 'center' },
                    }}
                />
            ) : (
                <Tab.Screen
                    name={homeName}
                    component={NavShop}
                    options={{
                      headerTitle: (props) => (
                          <SafeAreaView>
                            <View style={styles.headerContainer}>
                              <View style={styles.logoContainer}>
                                <Image
                                    style={styles.logo}
                                    source={require('../../assets/enspy.jpg')}
                                />
                                <Text style={styles.title}>E N S P Y</Text>
                              </View>
                              <TouchableOpacity onPress={handlePress}>
                                <FontAwesome name="google" size={24} color="blue" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
                                <Ionicons name="search-outline" size={24} color="black" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => navigation.navigate('Panier')}>
                                <Ionicons name="cart-outline" size={24} color="black" />
                              </TouchableOpacity>
                            </View>
                          </SafeAreaView>
                      ),
                      headerTitleAlign: 'center',
                      headerTitleStyle: { flex: 1, textAlign: 'center' },
                    }}
                />
            )}
            <Tab.Screen name={settingsName} component={NavOpenClass} />
            <Tab.Screen name={messagesName} component={Email} />
            <Tab.Screen name={detailsName} component={NavParams} />
          </Tab.Navigator>

          <SearchModal
              visible={searchModalVisible}
              onClose={() => setSearchModalVisible(false)}
              navigation={navigation}
          />

        </React.Fragment>
      </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: WIDTH,
    padding: 5,
  },
  messageIcon: {
    width: 35,
    height: 35,
    borderRadius: 50,
    marginRight: 35,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 40,
    width: 40,
    borderRadius: 50,
    marginBottom: 5,
  },
  title: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'San Francisco',
    marginLeft: 5,
    marginRight: 15,
  },
  searchIcon: {
    width: 35,
    height: 35,
    borderRadius: 50,
    opacity: 0.5,
  },
  cartIcon: {
    width: 35,
    height: 35,
    borderRadius: 50,
    marginRight: 15,
    opacity: 0.5,
  },
});

export default MainContainer;