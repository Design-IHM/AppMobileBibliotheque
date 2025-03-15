import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Image, Share } from 'react-native';
import React, { useState } from 'react';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function InviteStudent({ navigation }) {
    const [email, setEmail] = useState('');
    const [recentContacts, setRecentContacts] = useState([
        { id: '1', name: 'Amina Diop', email: 'amina.diop@example.com', image: null },
        { id: '2', name: 'Mamadou Sow', email: 'mamadou.sow@example.com', image: null },
        { id: '3', name: 'Fatou Ndiaye', email: 'fatou.ndiaye@example.com', image: null },
    ]);

    const handleInvite = () => {
        if (!email) {
            alert('Veuillez entrer une adresse e-mail');
            return;
        }

        // Here you would typically send an invitation email
        // For now, just show an alert
        alert(`Invitation envoyée à ${email}`);
        setEmail('');
    };

    const handleContactInvite = (contact) => {
        // Here you would typically send an invitation email to the selected contact
        alert(`Invitation envoyée à ${contact.name} (${contact.email})`);
    };

    const handleShareInvite = async () => {
        try {
            await Share.share({
                message: 'Rejoignez BiblioApp pour découvrir et emprunter des livres de notre bibliothèque universitaire ! Téléchargez l\'application ici : https://biblioapp.example.com',
            });
        } catch (error) {
            alert(`Erreur lors du partage: ${error.message}`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FF8A50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inviter un étudiant</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    Invitez d'autres étudiants à découvrir notre bibliothèque numérique
                </Text>

                {/* Email invitation section */}
                <View style={styles.inviteSection}>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={20} color="#8E8E93" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Adresse e-mail"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.inviteButton}
                        onPress={handleInvite}
                    >
                        <Text style={styles.inviteButtonText}>Inviter</Text>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.line} />
                </View>

                {/* Share options */}
                <TouchableOpacity
                    style={styles.shareOption}
                    onPress={handleShareInvite}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FF8A5020' }]}>
                        <Ionicons name="share-social" size={20} color="#FF8A50" />
                    </View>
                    <Text style={styles.shareOptionText}>Partager le lien d'invitation</Text>
                    <MaterialIcons name="arrow-forward-ios" size={16} color="#CCCCCC" />
                </TouchableOpacity>

                {/* Recent contacts */}
                <Text style={styles.contactsTitle}>Contacts récents</Text>
                <FlatList
                    data={recentContacts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => handleContactInvite(item)}
                        >
                            <View style={styles.avatarContainer}>
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.placeholderAvatar}>
                                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactEmail}>{item.email}</Text>
                            </View>
                            <TouchableOpacity style={styles.contactInviteButton}>
                                <Text style={styles.contactInviteText}>Inviter</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            </View>
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    inviteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        marginRight: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    inviteButton: {
        backgroundColor: '#FF8A50',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5EA',
    },
    dividerText: {
        paddingHorizontal: 16,
        color: '#8E8E93',
        fontSize: 14,
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    shareOptionText: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
    },
    contactsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 12,
        marginTop: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    placeholderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF8A5030',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF8A50',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    contactEmail: {
        fontSize: 14,
        color: '#8E8E93',
    },
    contactInviteButton: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    contactInviteText: {
        fontSize: 14,
        color: '#FF8A50',
        fontWeight: '500',
    },
});