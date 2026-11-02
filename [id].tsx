import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function CallScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  return <View style={styles.page}>
    <Text style={styles.title}>Zentro Call</Text>
    <Text style={styles.note}>Call session: {id}</Text>
    <Text style={styles.note}>WebRTC signaling/TURN is isolated in the call service so the final implementation can be enabled without changing the messaging UI.</Text>
  </View>;
}
const styles=StyleSheet.create({page:{flex:1,alignItems:"center",justifyContent:"center",padding:25},title:{fontSize:28,fontWeight:"900"},note:{textAlign:"center",color:"#666",marginTop:10,lineHeight:21}});
