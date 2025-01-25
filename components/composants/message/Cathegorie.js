import { View, Text, SafeAreaView, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import BigRect from '../BigRect';
import { UserContext } from '../../context/UserContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config';

const WIDTH = Dimensions.get('window').height;

const Cathegorie = ({ route, navigation }) => {
  const { cathegorie } = route.params || {};
  const { currentUserNewNav } = useContext(UserContext) || {};
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (!currentUserNewNav?.email) {
      setLoader(false);
      return;
    }

    try {
      const q = query(
        collection(db, "BiblioInformatique"),
        orderBy("name", "asc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push(doc.data());
        });
        setData(items);
        setLoader(false);
      }, (error) => {
        console.error("Erreur lors de la récupération des données:", error);
        setLoader(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Erreur lors de l'initialisation du listener:", error);
      setLoader(false);
    }
  }, [currentUserNewNav?.email]);

  if (loader) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!currentUserNewNav?.email) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Veuillez vous connecter pour accéder à cette page</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={{
        height: 50,
        alignSelf: 'center',
        backgroundColor: '#DCDCDC',
        width: WIDTH
      }}>
        <Text style={{
          textAlign: 'center',
          fontWeight: '600',
          fontFamily: 'Georgia',
          marginTop: 10,
          fontSize: 20
        }}>
          {cathegorie || 'Catégorie non spécifiée'}
        </Text>
      </View>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {data.map((item, index) => (
          cathegorie === item.cathegorie ? (
            <BigRect
              key={index}
              type={item.type}
              cathegorie={item.cathegorie}
              props={navigation}
              name={item.name}
              desc={item.desc}
              etagere={item.etagere}
              exemplaire={item.exemplaire}
              image={item.image}
              salle={item.salle}
              commentaire={item.commentaire}
              nomBD={item.nomBD}
            />
          ) : (
            <View key={index} />
          )
        ))}
      </View>
    </ScrollView>
  );
};

export default Cathegorie;