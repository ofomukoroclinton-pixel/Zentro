import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../src/lib/supabase";
import { useSession } from "../../src/store/session";

export default function FounderAnnouncement() {
  const { user }=useSession(); const [title,setTitle]=useState(""); const [body,setBody]=useState(""); const [busy,setBusy]=useState(false);
  async function publish(){
    if(!user||!title.trim()||!body.trim())return;
    setBusy(true);
    try{
      const {error}=await supabase.from("announcements").insert({title:title.trim(),content:body.trim(),author_id:user.id,is_official:true});
      if(error)throw error;
      setTitle("");setBody("");Alert.alert("Published","The official announcement was created.");
    }catch(e:any){Alert.alert("Not published",e.message||"Founder permission is required.")}finally{setBusy(false)}
  }
  return <View style={styles.page}><Text style={styles.title}>Founder Announcement</Text><Text style={styles.badge}>OFFICIAL FOUNDER</Text>
    <TextInput value={title} onChangeText={setTitle} placeholder="Announcement title" style={styles.input}/>
    <TextInput value={body} onChangeText={setBody} placeholder="Write the announcement..." multiline style={[styles.input,{height:180,textAlignVertical:"top"}]}/>
    <Pressable onPress={publish} style={styles.button}><Text style={{color:"#fff",fontWeight:"900"}}>{busy?"Publishing…":"Publish Official Announcement"}</Text></Pressable>
  </View>
}
const styles=StyleSheet.create({page:{padding:18,gap:14},title:{fontSize:27,fontWeight:"900"},badge:{alignSelf:"flex-start",paddingHorizontal:10,paddingVertical:6,borderRadius:20,backgroundColor:"#111827",color:"#fff",fontWeight:"900"},input:{borderWidth:1,borderColor:"#ddd",borderRadius:14,padding:14},button:{backgroundColor:"#111827",padding:16,borderRadius:14,alignItems:"center"}});
