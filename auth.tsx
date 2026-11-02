import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const result = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (result.error) return Alert.alert("Zentro", result.error.message);
    if (signup) Alert.alert("Zentro", "Check your email if verification is required.");
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Zentro</Text>
      <Text style={styles.subtitle}>Real people. Meaningful connections.</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.primary} onPress={submit} disabled={busy}>
        <Text style={styles.primaryText}>{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</Text>
      </Pressable>
      <Pressable onPress={() => setSignup(!signup)}>
        <Text style={styles.link}>{signup ? "Already have an account? Log in" : "Create a Zentro account"}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,justifyContent:"center",padding:24,gap:14,backgroundColor:"#fff"},
  logo:{fontSize:40,fontWeight:"800",textAlign:"center"},
  subtitle:{textAlign:"center",color:"#666",marginBottom:18},
  input:{borderWidth:1,borderColor:"#ddd",borderRadius:14,padding:15,fontSize:16},
  primary:{backgroundColor:"#111",padding:16,borderRadius:14,alignItems:"center"},
  primaryText:{color:"#fff",fontWeight:"700"},
  link:{textAlign:"center",marginTop:8,fontWeight:"600"}
});
