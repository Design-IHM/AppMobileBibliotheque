import { View, Text, StyleSheet, Image, ImageBackground,TouchableOpacity } from 'react-native'
import React from 'react'

const SmallRect = ({props,image,chemin,name}) => {

  const voirPageWeb = (chemin) => {
    props.navigation.navigate('PageWeb',{
     chemin:chemin
      
    })} 

  return (
  <TouchableOpacity onPress={()=>voirPageWeb(chemin)} style={styles.contain}>
    <ImageBackground style={styles.container} source={{uri:image}}>
      <View style={styles.newTag}>
        <Text style={styles.newText}>#new</Text>
      </View>
    </ImageBackground>
    <View style={styles.textContainer}>
      <Text style={styles.nameText} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
    </View>
  </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  contain: {
    height: 190,
    width: 130,
    marginTop: 15,
    marginLeft: 10,
  },
  container: {
    height: 150,
    width: 120,
  },
  newTag: {
    height: 25,
    width: 20,
    backgroundColor: 'rgb(136,136,136)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newText: {
    fontSize: 7,
    color: '#fff',
  },
  textContainer: {
    marginTop: 5,
    width: 120,
  },
  nameText: {
    color: 'rgb(136,136,136)',
    fontSize: 15,
    flexWrap: 'wrap',
    lineHeight: 18,
  }
})

export default SmallRect