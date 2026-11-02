import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../../src/store/session";

export default function Profile() {
  const { user, signOut } = useSession();
  const name = user?.user_metadata?.display_name || user?.email || "Zentro User";
  return <View style={styles.page}>
    <View style={styles.avatar}><Text style={styles.initial}>{String(name)[0]?.toUpperCase() || "Z"}</Text></View>
    <Text style={styles.name}>{name}</Text>
    {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
    <Pressable style={styles.button} onPress={()=>router.push("/verification")}><Text style={styles.buttonText}>Request Verification</Text></Pressable>
    <Pressable style={styles.secondary} onPress={()=>router.push("/notifications")}><Text>Notifications</Text></Pressable>
    <Pressable style={styles.secondary} onPress={()=>router.push("/settings/notifications")}><Text>Notification Settings</Text></Pressable>
    <Pressable style={styles.secondary} onPress={()=>router.push("/create-post")}><Text>Create a Post</Text></Pressable>
    <Pressable style={styles.signout} onPress={()=>signOut().catch(e=>Alert.alert("Sign out failed",e.message))}><Text>Sign out</Text></Pressable>
  </View>;
}
const styles=StyleSheet.create({
  page:{flex:1,padding:22,alignItems:"center"},avatar:{width:92,height:92,borderRadius:46,backgroundColor:"#e8e8ef",alignItems:"center",justifyContent:"center",marginTop:30},
  initial:{fontSize:34,fontWeight:"900"},name:{fontSize:24,fontWeight:"900",marginTop:14},email:{color:"#777",marginTop:4},
  button:{width:"100%",padding:16,borderRadius:14,backgroundColor:"#111827",alignItems:"center",marginTop:28},buttonText:{color:"#fff",fontWeight:"900"},
  secondary:{width:"100%",padding:16,borderRadius:14,borderWidth:1,borderColor:"#ddd",alignItems:"center",marginTop:10},signout:{padding:16,marginTop:10}
});
