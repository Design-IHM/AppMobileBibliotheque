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
import { collection, onSnapshot, orderBy, query, getDocs, doc, getDoc } from 'firebase/firestore'
import BigRect from '../composants/BigRect'
import Cercle from '../composants/Cercle'
import PubCar from '../composants/PubCar'
import PubRect from '../composants/PubRect'
import SmallRect from '../composants/SmallRect'
import { UserContext } from '../context/UserContext'
import { API_URL } from '../../apiConfig'

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
    if (!email) return;
  
    try {
      setLoadingRecommendations(true);
      const response = await fetch(`${API_URL}/recommendations/similar-users/${encodeURIComponent(email)}`);
      const data = await response.json();
    
      if (data.recommendations) {
        setUserRecommendations(data.recommendations);
        setSimilarUsers(data.similar_users || []);
      } else {
        console.log('Pas de recommendations dans la réponse');
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
      const collections = ['BiblioGE', 'BiblioGI', 'BiblioGM', 'BiblioGT', 'BiblioInformatique'];
      let allBooks = [];

      for (const collectionName of collections) {
        const booksRef = collection(db, collectionName);
        const querySnapshot = await getDocs(booksRef);
        
        querySnapshot.forEach((doc) => {
          const bookData = doc.data();
          if (bookData && bookData.name && bookData.commentaire) {
            // Calculer la note moyenne
            const ratings = bookData.commentaire
              .map(c => Number(c.note))
              .filter(note => !isNaN(note));
            
            const averageRating = ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;

            allBooks.push({
              id: doc.id,
              title: bookData.name,
              category: bookData.cathegorie,
              image: bookData.image,
              description: bookData.desc,
              exemplaire: bookData.exemplaire,
              averageRating,
              numberOfRatings: ratings.length
            });
          }
        });
      }

      // Trier par note moyenne et nombre d'avis
      const popular = allBooks
        .sort((a, b) => {
          if (b.averageRating === a.averageRating) {
            return b.numberOfRatings - a.numberOfRatings;
          }
          return b.averageRating - a.averageRating;
        })
        .slice(0, 10);

      setPopularBooks(popular);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres populaires:', error);
      setPopularBooks([]);
    }
  };

  const fetchSimilarUsersRecommendations = async (email) => {
  if (!email) return;

  try {
    setLoadingRecommendations(true);
    
    // Récupérer tous les utilisateurs de la base de données
    const usersRef = collection(db, "BiblioUser");
    const usersSnapshot = await getDocs(usersRef);
    
    // Récupérer l'historique de l'utilisateur actuel
    const userRef = doc(db, "BiblioUser", email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const userHistory = userData.historique || [];
    const userCategories = new Set(userHistory.map(item => item.cathegorieDoc));
    const userBooks = new Set(userHistory.map(item => item.nameDoc));

    // Structure pour stocker les scores de similarité de tous les utilisateurs
    let allSimilarUsers = [];
    let bookRecommendations = new Map();

    // Analyser chaque utilisateur dans la base de données
    usersSnapshot.forEach(doc => {
      if (doc.id !== email) { // Exclure l'utilisateur actuel
        const otherUserData = doc.data();
        const otherUserHistory = otherUserData.historique || [];
        const otherUserCategories = new Set(otherUserHistory.map(item => item.cathegorieDoc));
        
        // Calculer plusieurs facteurs de similarité
        const commonCategories = [...userCategories].filter(cat => otherUserCategories.has(cat));
        const categorySimScore = commonCategories.length / Math.max(userCategories.size, otherUserCategories.size);
        
        // Calculer la similarité basée sur les livres communs
        const commonBooks = otherUserHistory.filter(item => userBooks.has(item.nameDoc)).length;
        const bookSimScore = commonBooks / Math.max(userHistory.length, otherUserHistory.length);
        
        // Score de similarité global
        const similarityScore = (categorySimScore * 0.6) + (bookSimScore * 0.4);

        if (similarityScore > 0.2) { // Seuil de similarité ajusté
          allSimilarUsers.push({
            email: doc.id,
            similarity: similarityScore,
            history: otherUserHistory
          });

          // Collecter les recommandations de cet utilisateur
          otherUserHistory.forEach(item => {
            if (!userBooks.has(item.nameDoc)) {
              const key = item.nameDoc;
              const current = bookRecommendations.get(key) || {
                count: 0,
                similaritySum: 0,
                title: item.nameDoc,
                category: item.cathegorieDoc,
                image: item.image,
                description: item.desc,
                type: item.type
              };
              current.count++;
              current.similaritySum += similarityScore;
              bookRecommendations.set(key, current);
            }
          });
        }
      }
    });

    // Trier les utilisateurs similaires par score de similarité
    allSimilarUsers = allSimilarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Garder les 5 utilisateurs les plus similaires

    // Calculer les scores finaux des recommandations
    const recommendations = Array.from(bookRecommendations.values())
      .map(book => ({
        ...book,
        similarity_score: (book.similaritySum / book.count) * 100 // Score moyen pondéré
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10); // Garder les 10 meilleures recommandations

    setSimilarUsers(allSimilarUsers);
    setUserRecommendations(recommendations);

  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    setSimilarUsers([]);
    setUserRecommendations([]);
  } finally {
    setLoadingRecommendations(false);
  }
};

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingRecommendations(true);
        await Promise.all([
          fetchPopularBooks(),
          currentUserNewNav?.email ? fetchSimilarUsersRecommendations(currentUserNewNav.email) : Promise.resolve()
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadData();
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
  const API_URL = "https://recommendation.up.railway.app";

  if (loadingRecommendations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement des recommandations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.recommendationContainer}>
      {/* Section des recommandations personnalisées */}
      {userRecommendations.length > 0 && (
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
                  name: book.title,
                  desc: book.description || '',
                  image: book.image,
                  cathegorie: book.category,
                  type: book.type || '',
                  salle: book.salle || '',
                  etagere: book.etagere || '',
                  exemplaire: book.exemplaire || 0,
                  nomBD: 'BiblioInformatique',
                  commentaire: book.commentaire || []
                })}
              >
                <Image
                  source={{ uri: book.image }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookCategory}>
                    {book.category} • {book.type || 'Non spécifié'}
                  </Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.similarityScore}>
                      {Math.round(book.similarity_score || 40)}% pertinent
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Section des livres populaires */}
      {popularBooks.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Populaire dans la bibliothèque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularBooks.map((book, index) => (
              <TouchableOpacity
                key={index}
                style={styles.bookCard}
                onPress={() => props.navigation.navigate('Produit', {
                  name: book.title,
                  desc: book.description || '',
                  image: book.image,
                  cathegorie: book.category,
                  type: book.type || '',
                  salle: book.salle || '',
                  etagere: book.etagere || '',
                  exemplaire: book.exemplaire || 0,
                  nomBD: 'BiblioInformatique',
                  commentaire: book.commentaire || []
                })}
              >
                <Image
                  source={{ uri: book.image }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookCategory}>
                    {book.category} • {book.type || 'Non spécifié'}
                  </Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.consultationScore}>
                      {book.numberOfRatings || 0} consultations
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Ajoutez ces nouveaux styles à votre StyleSheet
const styles = StyleSheet.create({
  // ... autres styles existants ...
  
  recommendationContainer: {
    flex:1,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bookCard: {
   width: 160,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  bookImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
    fontFamily: 'Georgia',
  },
  bookCategory: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Georgia',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Georgia',
  },
  similarityScore: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  consultationScore: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
      backgroundColor: '#fff',
    },
    loadingText: {
      marginTop: 10,
      color: '#666',
      fontFamily: 'Georgia',
    }
  });


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
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 15,
    marginBottom: 8,
    color: '#2c3e50',
    fontFamily: 'Georgia',
  },
  popularBooksScroll: {
    marginBottom: 15,
  },
  bookCard: {
    width: 180,
    marginLeft: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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