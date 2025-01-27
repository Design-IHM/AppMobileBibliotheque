import React, { useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Dialog from "react-native-dialog";
import { doc, onSnapshot, collection, getDoc, getDocs } from "firebase/firestore";
import { UserContext } from '../../context/UserContext';
import { db } from '../../../firebaseConfig';

const WIDTH = Dimensions.get('window').width
const HEIGHT = Dimensions.get('window').height

const CathegorieBiblio = ({cathegorie, donnee}) => {
    const renderReservations = () => {
        const reservations = [];
        
        if (donnee.etat1 === 'reserv' && donnee.tabEtat1) {
            reservations.push({
                name: donnee.tabEtat1[0],
                cathegorie: donnee.tabEtat1[1],
                image: donnee.tabEtat1[2],
                exemplaire: donnee.tabEtat1[3],
                nomBD: donnee.tabEtat1[4],
                dateHeure: donnee.tabEtat1[5]
            });
        }
        
        if (donnee.etat2 === 'reserv' && donnee.tabEtat2) {
            reservations.push({
                name: donnee.tabEtat2[0],
                cathegorie: donnee.tabEtat2[1],
                image: donnee.tabEtat2[2],
                exemplaire: donnee.tabEtat2[3],
                nomBD: donnee.tabEtat2[4],
                dateHeure: donnee.tabEtat2[5]
            });
        }
        
        if (donnee.etat3 === 'reserv' && donnee.tabEtat3) {
            reservations.push({
                name: donnee.tabEtat3[0],
                cathegorie: donnee.tabEtat3[1],
                image: donnee.tabEtat3[2],
                exemplaire: donnee.tabEtat3[3],
                nomBD: donnee.tabEtat3[4],
                dateHeure: donnee.tabEtat3[5]
            });
        }

        return reservations;
    };

    return (
        <SafeAreaView>
            <View style={{backgroundColor:'#C8C8C8', justifyContent:'space-between', flexDirection:'row'}}>
                <Text style={{fontSize:20, fontWeight:'bold', color:'black', margin:10, fontFamily:'Cochin'}}>{cathegorie}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {renderReservations().map((reservation, index) => (
                    <Cadre
                        key={index}
                        name={reservation.name}
                        cathegorie={reservation.cathegorie}
                        image={reservation.image}
                        exemplaire={reservation.exemplaire}
                        nomBD={reservation.nomBD}
                        dateHeure={reservation.dateHeure}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const CathegorieBiblio1 = ({cathegorie, currentUser, donnee}) => {
   
     const [biblioData1, setBiblioData1] = useState([]);
     const [biblioLoader1, setBiblioLoader1] = useState(true);
     const [number, setNumber] = useState(null);
     const [imgActive, setImgActive] = useState(0);

     function getData(dos){
      let ref= collection(db, 'Biblio') 
      const unsubscribe = onSnapshot(ref, (querySnapshot) => { 
        const items = []
        querySnapshot.forEach((doc) => {
          items.push(doc.data())
        })
        setBiblioData1(items)
        setBiblioLoader1(false)
      })
      return unsubscribe
     }
    
     useEffect(() =>{
      getData()
     },[])

     const  onChange = (nativeEvent) => {
         if(nativeEvent) {
           const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width )
           if(slide != imgActive){
             setImgActive(slide)
           }
         }
         
     }

     return (
       <SafeAreaView>
           <ScrollView>
               {biblioLoader1 ? (
                   <ActivityIndicator size="large" color="#00ff00" />
               ) : (
                   <View style={{backgroundColor:'#C8C8C8', justifyContent:'space-between', flexDirection:'row'}}>
                       <Text style={{fontSize:20,fontWeight:'bold',color:'black', margin:10,fontFamily:'Cochin'}}>{cathegorie}</Text>
                   </View>
               )}
           </ScrollView>
       </SafeAreaView>
     )
   }

   const Panier = (props) => {
       const [values, setValues] = useState("");
       const { currentUserNewNav } = useContext(UserContext);
       const [dat, setDat] = useState({});
       const [panierLoader, setPanierLoader] = useState(true);

       useEffect(() => {
           if (!currentUserNewNav?.email) return;

           const userRef = doc(db, "BiblioUser", currentUserNewNav.email);
           const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
               if (docSnapshot.exists()) {
                   const userData = docSnapshot.data();
                   // Initialiser les états s'ils n'existent pas
                   if (!userData.etat1) userData.etat1 = 'ras';
                   if (!userData.etat2) userData.etat2 = 'ras';
                   if (!userData.etat3) userData.etat3 = 'ras';
                   setDat(userData);
               }
               setPanierLoader(false);
           });

           return () => unsubscribe();
       }, [currentUserNewNav?.email]);

       if (!currentUserNewNav?.email) {
           return (
               <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                   <Text style={{fontSize: 16}}>Veuillez vous connecter pour voir vos réservations</Text>
               </View>
           );
       }

       const hasReservations = dat.etat1 === 'reserv' || dat.etat2 === 'reserv' || dat.etat3 === 'reserv';
       const hasEmprunts = dat.etat1 === 'emprunt' || dat.etat2 === 'emprunt' || dat.etat3 === 'emprunt';

       return (
           <ScrollView>
               {panierLoader ? (
                   <ActivityIndicator size="large" color="#00ff00" />
               ) : (
                   <View>
                       {hasReservations ? (
                           <>
                               <CathegorieBiblio donnee={dat} cathegorie='Réservations' />
                               <View style={{height: 1, backgroundColor: '#000'}} />
                           </>
                       ) : (
                           <View style={styles.emptyContainer}>
                               <Text style={styles.emptyText}>Aucune réservation en cours</Text>
                           </View>
                       )}

                       {hasEmprunts && (
                           <>
                               <CathegorieBiblio1 donnee={dat} cathegorie='Emprunts' />
                               <View style={{height: 1, backgroundColor: '#000'}} />
                           </>
                       )}
                   </View>
               )}
           </ScrollView>
       );
   }

   const Cadre =({cathegorie,desc,exemplaire, image,name,matricule,cathegorie2,nomBD,dateHeure})=>{

     var date = new Date(dateHeure.seconds*1000)
     var forma = date.toLocaleString()
     var format = date.toJSON(10)
     var formatDate = date.toDateString()
     var formatHeure = date.toTimeString()

     const [currentUser, setCurrentUser] = useState("eben1@gmail.com")
     const {currentUserNewNav}= useContext(UserContext)
  
     const [dat, setDat] = useState(0)

     function subscriber (){ 
       const docRef = doc(db, 'BiblioUser', currentUserNewNav.email);
       const unsubscribe = onSnapshot(docRef, (docSnapshot) => {  
         if (docSnapshot.exists()) {
           const data = docSnapshot.data();
           setDat(data);
         }
       })
  
     }
 
     useEffect(() =>{
       subscriber()
      },[])
                       //fin recption des donnees
                      

     const TITRE = name

     function annuler(dos){
       const ref = collection(db, "BiblioUser")
       const refDoc = collection(db, "BiblioInformatique")
       if( dos.etat1 == 'reserv' && dos.tabEtat1[0] == TITRE){
       ref
       .doc(dos.email) 
       .update({etat1:'ras', tabEtat1:["","",""]})
       .catch((err)=>{
         console.log(err)  
       })
       refDoc
       .doc(nomBD)
       .update({exemplaire : exemplaire + 1} )
       .then(Alert.alert('Annulation en cours...'))
       .catch((err)=>{
           console.log(err)  
         })
       
     } 
       if( dos.etat2 == 'reserv' && dos.tabEtat2[0] == TITRE){
           ref
           .doc(dos.email)
           .update({etat2:'ras', tabEtat2:["","",""]})
           .catch((err)=>{
             console.log(err)
           })
           refDoc
           .doc(nomBD)
           .update({exemplaire : exemplaire + 1} )
           .then(Alert.alert('Annulation en cours...'))
           .catch((err)=>{
               console.log(err)  
             })
           
       
       }
         if( dos.etat3 == 'reserv' && dos.tabEtat3[0] == TITRE){
             ref
             .doc(dos.email)
             .update({etat3:'ras', tabEtat3:["","",""]})
             .catch((err)=>{
               console.log(err)
             })
             refDoc
             .doc(nomBD)
             .update({exemplaire : exemplaire + 1 })
             .then(Alert.alert('Annulation en cours...'))
             .catch((err)=>{
                 console.log(err)  
               })
              
           
         }         
     }

     const [visiblea, setVisiblea] = useState(false);

     const showDialog = () => {
       setVisiblea(true);
     };

     const handleCancel = () => {
       setVisiblea(false);
     };

     const handleDelete = () => {
       annuler(dat)
       setVisiblea(false);
     };

     return(
         <View style={{width:WIDTH,height:200,elevation:4}}>
               {/** Cadre */}
         <Text style={{color:'rgb(211,211,211)', fontSize:10,textDecorationLine: 'line-through', textDecorationStyle: 'solid',textAlign:'center',textDecorationColor:'#DCDCDC'}}>-                                                                                                                       -</Text>

         <View style={{flexDirection:'row',width:WIDTH*0.87,backgroundColor:'rgb(211,211,211)',borderRadius:20,alignSelf:'center',marginBottom:10,elevation:4 }}>
             <Image style={{height:160,width:100,marginLeft:7,alignSelf:'center',borderRadius:20}} source={{uri:image}} />
             <View style={{width:'77%',flexDirection:'column',justifyContent:'space-between',margin:5}}>
                 <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                     <Text style={{color:'#000',fontFamily:'Georgia',fontSize:20,margin:8}}>{name.length>10 ? name.slice(0,10)+'...':name}</Text>
                     {/*<Image style={{height:25,width:25,marginRight:17}} source={require('../../../assets/image/coeur.png')} />*/}
                 </View>

                 <Text style={{color:'#000',fontFamily:'Georgia',fontSize:14,margin:8}}>{formatDate}</Text>
                 <Text style={{color:'#000',fontFamily:'Georgia',fontSize:14,marginLeft:8}}>{formatHeure.slice(0,9)}</Text>

  
                 <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:1}}>
                 <Text></Text>               
  
                      {/** quantity */}
                      { cathegorie2!='emprunt' ? 
        <TouchableOpacity onPress={()=>showDialog()}  style={{ color:'white',marginRight:10,width:95,borderRadius:20,margin:10}}>
          <Image source={require('../../../assets/delete3.jpg')} style={{height:50,width:50,borderRadius:50,}} />
          <Text>annuler</Text>

        </TouchableOpacity> : <View></View> }
  
                 </View>
  
             </View>
         </View>

         <Dialog.Container visible={visiblea}>
           <Dialog.Title>Annulation</Dialog.Title>
           <Dialog.Description>
             Voulez-vous vraiment annuler la reservation ? 
           </Dialog.Description>
           <Dialog.Button label="non" onPress={handleCancel} />
           <Dialog.Button label="oui" onPress={handleDelete} />
         </Dialog.Container>


         </View>
     )
   }

   const CadreEmprunt =({cathegorie,desc,exemplaire, image,name,matricule,cathegorie2,nomBD,dateHeure})=>{

     var date = new Date(dateHeure.seconds*1000)
     var forma = date.toLocaleString()
     var format = date.toJSON(10)
     var formatDate = date.toDateString()
     var formatHeure = date.toTimeString()

     const [currentUser, setCurrentUser] = useState("eben1@gmail.com")
     const {currentUserNewNav}= useContext(UserContext)
  
     const [dat, setDat] = useState(0)

     function subscriber (){ 
       const docRef = doc(db, 'BiblioUser', currentUserNewNav.email);
       const unsubscribe = onSnapshot(docRef, (docSnapshot) => {  
         if (docSnapshot.exists()) {
           const data = docSnapshot.data();
           setDat(data);
         }
       })
  
     }
 
     useEffect(() =>{
       subscriber()
      },[])
                       //fin recption des donnees
                      

     const TITRE = name

     function annuler(dos){
       const ref = collection(db, "BiblioUser")
       const refDoc = collection(db, "BiblioInformatique")
       if( dos.etat1 == 'reserv' && dos.tabEtat1[0] == TITRE){
       ref
       .doc(dos.email) 
       .update({etat1:'ras', tabEtat1:["","",""]})
       .catch((err)=>{
         console.log(err)  
       })
       refDoc
       .doc(nomBD)
       .update({exemplaire : exemplaire + 1} )
       .then(Alert.alert('Annulation en cours...'))
       .catch((err)=>{
           console.log(err)  
         })
       
     } 
       if( dos.etat2 == 'reserv' && dos.tabEtat2[0] == TITRE){
           ref
           .doc(dos.email)
           .update({etat2:'ras', tabEtat2:["","",""]})
           .catch((err)=>{
             console.log(err)
           })
           refDoc
           .doc(nomBD)
           .update({exemplaire : exemplaire + 1} )
           .then(Alert.alert('Annulation en cours...'))
           .catch((err)=>{
               console.log(err)  
             })
           
       
       }
         if( dos.etat3 == 'reserv' && dos.tabEtat3[0] == TITRE){
             ref
             .doc(dos.email)
             .update({etat3:'ras', tabEtat3:["","",""]})
             .catch((err)=>{
               console.log(err)
             })
             refDoc
             .doc(nomBD)
             .update({exemplaire : exemplaire + 1 })
             .then(Alert.alert('Annulation en cours...'))
             .catch((err)=>{
                 console.log(err)  
               })
              
           
         }         
     }

     return(
         <View style={{width:WIDTH,height:200,marginTop:50}}>
               {/** Cadre */}
         <Text style={{color:'gray', fontSize:10,textDecorationLine: 'line-through', textDecorationStyle: 'solid',textAlign:'center',textDecorationColor:'#DCDCDC'}}>-                                                                                                                       -</Text>

         <View style={{flexDirection:'row',width:WIDTH,}}>
             <Image style={{height:150,width:90, resizeMode:'contain',marginLeft:7}} source={{uri:image}} />
             <View style={{width:'77%',flexDirection:'column',justifyContent:'space-between',margin:5}}>
                 <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                     <Text style={{color:'#000',fontFamily:'Georgia',fontSize:20,margin:8}}>{name}</Text>
                     {/*<Image style={{height:25,width:25,marginRight:17}} source={require('../../../assets/image/coeur.png')} />*/}
                 </View>

                 <Text style={{color:'#000',fontFamily:'Georgia',fontSize:14,margin:8}}>{formatDate}</Text>
                 <Text style={{color:'#000',fontFamily:'Georgia',fontSize:14,margin:8}}>{formatHeure}</Text>

  
                 <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:1}}>
                     
  
                      {/** quantity */}
                      { cathegorie2!='emprunt' ? 
        <TouchableOpacity onPress={()=>annuler(dat)}  style={{ color:'white',marginRight:20,backgroundColor:'red'}}>
          <Text>ANNULLER</Text>
        </TouchableOpacity> : <View></View> }
  
                 </View>
  
             </View>
         </View>


         </View>
     )
   }

   const styles = StyleSheet.create({
       wrap:{
      //   width:WIDTH,
       //  height:450,
         margin: 12,
       //  flexDirection:'column',
         flexWrap:'wrap'
       },
       inputA: {
           height: 40,
           margin: 12,
           borderWidth: 1,
           padding: 10,
         },
         input:{
           borderWidth: 1,
           height: 40,
           padding: 10,
           width:250,
           borderBottomLeftRadius:20,
           borderTopLeftRadius:20  
       },
       search:{
           flexDirection:'row',
           alignContent:'center',
           alignItems:'center',
           marginLeft:10,
           marginTop:15
       },
       footerIcon:{
         width:WIDTH*0.085,
         height:HEIGHT*0.025,
         margin:WIDTH*0.012,
         
       },
       emptyContainer: {
           padding: 20,
           alignItems: 'center',
           justifyContent: 'center'
       },
       emptyText: {
           textAlign: 'center',
           fontWeight: '900',
           fontSize: 28,
           fontFamily: 'Cochin'
       }
   });

export default Panier