import { View, Text, SafeAreaView,TextInput,Button,StyleSheet,ScrollView,Dimensions,Image,TouchableOpacity } from 'react-native'
import React , {useState,useEffect, useContext,createContext} from 'react'
import { UserContext } from '../../context/UserContext'
import { doc, updateDoc, arrayUnion, collection, Timestamp, onSnapshot, setDoc, getFirestore } from "firebase/firestore";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {onAuthStateChanged} from "firebase/auth"
import { auth } from '../../../config';
import { getDoc, getDocs } from "firebase/firestore";

const db = getFirestore();

const HEIGHT = Dimensions.get('window').height
const WIDTH = Dimensions.get('window').width

const MessageContexte = createContext({
  signale: true,
  setSignale: () => {}
})

const Email = () => {
  const {datUser, setDatUser,datUserTest, setDatUserTest,} = useContext(UserContext)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [values, setValues] = React.useState("")
  const [dat, setDat] = useState(0)
  const [mes, setMes] = useState([])
  const [data, setData] = useState([])
  const [loader, setLoader] = useState(true)
  const [signale, setSignale] = useState(true)

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
    const docRef = doc(db, 'BiblioUser', datUser.email);
    onSnapshot(docRef, (documentSnapshot) => {
      console.log('User exists: ', documentSnapshot.exists());
      const items = [];
      items.push(documentSnapshot.data());
      setDat(documentSnapshot.data());
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
    if (!currentUserEmail?.email) return;
    
    const washingtonRef = doc(db, "BiblioUser", currentUserEmail.email);
    const dt = Timestamp.fromDate(new Date());
    
    try {
      await updateDoc(washingtonRef, {
        messages: arrayUnion({"recue":"E", "texte": values, "heure": dt})
      });
      await res();
      setValues("");
    } catch (error) {
      console.error("Error adding message:", error);
    }
  }

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

  return (
    <MessageContexte.Provider value={{signale, setSignale}}>
      <View style={styles.container}>
        <View style={{flexDirection:'column',alignSelf:'center',backgroundColor:'#F0F0F0',height:45,marginTop:10,marginBottom:7}}>
          <Image source={require('../../../assets/userIcone.png')} style={{height:40,width:40,borderRadius:50}} />
          <Text style={{textAlign:'center'}}>Admin</Text>
        </View>

        <View style={{backgroundColor:'#000',height:5,margin:5,width:WIDTH}}></View>
     
        <KeyboardAwareScrollView>
          {datUserTest ? <Text></Text> : (
            datUser.messages.map((dev,index) =>
              dev.recue == "R" ?
                <Receiv heure={dev.heure} texte={dev.texte} key={index} /> :
                <Send heure={dev.heure} texte={dev.texte} key={index} />
            )
          )}
        
          <View style={styles.search}>
            <TextInput
              style={styles.input}
              placeholder='votre message'
              onChangeText={setValues}
              value={values}
              clearTextOnFocus={true}
            />
            <TouchableOpacity onPress={ajouter} style={{marginLeft:10}}>
              <Image source={require('../../../assets/send.png')} style={{height:30,width:30}} />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </MessageContexte.Provider>
  )
}

const Send = ({ texte, heure }) => {
  var date = new Date(heure.seconds * 1000)
  var formatDate = date.toDateString()
  var formatHeure = date.toTimeString()

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: WIDTH }}>
      <View style={{ width: WIDTH, justifyContent: "space-between", flexDirection: 'column', margin: 10, marginLeft: "37%" }}>
        <View style={{ backgroundColor: "gray", width: 200, borderRadius: 20, padding: 20 }} >
          <Text style={{ flexWrap: 'wrap', textAlign: 'center', fontFamily: 'Georgia', fontWeight: '400', fontSize: 17, color: "#fff" }}>{texte}</Text>
        </View>
        <Text style={{ fontFamily: 'Georgia', fontWeight: '400', fontSize: 10, color: '#000' }}>{formatDate}</Text>
      </View>
    </View>
  )
}

const Receiv = ({ heure, texte }) => {
  var date = new Date(heure.seconds * 1000)
  var formatDate = date.toDateString()
  var formatHeure = date.toTimeString()

  return (
    <View style={{ justifyContent: 'space-between', flexDirection: 'column', margin: 10, marginRight: 20 }}>
      <View style={{ backgroundColor: "#000", width: 220, borderRadius: 20, padding: 20 }} >
        <Text style={{ flexWrap: 'wrap', textAlign: 'center', fontFamily: 'Georgia', fontWeight: '400', fontSize: 17, color: '#fff' }}>{texte}</Text>
      </View>
      <Text style={{ flexWrap: 'wrap', fontFamily: 'Georgia', fontWeight: '400', fontSize: 10, color: '#000' }}>{formatDate}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  input: {
    borderWidth: 1,
    height: 40,
    padding: 10,
    width: 250,
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
    color: '#000',
    marginLeft: 30
  },
  search: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 15,
    marginBottom: 25,
    height: '20%',
    flex: 1
  },
})

export default Email