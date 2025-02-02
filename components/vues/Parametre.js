import { Dimensions, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal, Pressable, Button, Alert } from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import Dialog from "react-native-dialog"
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { MaterialIcons } from '@expo/vector-icons'
const WIDTH = Dimensions.get('screen').width
const HEIGHT = Dimensions.get('screen').height
const Teb = ["","","",""]
import { auth, db } from '../../config'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { UserContext } from '../context/UserContext'

export default function Parametre(props) {
  const {currentUserNewNav} = useContext(UserContext)
  const [datUserParams, setDatUserParams] = useState('')
  const [testT, setTestT] = useState(true)
  const [modalCart, setModalCart] = useState(false)
  const [imageCart, setimageCart] = useState("")
  const [nameCart, setnameCart] = useState("")
  const [descCart, setdescCart] = useState("")
  const [visible, setVisible] = useState(false)

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
        if (currentUserNewNav?.email) {
          try {
            await updateDoc(doc(db, "BiblioUser", currentUserNewNav.email), {
              imageUri: result.assets[0].uri
            });
            Alert.alert("Succès", "Photo de profil mise à jour avec succès");
          } catch (error) {
            console.error("Erreur lors de la mise à jour de l'image:", error);
            Alert.alert("Erreur", "Impossible de mettre à jour la photo de profil");
          }
        } else {
          Alert.alert("Erreur", "Vous devez être connecté pour modifier votre photo de profil");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const showDialog = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleDelete = () => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'NavLogin' }],
    });
    setVisible(false);
  };

  useEffect(() => {
    if (!currentUserNewNav?.email) {
      console.log("Pas d'email utilisateur disponible");
      return;
    }

    setTimeout(() => {
      setTestT(false);
    }, 500);

    try {
      const unsubscribe = onSnapshot(
        doc(db, 'BiblioUser', currentUserNewNav.email),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setDatUserParams(docSnapshot.data());
          } else {
            console.log("Aucune donnée utilisateur trouvée");
          }
        },
        (error) => {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Erreur lors de la configuration du listener:", error);
    }
  }, [currentUserNewNav?.email]);

  if (testT) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const Carte=({dev})=>{
    return(
      <TouchableOpacity onPress={()=>voirCart(dev.image,dev.nameDoc,dev.desc)} style={{height:259,width:180,margin:10}}>
      <View style={{height:250,width:180,borderRadius:20,margin:5,backgroundColor:'#DCDCDC'}}>
      <Image source={{uri:dev.image}} style={{height:250,width:180,borderRadius:20}}/>
      </View>
      <Text style={{margin:5,}}>{dev.nameDoc}</Text>
    </TouchableOpacity>
    )
  }

  function voirCart (image,nameDoc,desc){
    setimageCart(image)
    setnameCart(nameDoc)
    setdescCart(desc)
    setModalCart(true)
  }

  function Modif(imageM,nameM,emailM,telM,departM,niveauM){
    props.navigation.navigate('Parametre2',{
      imageM:imageM,
      nameM:nameM,
      emailM:emailM,
      telM:telM,
      departM:departM,
      niveauM:niveauM
    })
  }

  const renderHistorique = () => {
    if (!datUserParams?.historique || datUserParams.historique.length === 0) {
      return (
        <View style={styles.emptyHistoryContainer}>
          <Text style={styles.emptyHistoryText}>Aucun livre consulté</Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
        {datUserParams.historique
          .sort((a, b) => b.dateVue.toDate() - a.dateVue.toDate())
          .map((book, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => props.navigation.navigate('Produit', {
                name: book.nameDoc,
                desc: book.desc,
                image: book.image,
                cathegorie: book.cathegorieDoc,
                type: book.type,
                salle: book.salle || '',
                etagere: book.etagere || '',
                exemplaire: book.exemplaire || 1,
                commentaire: book.commentaire || [],
                nomBD: 'BiblioLivre',
                datUser: datUserParams
              })}
            >
              <Image
                source={{ uri: book.image }}
                style={styles.historyImage}
                resizeMode="cover"
              />
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle} numberOfLines={2}>
                  {book.nameDoc}
                </Text>
                <Text style={styles.historyCategory}>
                  {book.cathegorieDoc} • {book.type}
                </Text>
                <Text style={styles.historyDate}>
                  Consulté le {book.dateVue.toDate().toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{margin:10}}>
          <View style={{flexDirection:'row',justifyContent:'flex-end',margin:1,height:25,marginBottom:10}}>
            <TouchableOpacity 
              onPress={showDialog} 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 15,
                paddingVertical: 10,
                position: 'absolute',
                right: 10,
                top: 10
              }}
            >
              <MaterialIcons 
                name="logout" 
                size={28} 
                color="#ff0000"
                style={{marginRight: 5}}
              />
              <Text style={{
                fontSize: 13,
                fontWeight: '900',
                color: '#000'
              }}>
                Déconnexion
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => Modif(
              datUserParams?.imageUri || '',
              datUserParams?.name || '',
              datUserParams?.email || '',
              datUserParams?.tel || '',
              datUserParams?.departement || '',
              datUserParams?.niveau || ''
            )} 
            style={{backgroundColor:'#DCDCDC',height:150,marginTop:20,flexDirection:'row',borderRadius:20,margin:10,alignSelf:'center',width:WIDTH*0.9}}
          >
            <TouchableOpacity 
              onPress={pickImage}
              style={{
                height: 120,
                width: 120,
                borderRadius: 80,
                backgroundColor: '#f0f0f0',
                margin: 5,
                marginLeft: 25,
                marginTop: 15,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {datUserParams?.imageUri ? (
                <Image 
                  style={{
                    height: 120,
                    width: 120,
                    borderRadius: 80
                  }} 
                  source={{ uri: datUserParams.imageUri }}
                />
              ) : (
                <Image 
                  style={{
                    height: 120,
                    width: 120,
                    borderRadius: 80
                  }} 
                  source={require('../../assets/userIc2.png')}
                />
              )}
              <View style={{
                position: 'absolute',
                bottom: 5,
                right: 5,
                backgroundColor: '#4a90e2',
                borderRadius: 15,
                padding: 8,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{marginTop:25}}>
              <Text style={{fontSize:17,fontWeight:'900'}}>
                {datUserParams?.name ? (datUserParams.name.length > 10 ? datUserParams.name.slice(0,10) + "..." : datUserParams.name) : "Sans nom"}
              </Text>
              <Text style={{fontSize:15,color:'gray'}}>{datUserParams?.email || 'Email non défini'}</Text>
              <Text style={{fontSize:15,color:'gray'}}>{datUserParams?.departement || 'Département non défini'}</Text>
              <Text style={{fontSize:15,color:'gray'}}>niveau : {datUserParams?.niveau || 'Non défini'}</Text>
              <Text style={{fontSize:15,color:'gray'}}>{datUserParams?.tel || 'Téléphone non défini'}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des consultations</Text>
          {renderHistorique()}
        </View>

        <ImageBackground source={require('../../assets/bibi.jpg')}  style={{height:150,width:WIDTH}}></ImageBackground>
        
        <Modal animationType='slide'
        transparent={false}
        visible={modalCart}
        onRequestClose={() => {
          setModalCart(!modalCart)
        }}
        >
          <SafeAreaView>
          <Pressable onPress={()=>setModalCart(false)} style={{height:HEIGHT,backgroundColor:'rgba(255, 255, 255, 0.1)',alignContent:'center',padding:20}}>
            <Image resizeMode='contain' style={{height:250,width:WIDTH,alignSelf:'center',marginTop:20}} source={{uri:imageCart}} />
            <View style={{flexDirection:'row'}}>
            <Text style={{fontSize:20,fontWeight:'300',margin:5}}>nom :</Text>
            <Text style={{fontSize:20,fontWeight:'500',margin:5}}>{nameCart}</Text>
            </View>

            <View style={{flexDirection:'row',width:WIDTH*0.8,flexWrap:'wrap'}}>
            <Text style={{fontSize:20,fontWeight:'300',margin:5}}>Description :</Text>
            <Text style={{fontSize:15,fontWeight:'500',margin:5}}> {descCart} </Text>
            </View>
          </Pressable>
          </SafeAreaView>
        </Modal>

        <View style={styles.container}>
        
        <Dialog.Container visible={visible}>
          <Dialog.Title>Deconnexion</Dialog.Title>
          <Dialog.Description>
            Voulez-vous vraiment vous deconnecter ? 
          </Dialog.Description>
          <Dialog.Button label="non" onPress={handleCancel} />
          <Dialog.Button label="oui" onPress={handleDelete} />
        </Dialog.Container>
      </View>
      
      </ScrollView>
    </SafeAreaView>
  )
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  historyItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  historyImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyCategory: {
    fontSize: 14,
    color: '#4B5563',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyHistoryContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    padding: 10,
  },
})