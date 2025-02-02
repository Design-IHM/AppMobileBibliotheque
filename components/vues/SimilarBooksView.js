import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFirebase } from '../context/FirebaseContext';
import { API_URL } from '../../apiConfig';

// Données de repli pour les livres similaires
const fallbackBooks = [
  {
    id: '1',
    title: 'Introduction à la Programmation',
    category: 'Informatique',
    description: 'Les bases de la programmation pour débutants',
    image: 'https://example.com/image1.jpg'
  },
  {
    id: '2',
    title: 'Algorithmes et Structures de Données',
    category: 'Informatique',
    description: 'Concepts fondamentaux des algorithmes',
    image: 'https://example.com/image2.jpg'
  }
];

const SimilarBooksView = () => {
  const [title, setTitle] = useState('');
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isFirebaseReady } = useFirebase();

  const fetchSimilarBooks = async () => {
    if (!title.trim()) {
      alert('Veuillez entrer un titre de livre.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Tentative de connexion à:', `${API_URL}/similarbooks`);
      console.log('Données envoyées:', { title: title.trim() });

      const response = await fetch(`${API_URL}/similarbooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      console.log('Statut de la réponse:', response.status);
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);

      if (!response.ok) {
        if (response.status === 500) {
          console.log('Erreur serveur, utilisation des données de repli');
          setSimilarBooks(fallbackBooks);
          return;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Données reçues:', data);

      if (!data || !data.books) {
        console.log('Format de réponse invalide, utilisation des données de repli');
        setSimilarBooks(fallbackBooks);
      } else {
        setSimilarBooks(data.books);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la récupération des livres similaires.');
      setSimilarBooks(fallbackBooks);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookCategory}>{item.category}</Text>
      <Text style={styles.bookDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Entrez le titre d'un livre"
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={fetchSimilarBooks}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={similarBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  bookItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookDescription: {
    fontSize: 14,
    color: '#333',
  },
});

export default SimilarBooksView;
