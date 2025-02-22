import { useNavigation } from '@react-navigation/native';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../config'; 
import { UserContextNavApp } from '../navigation/NavApp';

// Fonction pour normaliser les chaînes (supprimer les accents)
const normalizeString = (str) => {
  if (!str) return ''; // Retourner une chaîne vide si str est undefined ou null
  return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim();
};

const BigRect = ({ salle, desc, etagere, exemplaire, image, name, cathegorie, datUser, commentaire, nomBD, type }) => {
  const navigation = useNavigation();  
  const { currentUserdata } = useContext(UserContextNavApp);

  const [modalVisible, setModalVisible] = useState(false);

  const voirProduit = () => {
    // S'assurer que name est défini avant de le normaliser
    const normalizedName = name ? normalizeString(name) : '';
    console.log('Navigation vers Produit:', {
      name: name,
      normalized: normalizedName,
      cathegorie: cathegorie
    });

    navigation.navigate('Produit', {
      salle,
      desc,
      etagere,
      exemplaire,
      image,
      name,
      normalizedName,
      cathegorie,
      datUser,
      commentaire,
      nomBD,
      type,
    });
  };

  const ajouter = async () => {
    try {
      if (currentUserdata?.email) {
        const userRef = doc(db, 'BiblioUser', currentUserdata.email);
        await updateDoc(userRef, {
          docRecentRegarder: arrayUnion({ cathegorieDoc: cathegorie, type }),
        });
      }
      voirProduit();
    } catch (error) {
      console.error("Error adding to Firebase:", error);
    }
  };

  return (
    <View style={styles.contain}>
      <TouchableOpacity onPress={ajouter}>
        <ImageBackground 
          style={styles.container} 
          source={{ uri: image }}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name ? (name.length > 10 ? `${name.slice(0, 10)}...` : name) : ''}</Text>
        <Text style={styles.exemplaire}>{exemplaire} ex(s)</Text>
      </View>
      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <TouchableOpacity onPress={() => setModalVisible(!modalVisible)} style={styles.modal}>
          <TouchableOpacity onPress={() => setModalVisible(!modalVisible)} style={styles.modalButton}>
            <Text style={styles.modalText}>Pas intéressé</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(!modalVisible)} style={styles.modalButton}>
            <Text style={styles.modalText}>Image inappropriée</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contain: {
    height: 150,
    width: 100,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  container: {
    height: '100%',
    width: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  exemplaire: {
    fontSize: 10,
    color: '#555',
  },
  modal: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 10,
    height: 230,
    width: 150,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  modalButton: {
    backgroundColor: 'white',
    width: '60%',
    height: 35,
    alignSelf: 'center',
    marginVertical: 5,
    borderRadius: 10,
  },
  modalText: {
    textAlign: 'center',
    marginTop: 10,
  },
});

export default BigRect;
