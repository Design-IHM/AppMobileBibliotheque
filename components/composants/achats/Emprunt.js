import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config';
import { UserContext } from '../../context/UserContext';

export default function Emprunt({ navigation }) {
    const { emailHigh } = useContext(UserContext);
    const [emprunts, setEmprunts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmprunts = async () => {
            if (!emailHigh) {
                setLoading(false);
                return;
            }

            try {
                // Récupération depuis la collection 'emprunts'
                const q = query(collection(db, 'emprunts'), where('userEmail', '==', emailHigh));
                const unsubscribe = onSnapshot(q, async (snapshot) => {
                    // Récupérer les données complètes des livres pour chaque emprunt
                    const empruntPromises = snapshot.docs.map(async (doc) => {
                        const empruntData = { id: doc.id, ...doc.data() };

                        // Vérifier si nous avons besoin de récupérer des détails supplémentaires du livre
                        if (empruntData.livreId && (!empruntData.titre || !empruntData.imageUrl)) {
                            try {
                                const livreDoc = await getDoc(doc(db, 'livres', empruntData.livreId));
                                if (livreDoc.exists()) {
                                    const livreData = livreDoc.data();
                                    // Fusionner les données du livre avec l'emprunt
                                    return {
                                        ...empruntData,
                                        titre: empruntData.titre || livreData.titre,
                                        imageUrl: empruntData.imageUrl || livreData.imageUrl,
                                    };
                                }
                            } catch (error) {
                                console.error("Erreur lors de la récupération des détails du livre:", error);
                            }
                        }
                        return empruntData;
                    });

                    const empruntData = await Promise.all(empruntPromises);
                    setEmprunts(empruntData);
                    setLoading(false);
                }, (error) => {
                    console.error("Erreur lors de l'écoute des emprunts:", error);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Erreur lors de la récupération des emprunts:', error);
                setLoading(false);
            }
        };

        fetchEmprunts();
    }, [emailHigh]);

    const navigateToBibliotheque = () => {
        navigation.navigate('VueUn');
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Aucun livre emprunté</Text>
            <Text style={styles.emptySubText}>Vos livres empruntés apparaîtront ici</Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={navigateToBibliotheque}
            >
                <Text style={styles.browseButtonText}>Parcourir la bibliothèque</Text>
            </TouchableOpacity>
        </View>
    );

    // Fonction cohérente pour formater les dates Firestore
    const formatFirestoreDate = (firestoreDate) => {
        if (!firestoreDate) return 'N/A';

        // Si la date est un timestamp Firestore (contient seconds)
        if (firestoreDate.seconds) {
            return new Date(firestoreDate.seconds * 1000).toLocaleDateString();
        }
        // Si la date est déjà un objet Date ou une chaîne ISO
        return new Date(firestoreDate).toLocaleDateString();
    };

    // Fonction pour vérifier si un emprunt est en retard
    const isEmpruntOverdue = (dateRetour) => {
        if (!dateRetour) return false;

        let dateRetourObj;
        if (dateRetour.seconds) {
            dateRetourObj = new Date(dateRetour.seconds * 1000);
        } else {
            dateRetourObj = new Date(dateRetour);
        }

        return dateRetourObj < new Date();
    };

    const renderItem = ({ item }) => {
        // Vérification si la date d'échéance est dépassée
        const isOverdue = isEmpruntOverdue(item.dateRetour);

        return (
            <TouchableOpacity
                style={styles.bookItem}
                onPress={() => {
                    // Navigation avec l'ID du livre si disponible, sinon l'ID de l'emprunt
                    const targetId = item.livreId || item.id;
                    navigation.navigate('BookDetails', {
                        bookId: targetId,
                        isEmprunt: true, // Flag pour indiquer qu'on vient de la vue emprunt
                        empruntId: item.id // Toujours envoyer l'ID de l'emprunt
                    });
                }}
            >
                <Image
                    source={
                        item.imageUrl
                            ? { uri: item.imageUrl }
                            : require('../../../assets/thesis.png')
                    }
                    style={styles.bookCover}
                    // Ajouter un gestionnaire d'erreur au cas où l'URL de l'image est invalide
                    onError={({ nativeEvent: { error } }) => {
                        console.log("Erreur de chargement d'image:", error);
                    }}
                />
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.titre || 'Titre inconnu'}</Text>
                    <View style={styles.bookMetaContainer}>
                        <View style={styles.bookMeta}>
                            <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                            <Text style={styles.bookMetaText}>
                                Emprunté le: {formatFirestoreDate(item.dateEmprunt)}
                            </Text>
                        </View>
                        <View style={styles.bookMeta}>
                            <Ionicons
                                name="time-outline"
                                size={14}
                                color={isOverdue ? '#FF3B30' : '#8E8E93'}
                            />
                            <Text
                                style={[
                                    styles.bookMetaText,
                                    isOverdue ? styles.overdueText : {}
                                ]}
                            >
                                À rendre le: {formatFirestoreDate(item.dateRetour)}
                            </Text>
                        </View>
                    </View>
                    {isOverdue && (
                        <View style={styles.overdueTag}>
                            <Text style={styles.overdueTagText}>En retard</Text>
                        </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                        <Text style={styles.statusText}>{item.statut || 'Emprunté'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Fonction pour déterminer la couleur du statut
    const getStatusColor = (status) => {
        if (!status) return '#FF8A50'; // Couleur par défaut (orange)

        switch (status.toLowerCase()) {
            case 'emprunté':
                return '#FF8A50'; // Orange principal
            case 'rendu':
                return '#4CAF50'; // Vert
            case 'en retard':
                return '#FF3B30'; // Rouge
            default:
                return '#757575'; // Gris par défaut
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FF8A50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes emprunts</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF8A50" />
                </View>
            ) : (
                <FlatList
                    data={emprunts}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={emprunts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    backButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#FF8A50',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    browseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bookItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bookCover: {
        width: 80,
        height: 120,
        backgroundColor: '#F0F0F0',
    },
    bookInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    bookMetaContainer: {
        marginTop: 4,
    },
    bookMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bookMetaText: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 4,
    },
    overdueText: {
        color: '#FF3B30',
    },
    overdueTag: {
        position: 'absolute',
        right: 12,
        top: 12,
        backgroundColor: '#FF3B3020',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    overdueTagText: {
        fontSize: 10,
        color: '#FF3B30',
        fontWeight: '500',
    },
    statusBadge: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});