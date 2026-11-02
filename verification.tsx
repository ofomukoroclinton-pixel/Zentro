import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../src/lib/supabase";
import { useSession } from "../../src/store/session";

export default function FounderVerification() {
  const {user}=useSession(); const [rows,setRows]=useState<any[]>([]);
  async function load(){if(!user)return; const {data,error}=await supabase.from("zentro_verification_requests").select("id,user_id,status,submitted_at,reviewed_at,reviewed_by").eq("status","pending").order("submitted_at",{ascending:true}).limit(100);if(error)throw error;setRows(data||[])}
  useEffect(()=>{load().catch(e=>Alert.alert("Restricted",e.message||"Founder/admin access required."))},[user]);
  async function decide(row:any,status:"approved"|"rejected"){
    try{
      const {data:request,error}=await supabase.from("zentro_verification_requests").select("user_id").eq("id",row.id).single();if(error)throw error;
      const {error:updateError}=await supabase.from("zentro_verification_requests").update({status,reviewed_at:new Date().toISOString(),reviewed_by:user?.id}).eq("id",row.id);if(updateError)throw updateError;
      if(status==="approved"){const {error:e}=await supabase.from("zentro_verified_members").upsert({user_id:request.user_id,verified_at:new Date().toISOString(),reviewed_by:user?.id},{onConflict:"user_id"});if(e)throw e}
      else await supabase.from("zentro_verified_members").delete().eq("user_id",request.user_id);
      await load();
    }catch(e:any){Alert.alert("Action failed",e.message||"Founder/admin permission required.")}
  }
  return <View style={styles.page}><Text style={styles.title}>Verification Queue</Text><FlatList data={rows} keyExtractor={x=>x.id} renderItem={({item})=><View style={styles.card}><Text style={styles.id}>Applicant: {item.user_id}</Text><Text>Submitted: {new Date(item.submitted_at).toLocaleString()}</Text><View style={styles.actions}><Pressable onPress={()=>decide(item,"approved")} style={styles.approve}><Text>Approve</Text></Pressable><Pressable onPress={()=>decide(item,"rejected")} style={styles.reject}><Text>Reject</Text></Pressable></View></View>}/></View>
}
const styles=StyleSheet.create({page:{flex:1,padding:16},title:{fontSize:26,fontWeight:"900",marginBottom:12},card:{padding:14,borderWidth:1,borderColor:"#ddd",borderRadius:14,marginBottom:10},id:{fontWeight:"800",marginBottom:5},actions:{flexDirection:"row",gap:10,marginTop:12},approve:{padding:10,backgroundColor:"#dff5e3",borderRadius:10},reject:{padding:10,backgroundColor:"#ffe4e4",borderRadius:10}});
