import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import elec from '../../assets/biblio/elec.jpg'
import gi from '../../assets/biblio/info.jpg'
import math from '../../assets/biblio/math.jpg'
import meca from '../../assets/biblio/meca.jpg'
import physik from '../../assets/biblio/physik.jpg'
import telcom from '../../assets/biblio/telcom.jpg'
import MenGI from '../../assets/memoire1.jpg'
import memgc from '../../assets/memoire2.jpg'
import memgind from '../../assets/memoire3.jpg'
import memgele from '../../assets/memoire4.jpg'
import memgm from '../../assets/memoire5.jpg'
import memgtel from '../../assets/memoire6.jpg'
import { db } from '../../config'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import BigRect from '../composants/BigRect'
import Cercle from '../composants/Cercle'
import PubCar from '../composants/PubCar'
import PubRect from '../composants/PubRect'
import SmallRect from '../composants/SmallRect'
import { UserContext } from '../context/UserContext'
import SimilarBooksView from './SimilarBooksView';

// Utilisation de l'adresse IP correcte du serveur Flask
const API_URL = 'http://172.20.10.6:5000';

const WIDTH = Dimensions.get('screen').width
const HEIGHT = Dimensions.get('screen').height

const VueUn = (props) => {
  const { currentUserNewNav, datUser, datUserTest } = useContext(UserContext) || {};
  const [dataWeb, setDataWeb] = useState([]);
  const [loaderWeb, setLoaderWeb] = useState(true);
  const [voirDepart, setVoirDepart] = useState('departement');
  const [popularBooks, setPopularBooks] = useState([]);
  const [userRecommendations, setUserRecommendations] = useState([]);
  const [similarUsers, setSimilarUsers] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const fetchUserRecommendations = async (email) => {
    try {
      setLoadingRecommendations(true);
      console.log('Tentative de connexion à:', `${API_URL}/recommendations/similar-users/${email}`);
      
      const response = await fetchWithTimeout(
        `${API_URL}/recommendations/similar-users/${email}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        10000
      );
      
      console.log('Statut de la réponse:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data);
      
      if (data.recommendations) {
        setUserRecommendations(data.recommendations);
        setSimilarUsers(data.similar_users || []);
      } else {
        setUserRecommendations([]);
        setSimilarUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      setUserRecommendations([]);
      setSimilarUsers([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchPopularBooks = async () => {
    try {
      console.log('Tentative de connexion à:', `${API_URL}/recommendations/popular`);
      
      const response = await fetchWithTimeout(
        `${API_URL}/recommendations/popular`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        10000
      );
      
      console.log('Statut de la réponse (populaires):', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Données populaires reçues:', data);
      
      if (data.popular_books) {
        setPopularBooks(data.popular_books);
      } else {
        setPopularBooks([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livres populaires:', error);
      setPopularBooks([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!currentUserNewNav?.email) return;
      
      try {
        await Promise.all([
          fetchUserRecommendations(currentUserNewNav.email),
          fetchPopularBooks()
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentUserNewNav?.email]);

  useEffect(() => {
    // Vérifier si le contexte est initialisé
    if (!currentUserNewNav?.email) {
      setLoaderWeb(false);
      return;
    }

    try {
      const q = query(collection(db, 'BiblioWeb'), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push(doc.data());
        });
        setDataWeb(items);
        setLoaderWeb(false);
      }, (error) => {
        console.error("Erreur lors de la récupération des données:", error);
        setLoaderWeb(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Erreur lors de l'initialisation du listener:", error);
      setLoaderWeb(false);
    }
  }, [currentUserNewNav?.email]);

  const renderRecommendationSection = () => {
    if (loadingRecommendations) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Chargement des recommandations...</Text>
        </View>
      );
    }

    if (userRecommendations.length === 0 && popularBooks.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Aucune recommandation disponible pour le moment</Text>
        </View>
      );
    }

    return (
      <View style={styles.recommendationContainer}>
        {/* Section des recommandations personnalisées */}
        {userRecommendations.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
            <Text style={styles.sectionSubtitle}>
              Basé sur {similarUsers.length} utilisateurs similaires
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userRecommendations.map((book, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bookCard}
                  onPress={() => props.navigation.navigate('Produit', {
                    name: book.nameDoc,
                    desc: book.description || '',
                    image: book.image,
                    cathegorie: book.cathegorieDoc,
                    type: book.type,
                    salle: book.salle || '',
                    etagere: book.etagere || '',
                    exemplaire: book.exemplaire || 1,
                    commentaire: book.commentaire || [],
                    nomBD: 'BiblioLivre',
                    datUser: datUser
                  })}
                >
                  <Image
                    source={{ uri: book.image }}
                    style={styles.bookImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.nameDoc}
                    </Text>
                    <Text style={styles.bookCategory}>
                      {book.cathegorieDoc} • {book.type}
                    </Text>
                    <Text style={styles.similarityScore}>
                      {Math.round(book.similarity_score)}% pertinent
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Section des livres populaires */}
        {popularBooks.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Populaire dans la bibliothèque</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {popularBooks.map((book, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bookCard}
                  onPress={() => props.navigation.navigate('Produit', {
                    name: book.nameDoc,
                    desc: book.description || '',
                    image: book.image,
                    cathegorie: book.cathegorieDoc,
                    type: book.type,
                    salle: book.salle || '',
                    etagere: book.etagere || '',
                    exemplaire: book.exemplaire || 1,
                    commentaire: book.commentaire || [],
                    nomBD: 'BiblioLivre',
                    datUser: datUser
                  })}
                >
                  <Image
                    source={{ uri: book.image }}
                    style={styles.bookImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.nameDoc}
                    </Text>
                    <Text style={styles.bookCategory}>
                      {book.cathegorieDoc} • {book.type}
                    </Text>
                    <Text style={styles.popularityScore}>
                      {book.popularity_score} consultations
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  // Afficher un loader pendant le chargement initial
  if (loaderWeb) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Rediriger vers la connexion si pas d'utilisateur
  if (!currentUserNewNav?.email) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Veuillez vous connecter pour accéder à cette page</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => props.navigation.navigate('LoginScreen')}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.barre}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          style={{ flexDirection: 'row' }}
        >
          <TouchableOpacity>
            <Text style={{ fontFamily: 'Georgia', fontSize: 20, marginRight: 10, color: 'gray' }}></Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView>
        <PubCar />
        <PubRect />

        <View style={{ margin: 5, marginBottom: 47, marginTop: 10 }}>
          <View>
            <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 15, fontFamily: 'Georgia', fontWeight: '900' }}>
              #Biblio Electronique
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View>
              <Text style={{ textAlign: 'center', margin: 10, fontFamily: 'Georgia' }}>
                Lisez en ligne sur les plus grandes plateformes de e-book du monde.
              </Text>
            </View>
          </View>

          <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
            {dataWeb.map((e, index) => (
              <SmallRect key={index} props={props} image={e.image} chemin={e.chemin} name={e.name} />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 0.5, width: WIDTH, backgroundColor: 'gray' }}></View>

        

        <View style={{ height: 0.5, width: WIDTH, backgroundColor: 'gray' }}></View>

        {renderRecommendationSection()}

        <View style={{ height: 0.5, width: WIDTH, backgroundColor: 'gray' }}></View>
        <SimilarBooksView ></SimilarBooksView>
        <View style={{ height: 0.5, width: WIDTH, backgroundColor: 'gray' }}></View>


        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
          <TouchableOpacity
            onPress={() => setVoirDepart('departement')}
            style={{
              backgroundColor: voirDepart == 'departement' ? 'rgb(136,136,136)' : 'rgb(32,32,32)',
              borderRadius: 10,
              shadowColor: '#171717',
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
            }}
          >
            <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#fff', margin: 10 }}>
              DEPARTEMENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setVoirDepart('memoire')}
            style={{
              backgroundColor: voirDepart == 'memoire' ? 'rgb(136,136,136)' : 'rgb(32,32,32)',
              borderRadius: 10,
              shadowColor: '#171717',
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: '#fff',
                margin: 10,
                marginLeft: 12,
              }}
            >
              MEMOIRES
            </Text>
          </TouchableOpacity>
        </View>

        {voirDepart == 'departement' ? (
          <View style={{ margin: 5, marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: 'Georgia',
                fontSize: 20,
                color: '#000',
                textAlign: 'center',
                marginBottom: 20,
                margin: 20,
              }}
            >
              LES DEPARTEMENTS
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={meca} cathegorie="Genie Mecanique" props={props} />
              <Cercle id="" datUser={datUser} image={gi} cathegorie="Genie Informatique" props={props} />
              <Cercle id="" datUser={datUser} image={math} cathegorie="Mathematique" props={props} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={elec} cathegorie="Genie Electrique" props={props} />
              <Cercle id="" datUser={datUser} image={physik} cathegorie="Physique" props={props} />
              <Cercle id="" datUser={datUser} image={telcom} cathegorie="Genie Telecom" props={props} />
            </View>
          </View>
        ) : (
          <View style={{ margin: 5, marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: 'Georgia',
                fontSize: 20,
                color: '#000',
                textAlign: 'center',
                marginBottom: 20,
                margin: 20,
              }}
            >
              ANCIENS MEMOIRES
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={MenGI} cathegorie="Memoire GI" props={props} />
              <Cercle id="" datUser={datUser} image={memgc} cathegorie="Memoire GC" props={props} />
              <Cercle id="" datUser={datUser} image={memgm} cathegorie="Memoire GM" props={props} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={memgind} cathegorie="Memoire GInd" props={props} />
              <Cercle id="" datUser={datUser} image={memgele} cathegorie="Memoire GEle" props={props} />
              <Cercle id="" datUser={datUser} image={memgtel} cathegorie="Memoire GTel" props={props} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  barre: {
    marginTop: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  popularBooksSection: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Georgia',
    color: '#333',
  },
  popularBooksScroll: {
    marginBottom: 15,
  },
  bookCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Georgia',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  borrowCount: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  borrowCountText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Georgia',
  },
  recommendationContainer: {
    paddingVertical: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  bookCard: {
    width: 160,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  similarityScore: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  popularityScore: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
})

export default VueUn