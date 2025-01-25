import { View, Text, SafeAreaView, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import BigRect from '../BigRect';
import { UserContextNavApp } from '../../navigation/NavApp';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config';

const WIDTH = Dimensions.get('window').height;

const Cathegorie = ({ route, navigation }) => {
  const { cathegorie } = route.params || {};
  const { currentUserdata } = useContext(UserContextNavApp) || {};
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (!currentUserdata?.email) {
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
        console.error("Error fetching data:", error);
        setLoader(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing listener:", error);
      setLoader(false);
    }
  }, [currentUserdata?.email]);

  if (loader) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!currentUserdata?.email) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in to access this page</Text>
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
          {cathegorie || 'Category not specified'}
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
              datUser={currentUserdata}
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