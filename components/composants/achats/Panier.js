import React, { useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Dialog from "react-native-dialog";
import { doc, onSnapshot, collection, getDoc, getDocs, writeBatch, increment, updateDoc } from "firebase/firestore";
import { UserContext } from '../../context/UserContext';
import { db } from '../../../firebaseConfig';

const WIDTH = Dimensions.get('window').width
const HEIGHT = Dimensions.get('window').height

const CathegorieBiblio = ({cathegorie, donnee}) => {
    console.log('Rendu CathegorieBiblio avec données:', {
        cathegorie,
        donnee,
        reservations: donnee.reservations
    });

    // Prendre les 3 dernières réservations actives
    const activeReservations = (donnee.reservations || [])
        .filter(res => res.etat === 'reserv')
        .sort((a, b) => b.dateReservation.seconds - a.dateReservation.seconds)
        .slice(0, 3);

    return (
        <View style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{cathegorie}</Text>
            </View>
            
            <View style={styles.reservationsContainer}>
                {activeReservations.map((reservation, index) => (
                    <Cadre
                        key={index}
                        name={reservation.name}
                        cathegorie={reservation.cathegorie}
                        image={reservation.image}
                        exemplaire={reservation.exemplaire}
                        nomBD={reservation.nomBD}
                        dateHeure={reservation.dateReservation}
                    />
                ))}
            </View>
        </View>
    );
}

const CathegorieBiblio1 = ({cathegorie, currentUser, donnee}) => {
   
     const [biblioData1, setBiblioData1] = useState([]);
     const [biblioLoader1, setBiblioLoader1] = useState(true);
     const [number, setNumber] = useState(null);
     const [imgActive, setImgActive] = useState(0);

     useEffect(() => {
        if (!db) return;

        const biblioRef = collection(db, 'Biblio');
        const unsubscribe = onSnapshot(biblioRef, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push(doc.data());
            });
            setBiblioData1(items);
            setBiblioLoader1(false);
        }, (error) => {
            console.error("Erreur lors de la récupération des données:", error);
            setBiblioLoader1(false);
        });

        return () => unsubscribe();
    }, []);

     const onChange = (nativeEvent) => {
         if(nativeEvent) {
           const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width );
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
       const { currentUserNewNav: currentUserdata } = useContext(UserContext);
       const [dat, setDat] = useState({});
       const [panierLoader, setPanierLoader] = useState(true);

       useEffect(() => {
           if (!db || !currentUserdata?.email) {
               console.log('Pas de connexion à la base de données ou pas d\'email');
               return;
           }

           console.log('Email utilisateur:', currentUserdata.email);

           // Écouter les changements du document utilisateur spécifique
           const userRef = doc(db, "BiblioUser", currentUserdata.email);
           const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
               if (docSnapshot.exists()) {
                   const userData = docSnapshot.data();
                   console.log('Données utilisateur complètes:', userData);
                   console.log('Réservations:', userData.reservations);
                   setDat(userData);
               } else {
                   console.log('Document utilisateur non trouvé');
                   setDat({});
               }
               setPanierLoader(false);
           }, (error) => {
               console.error("Erreur lors de la récupération des données:", error);
               setPanierLoader(false);
           });

           return () => unsubscribe();
       }, [currentUserdata?.email]);

       // Vérifier s'il y a des réservations actives
       const hasActiveReservations = (data) => {
           return Array.isArray(data.reservations) && 
                  data.reservations.some(res => res.etat === 'reserv');
       };

       return (
           <ScrollView>
               {panierLoader ? (
                   <ActivityIndicator size="large" color="#00ff00" />
               ) : (
                   <View>
                       {console.log('Rendu du panier avec données:', dat)}
                       {hasActiveReservations(dat) ? (
                           <>
                               <CathegorieBiblio donnee={dat} cathegorie='Reservation' />
                           </>
                       ) : (
                           <View>
                               <Text style={{textAlign:'center', fontWeight:'900', fontSize:28,fontFamily:'Cochin'}}>0 RESERVATION</Text>
                           </View>
                       )}

                       {(dat.etat1 === 'emprunt' || dat.etat2 === 'emprunt' || dat.etat3 === 'emprunt') ? (
                           <>
                               <CathegorieBiblio1 donnee={dat} cathegorie='emprunt' currentUser={currentUserdata?.email} />
                           </>
                       ) : (
                           <View>
                               <Text style={{textAlign:'center', fontWeight:'900', fontSize:28,fontFamily:'Cochin',marginTop:50}}></Text>
                           </View>
                       )}
                   </View>
               )}
           </ScrollView>
       );
   }

   const Cadre = ({cathegorie, desc, exemplaire, image, name, matricule, cathegorie2, nomBD, dateHeure}) => {
       const { currentUserNewNav: currentUserdata } = useContext(UserContext);
       const [showDialog, setShowDialog] = useState(false);
       const [imageError, setImageError] = useState(false);

       // Formatage de la date et l'heure
       const formatDate = dateHeure ? new Date(dateHeure.seconds * 1000) : new Date();
       const date = formatDate.toLocaleDateString('fr-FR', {
           weekday: 'long',
           year: 'numeric',
           month: 'long',
           day: 'numeric'
       });
       const heure = formatDate.toLocaleTimeString('fr-FR', {
           hour: '2-digit',
           minute: '2-digit'
       });

       // Déterminer l'image à afficher
       const defaultImage = require('../../../assets/biblio/math.jpg');
       const imageSource = !image || imageError ? defaultImage : { uri: image };

       const supprimerReservation = async () => {
           if (!currentUserdata?.email || !name) {
               Alert.alert('Erreur', 'Impossible de supprimer la réservation');
               return;
           }

           try {
               const userRef = doc(db, "BiblioUser", currentUserdata.email);
               const userDoc = await getDoc(userRef);
               
               if (!userDoc.exists()) {
                   Alert.alert('Erreur', 'Utilisateur non trouvé');
                   return;
               }

               const userData = userDoc.data();
               const reservations = userData.reservations || [];

               // Trouver la réservation à supprimer
               const reservationIndex = reservations.findIndex(res => 
                   res.name === name && res.etat === 'reserv'
               );

               if (reservationIndex === -1) {
                   Alert.alert('Erreur', 'Réservation non trouvée');
                   return;
               }

               const reservation = reservations[reservationIndex];
               const bookCollection = reservation.nomBD || "BiblioInformatique";

               // Créer une copie des réservations et mettre à jour l'état
               const updatedReservations = [...reservations];
               updatedReservations[reservationIndex] = {
                   ...reservation,
                   etat: 'annule'
               };

               const batch = writeBatch(db);

               // Mettre à jour les réservations de l'utilisateur
               batch.update(userRef, {
                   reservations: updatedReservations
               });

               // Mettre à jour le nombre d'exemplaires du livre
               const bookRef = doc(db, bookCollection, name);
               const bookDoc = await getDoc(bookRef);

               if (bookDoc.exists()) {
                   batch.update(bookRef, {
                       exemplaire: increment(1)
                   });
               }

               await batch.commit();
               Alert.alert('Succès', 'Réservation supprimée avec succès');
           } catch (error) {
               console.error('Erreur lors de la suppression:', error);
               Alert.alert('Erreur', 'Impossible de supprimer la réservation');
           }
       };

       return (
           <View style={styles.cardContainer}>
               <View style={styles.card}>
                   <Image
                       source={imageSource}
                       style={styles.cardImage}
                       onError={() => setImageError(true)}
                       defaultSource={defaultImage}
                   />
                   <View style={styles.cardContent}>
                       <Text style={styles.cardTitle} numberOfLines={2}>{name}</Text>
                       <Text style={styles.cardCategory}>{cathegorie}</Text>
                       <Text style={styles.cardDate}>{date}</Text>
                       <Text style={styles.cardTime}>{heure}</Text>
                       <TouchableOpacity
                           style={styles.deleteButton}
                           onPress={() => setShowDialog(true)}
                       >
                           <Text style={styles.deleteButtonText}>Supprimer</Text>
                       </TouchableOpacity>
                   </View>
               </View>

               <Dialog.Container visible={showDialog}>
                   <Dialog.Title>Confirmer la suppression</Dialog.Title>
                   <Dialog.Description>
                       Voulez-vous vraiment supprimer cette réservation ?
                   </Dialog.Description>
                   <Dialog.Button label="Annuler" onPress={() => setShowDialog(false)} />
                   <Dialog.Button
                       label="Supprimer"
                       onPress={() => {
                           setShowDialog(false);
                           supprimerReservation();
                       }}
                   />
               </Dialog.Container>
           </View>
       );
   };

   const styles = StyleSheet.create({
       categoryContainer: {
           marginBottom: 20,
           backgroundColor: '#f5f5f5'
       },
       categoryHeader: {
           backgroundColor: '#C8C8C8',
           padding: 10,
           marginBottom: 10
       },
       categoryTitle: {
           fontSize: 20,
           fontWeight: 'bold',
           color: 'black',
           fontFamily: 'Cochin'
       },
       reservationsContainer: {
           paddingHorizontal: 10
       },
       cardContainer: {
           padding: 10,
           backgroundColor: '#fff'
       },
       card: {
           flexDirection: 'row',
           backgroundColor: '#fff',
           borderRadius: 10,
           padding: 10,
           marginBottom: 10,
           elevation: 3,
           shadowColor: '#000',
           shadowOffset: { width: 0, height: 2 },
           shadowOpacity: 0.25,
           shadowRadius: 3.84,
       },
       cardImage: {
           width: 100,
           height: 150,
           borderRadius: 5,
       },
       cardContent: {
           flex: 1,
           marginLeft: 10,
           justifyContent: 'space-between'
       },
       cardTitle: {
           fontSize: 16,
           fontWeight: 'bold',
           marginBottom: 5,
       },
       cardCategory: {
           fontSize: 14,
           color: '#666',
           marginBottom: 5,
       },
       cardDate: {
           fontSize: 14,
           color: '#444',
           marginBottom: 2,
           fontStyle: 'italic'
       },
       cardTime: {
           fontSize: 14,
           color: '#444',
           marginBottom: 10,
           fontStyle: 'italic'
       },
       deleteButton: {
           backgroundColor: '#ff4444',
           padding: 8,
           borderRadius: 5,
           alignItems: 'center',
           marginTop: 'auto'
       },
       deleteButtonText: {
           color: '#fff',
           fontWeight: 'bold'
       }
   });

export default Panier