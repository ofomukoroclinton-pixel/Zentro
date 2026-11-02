import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/lib/supabase";
import { useSession } from "../src/store/session";
import { router } from "expo-router";

export default function CreatePost() {
  const {user}=useSession(); const [caption,setCaption]=useState(""); const [asset,setAsset]=useState<any>(); const [busy,setBusy]=useState(false);
  async function pick(){const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images","videos"],quality:0.9});if(!r.canceled)setAsset(r.assets[0])}
  async function publish(){
    if(!user)return; if(!caption.trim()&&!asset)return Alert.alert("Add something","Write a caption or select media.");
    setBusy(true);
    try{
      let url=null, media_type="text";
      if(asset){
        media_type=asset.type==="video"?"video":"image";
        const ext=(asset.fileName?.split(".").pop()|| (media_type==="video"?"mp4":"jpg")).replace(/[^a-z0-9]/gi,"");
        const path=`posts/${user.id}/${Date.now()}.${ext}`;
        const response=await fetch(asset.uri); const blob=await response.blob();
        const {error}=await supabase.storage.from("post-images").upload(path,blob,{contentType:asset.mimeType||"application/octet-stream"});
        if(error)throw error; url=supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
      }
      const {error}=await supabase.from("posts").insert({user_id:user.id,content:caption.trim(),image_url:url,media_type});
      if(error)throw error; Alert.alert("Posted","Your post is live."); router.back();
    }catch(e:any){Alert.alert("Could not publish",e.message||"Please try again.")}finally{setBusy(false)}
  }
  return <ScrollView contentContainerStyle={styles.page}><Text style={styles.title}>Create Post</Text>
    <TextInput value={caption} onChangeText={setCaption} multiline placeholder="What's happening on Zentro?" style={styles.caption}/>
    <Pressable onPress={pick} style={styles.mediaBtn}><Text>{asset?"Change media":"Add photo or video"}</Text></Pressable>
    {!!asset&&<View style={styles.preview}><Text>{asset.type==="video"?"Video selected":"Image selected"}{asset.fileName?` · ${asset.fileName}`:""}</Text></View>}
    <Pressable disabled={busy} onPress={publish} style={styles.publish}><Text style={{color:"#fff",fontWeight:"900"}}>{busy?"Publishing…":"Publish"}</Text></Pressable>
  </ScrollView>
}
const styles=StyleSheet.create({page:{padding:18,gap:14},title:{fontSize:28,fontWeight:"900"},caption:{minHeight:150,borderWidth:1,borderColor:"#ddd",borderRadius:16,padding:14,textAlignVertical:"top"},mediaBtn:{padding:16,borderWidth:1,borderColor:"#ddd",borderRadius:14,alignItems:"center"},preview:{padding:14,backgroundColor:"#f2f2f4",borderRadius:12},publish:{backgroundColor:"#111827",padding:16,borderRadius:14,alignItems:"center"}});
