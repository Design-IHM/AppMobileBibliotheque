import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { AirbnbRating } from 'react-native-ratings';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const Commentaire = ({ comments, onAddComment, currentUser }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);

  const renderComment = ({ item }) => {
    const date = new Date(item.heure.seconds * 1000);
    const formattedDate = date.toLocaleDateString();
    
    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={require('../../../assets/userIcone.png')} 
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.nomUser}</Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <AirbnbRating
            count={5}
            defaultRating={item.note}
            size={16}
            showRating={false}
            isDisabled={true}
          />
        </View>
        
        <Text style={styles.commentText}>{item.texte}</Text>
      </View>
    );
  };

  const handleSubmit = () => {
    if (newComment.trim() && rating > 0) {
      onAddComment({
        texte: newComment,
        note: rating,
        heure: new Date(),
        nomUser: currentUser
      });
      setNewComment('');
      setRating(0);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Évaluations et avis</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Écrire un avis</Text>
        </TouchableOpacity>
      </View>

      {comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Soyez le premier à donner votre avis</Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Donnez votre avis</Text>
            
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Votre note</Text>
              <AirbnbRating
                count={5}
                defaultRating={rating}
                size={30}
                showRating={false}
                onFinishRating={setRating}
              />
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Partagez votre expérience..."
              multiline
              value={newComment}
              onChangeText={setNewComment}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Publier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  commentCard: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  ratingContainer: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: HEIGHT * 0.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default Commentaire;