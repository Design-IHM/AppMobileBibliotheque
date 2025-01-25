import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View, Alert, Modal, SafeAreaView, TextInput, StyleSheet, Pressable } from 'react-native';
import Swiper from 'react-native-swiper';
import React, { useContext, useEffect, useState } from 'react';
import { UserContextNavApp } from '../../navigation/NavApp';
import { db } from '../../../config';
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp, collection, onSnapshot } from "firebase/firestore";
import BigRect from '../BigRect';
import PubCar from '../PubCar';
import PubRect from '../PubRect';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const Produit = ({ route, navigation }) => {
  const { salle, desc, etagere, exemplaire, image, name, cathegorie, datUser, commentaire, nomBD, type } = route.params;
  const { currentUserdata } = useContext(UserContextNavApp);

  const TITRE = name;
  const descrip = desc;
  const [modalDescription, setModalDescription] = useState(false);
  const [modalComm, setModalComm] = useState(false);
  const [values, setValues] = useState("");
  const [valuesNote, setValuesNote] = useState("");
  const [nomUser, setNomUser] = useState('');
  const [dat, setDat] = useState(0);
  const [comment, setComment] = useState(commentaire || []);
  const [datd, setDatd] = useState();
  const [mes, setMes] = useState();

  const dt = Timestamp.fromDate(new Date());

  useEffect(() => {
    if (!currentUserdata?.email) return;

    const userRef = doc(db, 'BiblioUser', currentUserdata.email);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setDatd(doc.data());
        setMes(doc.data().name);
      }
    });

    return () => unsubscribe();
  }, [currentUserdata?.email]);

  const ajouterRecent = async () => {
    if (!currentUserdata?.email) {
      Alert.alert('Error', 'You must be logged in to reserve a book');
      return;
    }

    try {
      const userRef = doc(db, "BiblioUser", currentUserdata.email);
      await updateDoc(userRef, {
        docRecent: arrayUnion({
          cathegorieDoc: cathegorie,
          type: type,
          image: image,
          nameDoc: name,
          desc: desc
        })
      });
      reserver(datd);
    } catch (error) {
      console.error("Error adding recent:", error);
      Alert.alert('Error', 'Failed to process your reservation');
    }
  };

  const reserver = async (dos) => {
    if (!currentUserdata?.email) return;

    try {
      const userRef = doc(db, "BiblioUser", currentUserdata.email);
      const bookRef = doc(db, 'BiblioInformatique', nomBD);

      if (exemplaire === 0) {
        Alert.alert('Out of stock');
        return;
      }

      if (dos.etat1 === 'ras') {
        await updateDoc(userRef, {
          etat1: 'reserv',
          tabEtat1: [TITRE, cathegorie, image, exemplaire - 1, nomBD, dt]
        });
        await updateDoc(bookRef, { exemplaire: exemplaire - 1 });
        Alert.alert('Reservation in progress');
      } else if (dos.etat2 === 'ras') {
        await updateDoc(userRef, {
          etat2: 'reserv',
          tabEtat2: [TITRE, cathegorie, image, exemplaire - 1, nomBD, dt]
        });
        await updateDoc(bookRef, { exemplaire: exemplaire - 1 });
        Alert.alert('Reservation in progress');
      } else if (dos.etat3 === 'ras') {
        await updateDoc(userRef, {
          etat3: 'reserv',
          tabEtat3: [TITRE, cathegorie, image, exemplaire - 1, nomBD, dt]
        });
        await updateDoc(bookRef, { exemplaire: exemplaire - 1 });
        Alert.alert('Reservation in progress');
      } else {
        Alert.alert('You already have 3 reservations in progress!');
      }
    } catch (error) {
      console.error("Error reserving:", error);
      Alert.alert('Error', 'Failed to process your reservation');
    }
  };

  const ajouter = async () => {
    if (!values || !valuesNote) {
      Alert.alert('Error', 'Please fill in both comment and rating');
      return;
    }

    try {
      const bookRef = doc(db, "BiblioInformatique", nomBD);
      await updateDoc(bookRef, {
        commentaire: arrayUnion({
          note: valuesNote,
          texte: values,
          heure: dt,
          nomUser: mes
        })
      });
      setModalComm(false);
      setValues("");
      setValuesNote("");
      Alert.alert('Success', 'Comment sent successfully');
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert('Error', 'Failed to send comment');
    }
  };

  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    const q = collection(db, "BiblioInformatique");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setData(items);
      setLoader(false);
    });

    return () => unsubscribe();
  }, []);

  var date = new Date()
  date.setDate(date.getDate() + 2)

  function addDays(date, days) {
    var result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  function voirArticle(name, cathegorie, image, desc, exemplaire) {
    navigation.navigate('PageBiblio', {
      name: name,
      cathegorie: cathegorie,
      image: image,
      desc: desc,
      exemplaire: exemplaire
    })
  }

  const ref = db.collection("BiblioInformatique")

  const voirComm = (name, cathegorie, image, desc, exemplaire) => {
    navigation.navigate('PageBiblio', {
      name: name,
      cathegorie: cathegorie,
      image: image,
      desc: desc,
      exemplaire: exemplaire
    })
  }

  return (
    <React.Fragment>
      <ScrollView>
        <Swiper style={styles.wrapper} showsButtons={true}>
          <View style={styles.slide1}>
            <Image style={{ width: WIDTH * 0.8, height: HEIGHT * 0.5, resizeMode: 'contain' }} source={{ uri: image }} />
          </View>
          <View style={styles.slide2}>
            <Image style={{ width: WIDTH * 0.8, height: HEIGHT * 0.5, resizeMode: 'contain' }} source={require('../../../assets/ensp.png')} />
          </View>
          {/* <View style={styles.slide3}>
            <Image style={{ width: WIDTH * 0.8, height: HEIGHT * 0.5, resizeMode: 'contain' }} source={require('../../../assets/image/sold2.jpg')} />
          </View>*/}
        </Swiper>

        {/** prix */}
        <View style={{ height: 50, width: WIDTH, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <View style={{ margin: 7 }}>
            <Text style={{ fontSize: 15, color: 'gray', }}>{name}</Text>
            <Text style={{ fontWeight: '800', fontSize: 22, fontFamily: 'Georgia' }}></Text>
          </View>
          <View style={{ margin: 5 }}>
            <Text style={{ color: 'gray' }}>{exemplaire} exemplaire(s)</Text>
          </View>

        </View>

        {/** quantity */}
        <View style={{ flexDirection: 'row', margin: 5, marginTop: 9, backgroundColor: '#fff' }}>

        </View>

        {/** DESCRI¨PTION */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 5, backgroundColor: '#fff', height: 35, alignContent: 'center', marginTop: 5 }}>
          <Text style={{ marginTop: 9 }}>Description:</Text>
          <Text style={{ color: 'gray', marginTop: 9 }}> {descrip.length > 20 ? descrip.slice(0, 25).toLowerCase() + '...'
            : descrip.toLowerCase()
          } </Text>

          <TouchableOpacity onPress={() => setModalDescription(!modalDescription)} style={{ backgroundColor: '#E0E0E0' }}>
            <Text style={{ marginTop: 9, marginRight: 5 }}>{"  >> "}</Text>
          </TouchableOpacity>
        </View>

        {/** EXPEDITION */}
        <View style={{ margin: 5, backgroundColor: '#fff' }}>
          <View>
            <Text style={{ textAlign: 'center', fontWeight: '600' }}> Bibliothèque ENSPY</Text>
          </View>

          <Text style={{ color: 'gray', fontSize: 10, textDecorationLine: 'line-through', textDecorationStyle: 'solid', textAlign: 'center', textDecorationColor: '#DCDCDC' }}>-                                                                                     -</Text>

          <View style={{ flexDirection: 'row' }}>
            <View>
              <Image style={{ height: 40, width: 40, margin: 5 }} source={require('../../../assets/iconbibli.png')} />
            </View>

            <View style={{ margin: 5, fontFamily: 'Georgia', justifyContent: 'center', marginLeft: 25 }}>
              <Text style={{ fontFamily: 'Georgia', textAlign: 'center' }}>Bibliothèque située au niveau du bloc </Text>
              <Text style={{ fontFamily: 'Georgia', textAlign: 'center' }}>pédagogique 2 de polytechnique</Text>
            </View>
          </View>
        </View>

        {/**COMMENTAIRES */}
        <View style={{ backgroundColor: '#FFF', marginTop: 25 }}>

          <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '600' }}>Commentaires({comment.length}) </Text>

          <TouchableOpacity onPress={() => setVoirCom(!voirComm)} style={{ marginLeft: 17, marginTop: 10, marginBottom: 20 }}>
            <Text style={{ color: 'gray' }}>voir Commentaires</Text>
          </TouchableOpacity>

          {voirComm ?
            <>
              {comment.map((dev, index) =>
                <Comm nom={dev.nomUser} heure={dev.heure} nbr={comment.length} note={dev.note} texte={dev.texte} key={index} />
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 10 }}>
                <TouchableOpacity>
                  <Text></Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => setModalComm(!modalComm)}>
                  <Text>commenter</Text>
                  <Image style={{ height: 20, width: 20 }} source={require('../../../assets/comm.png')} />
                </TouchableOpacity>
              </View>
            </> : <View></View>
          }

        </View>
        {/**   */}
        {/** AUTRES EXEMPLAIRES  */}
        <View>
          <Text style={{ textAlign: 'center', fontFamily: 'Georgia', fontWeight: '800', fontSize: 17, marginBottom: 15, marginTop: 15 }}>***Articles Similaires***</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', margin: 7 }}>

          {
            data.map((dev, index) =>
              dev.cathegorie == cathegorie && dev.type == type && dev.name != name ?
                (
                  dev.cathegorie != "pub" ?
                    <BigRect type={dev.type} datUser={datUser} cathegorie={dev.cathegorie} props={navigation} name={dev.name} desc={dev.desc} etagere={dev.etagere} exemplaire={dev.exemplaire} image={dev.image} salle={dev.salle} key={index} commentaire={dev.commentaire} nomBD={dev.nomBD} />
                    :
                    <React.Fragment key={index}>
                      <PubCar />
                      <PubRect />
                    </React.Fragment>
                )
                :
                <View key={index}></View>
            )
          }
        </View>

      </ScrollView>

      {datUser.etat1 != 'emprunt' || datUser.etat2 != 'emprunt' || datUser.etat3 != 'emprunt' ?
        (
          datUser.etat != 'bloc' ? (
            datUser.etat1 != 'reserv' || datUser.etat2 != 'reserv' || datUser.etat3 != 'reserv' ?
              <View style={{ height: 50, backgroundColor: '#fff' }}>
                <TouchableOpacity onPress={() => ajouterRecent()} style={{ backgroundColor: '#000', width: WIDTH * 0.5, alignSelf: 'center', marginTop: 8, borderRadius: 10, height: 35 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 5 }}>Reserver</Text>
                </TouchableOpacity>
              </View> : <View style={{ height: 50, backgroundColor: '#fff' }}>
                <TouchableOpacity style={{ backgroundColor: 'red', alignSelf: 'center', marginTop: 8, borderRadius: 10, height: 35 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 5 }}>Vous avez deja 3 reservation en cours!!!</Text>
                </TouchableOpacity>
              </View>
          ) : (
            <View style={{ height: 50, backgroundColor: '#fff' }}>
              <TouchableOpacity style={{ backgroundColor: 'red', width: WIDTH * 0.5, alignSelf: 'center', marginTop: 8, borderRadius: 10, height: 35 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 5 }}>Vous avez ete bloqué</Text>
              </TouchableOpacity>
            </View>)
        ) :
        (
          <View style={{ height: 50, backgroundColor: '#fff' }}>
            <TouchableOpacity style={{ backgroundColor: 'red', alignSelf: 'center', marginTop: 8, borderRadius: 10, height: 35 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 5 }}>Vous avez deja 3 emprunt en cours!!!</Text>
            </TouchableOpacity>
          </View>)
      }

      <Modal animationType='slide'
        transparent={true}
        visible={modalComm}
        onRequestClose={() => {
          setModal(!modalComm)
        }}
      >
        <SafeAreaView style={{ backgroundColor: 'rgba(180,180,180,0.95)', height: HEIGHT }}>

          <TouchableOpacity onPress={() => setModalComm(false)}>
            <Image style={{ height: 30, width: 30 }} source={require('../../../assets/biblio/croix.png')} />
          </TouchableOpacity>

          <View style={styles.search}>
            <TextInput
              style={styles.input}
              placeholder='votre commentaire'
              onChangeText={setValues}
              value={values}
              multiline={true}
            />
          </View>

          <View style={styles.search2}>
            <TextInput
              style={styles.input2}
              placeholder='Note /5'
              onChangeText={setValuesNote}
              value={valuesNote}
              keyboardType='numeric'
            />
          </View>

          <TouchableOpacity onPress={() => ajouter()} style={{ marginLeft: 10, marginTop: 100, alignSelf: 'center' }}>
            <Image source={require('../../../assets/send.png')} style={{ height: 40, width: 40 }} />
          </TouchableOpacity>

        </SafeAreaView>
      </Modal>

      <Modal animationType='slide'
        transparent={true}
        visible={modalDescription}
        onRequestClose={() => {
          setModalDescription(!modalDescription)
        }}
      >
        <Pressable onPress={() => setModalDescription(false)}>
          <SafeAreaView style={{ margin: 5, flexDirection: 'row', height: HEIGHT, borderRadius: 20, padding: 25 }}>
            <ScrollView style={{ backgroundColor: 'rgba(180,180,180,0.8)', borderRadius: 20, marginTop: 25, padding: 25 }}>

              <Text style={{ marginTop: 25 }}>{descrip}</Text>

            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Modal>

    </React.Fragment>
  )
}

