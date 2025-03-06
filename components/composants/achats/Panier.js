import React, { useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Dialog from "react-native-dialog";
import { doc, onSnapshot, collection, getDoc, writeBatch, increment, query, where, getDocs, limit } from "firebase/firestore";
import { UserContext } from '../../context/UserContext';
import { db } from '../../../firebaseConfig';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const CathegorieBiblio = ({ cathegorie, donnee }) => {
    const activeReservations = [
        { etat: donnee.etat1, details: donnee.tabEtat1, index: 1 },
        { etat: donnee.etat2, details: donnee.tabEtat2, index: 2 },
        { etat: donnee.etat3, details: donnee.tabEtat3, index: 3 },
    ].filter(res => res.etat === 'reserv');

    return (
        <View style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{cathegorie}</Text>
            </View>
            <View style={styles.reservationsContainer}>
                {activeReservations.map((reservation, index) => (
                    <Cadre
                        key={index}
                        name={reservation.details[0]}
                        cathegorie={reservation.details[1]}
                        image={reservation.details[2]}
                        exemplaire={reservation.details[3]}
                        nomBD={reservation.details[4]}
                        dateHeure={reservation.details[5]}
                        etatIndex={reservation.index}
                    />
                ))}
            </View>
        </View>
    );
}

const CathegorieBiblio1 = ({ cathegorie, currentUser, donnee }) => {
    const [biblioData1, setBiblioData1] = useState([]);
    const [biblioLoader1, setBiblioLoader1] = useState(true);

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

    return (
        <SafeAreaView>
            <ScrollView>
                {biblioLoader1 ? (
                    <ActivityIndicator size="large" color="#00ff00" />
                ) : (
                    <View style={{ backgroundColor: '#C8C8C8', justifyContent: 'space-between', flexDirection: 'row' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'black', margin: 10, fontFamily: 'Cochin' }}>{cathegorie}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const Panier = (props) => {
    const { currentUserNewNav: currentUserdata } = useContext(UserContext);
    const [dat, setDat] = useState({});
    const [panierLoader, setPanierLoader] = useState(true);

    useEffect(() => {
        if (!db || !currentUserdata?.email) {
            console.log('Pas de connexion à la base de données ou pas d\'email');
            return;
        }

        const userRef = doc(db, "BiblioUser", currentUserdata.email);
        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                setDat(userData);
            } else {
                setDat({});
            }
            setPanierLoader(false);
        }, (error) => {
            console.error("Erreur lors de la récupération des données:", error);
            setPanierLoader(false);
        });

        return () => unsubscribe();
    }, [currentUserdata?.email]);

    const hasActiveReservations = (data) => {
        return [data.etat1, data.etat2, data.etat3].some(etat => etat === 'reserv');
    };

    const hasEmprunts = (data) => {
        return [data.etat1, data.etat2, data.etat3].some(etat => etat === 'emprunt');
    };

    return (
        <ScrollView>
            {panierLoader ? (
                <ActivityIndicator size="large" color="#00ff00" />
            ) : (
                <View>
                    {hasActiveReservations(dat) ? (
                        <CathegorieBiblio donnee={dat} cathegorie='Reservation' />
                    ) : (
                        <View>
                            <Text style={{ textAlign: 'center', fontWeight: '900', fontSize: 28, fontFamily: 'Cochin' }}>0 RESERVATION</Text>
                        </View>
                    )}
                    {hasEmprunts(dat) ? (
                        <CathegorieBiblio1 donnee={dat} cathegorie='emprunt' currentUser={currentUserdata?.email} />
                    ) : (
                        <View>
                            <Text style={{ textAlign: 'center', fontWeight: '900', fontSize: 28, fontFamily: 'Cochin', marginTop: 50 }}></Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const Cadre = ({ cathegorie, desc, exemplaire, image, name, matricule, cathegorie2, nomBD, dateHeure, etatIndex }) => {
    const { currentUserNewNav: currentUserdata } = useContext(UserContext);
    const [showDialog, setShowDialog] = useState(false);
    const [imageError, setImageError] = useState(false);

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

    const defaultImage = require('../../../assets/biblio/math.jpg');
    const imageSource = !image || imageError ? defaultImage : { uri: image };

   
    const annulerReservation = async (etatIndex) => {
        if (!currentUserdata?.email) {
            Alert.alert('Erreur', 'Vous devez être connecté pour annuler une réservation');
            return;
        }

        try {
            const userRef = doc(db, "BiblioUser", currentUserdata.email);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                Alert.alert('Erreur', 'Utilisateur non trouvé');
                return;
            }

            const userData = userDoc.data() || {};

            // Vérifier si l'état correspondant est bien en "reserv"
            if (userData[`etat${etatIndex}`] !== 'reserv') {
                Alert.alert('Erreur', 'Aucune réservation trouvée pour cet emplacement');
                return;
            }

            // Récupérer les informations du livre réservé
            const livreReserve = userData[`tabEtat${etatIndex}`];
            
            if (!livreReserve || livreReserve.length < 5) {
                Alert.alert('Erreur', 'Données de réservation incomplètes');
                return;
            }
            
            const nomLivre = livreReserve[0];       // Nom du livre
            const collectionName = livreReserve[4]; // Collection du livre

            console.log('Nom du livre:', nomLivre);
            console.log('Collection:', collectionName);

            // Vérifier que la collection existe
            if (!collectionName) {
                Alert.alert('Erreur', 'Information de collection manquante');
                return;
            }

            // Mettre à jour les données utilisateur
            const batch = writeBatch(db);
            
            // Réinitialiser l'état et le tableau de réservation de l'utilisateur
            batch.update(userRef, {
                [`etat${etatIndex}`]: 'ras',
                [`tabEtat${etatIndex}`]: []
            });

            // Chercher le livre par son nom dans la collection appropriée
            const livresRef = collection(db, collectionName);
            const q = query(livresRef, where("name", "==", nomLivre));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // Livre trouvé par requête
                const livreDoc = querySnapshot.docs[0];
                
                // Incrémenter le nombre d'exemplaires disponibles
                batch.update(livreDoc.ref, {
                    exemplaire: increment(1)
                });
            } else {
                console.log(`Aucun livre trouvé avec le nom "${nomLivre}" dans la collection "${collectionName}"`);
                // Continuer quand même pour au moins libérer la réservation
            }
            
            await batch.commit();
            Alert.alert('Succès', 'Réservation annulée avec succès');

        } catch (error) {
            console.error('Erreur lors de l\'annulation de la réservation:', error);
            Alert.alert('Erreur', `Une erreur est survenue: ${error.message}`);
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
                        annulerReservation(etatIndex);
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

export default Panier;
