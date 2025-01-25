import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import elec from '../../assets/biblio/elec.jpg'
import gi from '../../assets/biblio/info.jpg'
import math from '../../assets/biblio/math.jpg'
import meca from '../../assets/biblio/meca.jpg'
import physik from '../../assets/biblio/physik.jpg'
import telcom from '../../assets/biblio/telcom.jpg'
import MenGI from '../../assets/memoire1.jpg'
import memgc from '../../assets/memoire2.jpg'
import memgind from '../../assets/memoire3.jpg'
import memgele from '../../assets/memoire4.jpg'
import memgm from '../../assets/memoire5.jpg'
import memgtel from '../../assets/memoire6.jpg'
import { db } from '../../config'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import BigRect from '../composants/BigRect'
import Cercle from '../composants/Cercle'
import PubCar from '../composants/PubCar'
import PubRect from '../composants/PubRect'
import SmallRect from '../composants/SmallRect'
import { UserContext } from '../context/UserContext'

const WIDTH = Dimensions.get('screen').width
const HEIGHT = Dimensions.get('screen').height

const VueUn = (props) => {
  const { currentUserNewNav, datUser, datUserTest } = useContext(UserContext)
  const [dataWeb, setDataWeb] = useState([])
  const [loaderWeb, setLoaderWeb] = useState(true)
  const [voirDepart, setVoirDepart] = useState('departement')

  useEffect(() => {
    if (!currentUserNewNav?.email) return;

    const q = query(collection(db, 'BiblioWeb'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = []
      querySnapshot.forEach((doc) => {
        items.push(doc.data())
      })
      setDataWeb(items)
      setLoaderWeb(false)
    })

    return () => unsubscribe()
  }, [currentUserNewNav?.email])

  if (!currentUserNewNav) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in to view content</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.barre}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          style={{ flexDirection: 'row' }}
        >
          <TouchableOpacity>
            <Text style={{ fontFamily: 'Georgia', fontSize: 20, marginRight: 10, color: 'gray' }}></Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView>
        <PubCar />
        <PubRect />

        <View style={{ margin: 5, marginBottom: 47, marginTop: 10 }}>
          <View>
            <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 15, fontFamily: 'Georgia', fontWeight: '900' }}>
              #Biblio Electronique
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View>
              <Text style={{ textAlign: 'center', margin: 10, fontFamily: 'Georgia' }}>
                Lisez en ligne sur les plus grandes plateformes de e-book du monde.
              </Text>
            </View>
          </View>

          <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
            {dataWeb.map((e, index) => (
              <SmallRect key={index} props={props} image={e.image} chemin={e.chemin} name={e.name} />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 0.5, width: WIDTH, backgroundColor: 'gray' }}></View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
          <TouchableOpacity
            onPress={() => setVoirDepart('departement')}
            style={{
              backgroundColor: voirDepart == 'departement' ? 'rgb(136,136,136)' : 'rgb(32,32,32)',
              borderRadius: 10,
              shadowColor: '#171717',
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
            }}
          >
            <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#fff', margin: 10 }}>
              DEPARTEMENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setVoirDepart('memoire')}
            style={{
              backgroundColor: voirDepart == 'memoire' ? 'rgb(136,136,136)' : 'rgb(32,32,32)',
              borderRadius: 10,
              shadowColor: '#171717',
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: '#fff',
                margin: 10,
                marginLeft: 12,
              }}
            >
              MEMOIRES
            </Text>
          </TouchableOpacity>
        </View>

        {voirDepart == 'departement' ? (
          <View style={{ margin: 5, marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: 'Georgia',
                fontSize: 20,
                color: '#000',
                textAlign: 'center',
                marginBottom: 20,
                margin: 20,
              }}
            >
              LES DEPARTEMENTS
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={meca} cathegorie="Genie Mecanique" props={props} />
              <Cercle id="" datUser={datUser} image={gi} cathegorie="Genie Informatique" props={props} />
              <Cercle id="" datUser={datUser} image={math} cathegorie="Mathematique" props={props} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={elec} cathegorie="Genie Electrique" props={props} />
              <Cercle id="" datUser={datUser} image={physik} cathegorie="Physique" props={props} />
              <Cercle id="" datUser={datUser} image={telcom} cathegorie="Genie Telecom" props={props} />
            </View>
          </View>
        ) : (
          <View style={{ margin: 5, marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: 'Georgia',
                fontSize: 20,
                color: '#000',
                textAlign: 'center',
                marginBottom: 20,
                margin: 20,
              }}
            >
              ANCIENS MEMOIRES
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={MenGI} cathegorie="Memoire GI" props={props} />
              <Cercle id="" datUser={datUser} image={memgc} cathegorie="Memoire GC" props={props} />
              <Cercle id="" datUser={datUser} image={memgm} cathegorie="Memoire GM" props={props} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 1,
              }}
            >
              <Cercle id="" datUser={datUser} image={memgind} cathegorie="Memoire GInd" props={props} />
              <Cercle id="" datUser={datUser} image={memgele} cathegorie="Memoire GEle" props={props} />
              <Cercle id="" datUser={datUser} image={memgtel} cathegorie="Memoire GTel" props={props} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  barre: {
    marginTop: 5,
  },
})

export default VueUn