const Comm = ({ texte, note, nom, heure }) => {
  var date = new Date(heure.seconds * 1000)
  var forma = date.toLocaleString()
  var format = date.toJSON(10)
  var formatDate = date.toDateString()

  return (
    <View>
      <Text style={{ color: 'gray', fontSize: 10, textDecorationLine: 'line-through', textDecorationStyle: 'solid', textAlign: 'center', textDecorationColor: '#DCDCDC' }}>-                                                                                                                       -</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {/**entete */}
        <View style={{ margin: 7, }}>
          <Text style={{ color: 'gray' }}>{nom}</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>{note}</Text>
        </View>
        <View style={{ margin: 7, }}>
          <Text style={{ color: 'gray', fontSize: 10 }}>{formatDate}</Text>
        </View>
      </View>
      <View style={{ margin: 5 }}>
        <Text style={{ textAlign: 'center', fontFamily: 'Georgia' }}>{texte}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    height: 450
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    height: 250,
    padding: 10,
    width: 350,
    borderRadius: 20,
    color: '#000',
    marginLeft: 30,

  },
  search: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 15
  },
  input2: {
    borderWidth: 1,
    height: 40,
    padding: 10,
    width: 350,
    borderRadius: 20,
    color: '#000',
    marginLeft: 30,

  },
  search2: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 15
  },
})

export default Produit
