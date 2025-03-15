import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config';

export default function Notifications({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Pour l'exemple, on va créer des notifications fictives
            // Dans une vraie application, vous récupéreriez les données depuis Firestore
            const mockNotifications = [
                {
                    id: '1',
                    title: 'Rappel de retour',
                    message: 'Votre livre "Introduction à l\'algorithme" doit être rendu demain',
                    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 heures avant
                    read: false,
                    type: 'reminder'
                },
                {
                    id: '2',
                    title: 'Nouveau livre disponible',
                    message: 'Un nouveau livre que vous pourriez aimer est disponible: "Machine Learning avancé"',
                    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 jour avant
                    read: true,
                    type: 'new_book'
                },
                {
                    id: '3',
                    title: 'Offre spéciale',
                    message: 'Accès gratuit à la section Mathématiques avancées pendant une semaine!',
                    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 jours avant
                    read: true,
                    type: 'promotion'
                }
            ];

            setNotifications(mockNotifications);
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);

            // Mettre à jour les notifications localement
            const updatedNotifications = notifications.map(notification => ({
                ...notification,
                read: true
            }));

            setNotifications(updatedNotifications);

            // Dans une vraie application, vous mettriez à jour ces données dans Firestore

            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du marquage des notifications:', error);
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            // Mise à jour locale
            const updatedNotifications = notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            );

            setNotifications(updatedNotifications);

            // Dans une vraie application, vous mettriez à jour cette donnée dans Firestore
        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'reminder':
                return <Ionicons name="time-outline" size={24} color="#FF9500" />;
            case 'new_book':
                return <Ionicons name="book-outline" size={24} color="#30B0C7" />;
            case 'promotion':
                return <Ionicons name="gift-outline" size={24} color="#FF2D55" />;
            default:
                return <Ionicons name="notifications-outline" size={24} color="#8E8E93" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        } else {
            return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        }
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubText}>Vous recevrez des notifications concernant vos emprunts et les nouveautés</Text>
        </View>
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, item.read ? {} : styles.unreadItem]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.read ? '#F2F2F7' : '#E5F3FF' }]}>
                {getNotificationIcon(item.type)}
            </View>
            <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, item.read ? {} : styles.unreadText]}>
                    {item.title}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.notificationDate}>
                    {formatDate(item.date)}
                </Text>
            </View>
            {!item.read && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FF8A50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.some(n => !n.read) && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Tout marquer comme lu</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF8A50" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={notifications.length === 0 ? { flex: 1 } : {}}
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
    markAllButton: {
        padding: 8,
    },
    markAllText: {
        fontSize: 14,
        color: '#FF8A50',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
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
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        position: 'relative',
    },
    unreadItem: {
        backgroundColor: '#FAFAFE',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
        paddingRight: 16,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: '600',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 6,
    },
    notificationDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    unreadDot: {
        position: 'absolute',
        right: 16,
        top: 18,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF8A50',
    },
});