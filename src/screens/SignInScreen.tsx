import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";
import { signInWithEmailAndPassword, firestore } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";

export default function SignInScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignIn = async () => {
    try {
      const data = await signInWithEmailAndPassword(email, password);
      const userId = data.localId;
      const snap = await getDoc(doc(firestore, "users", userId));
      if (!snap.exists()) throw new Error("Perfil no encontrado");
      const userData = snap.data();
      dispatch(setUser({
        uid: userId,
        email: userData.email,
        role: userData.role?.toUpperCase(), // <-- Siempre mayúsculas
        membershipEnd: userData.membershipEnd || null,
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
      }));
      const role = userData.role?.toUpperCase();
      console.log("ROL DEL USUARIO:", role);
      if (role === "ADMIN" || role === "MEMBER") {
        navigation.replace(role === "ADMIN" ? "Dashboard" : "EntrenarTab");
      } else {
        Alert.alert("Error", "Rol de usuario no válido.");
      }
    } catch (error: any) {
      Alert.alert("Error al iniciar sesión", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Iniciar Sesión" onPress={onSignIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 12,
    borderBottomWidth: 1,
    padding: 8,
    borderColor: '#ccc',
  },
}); 