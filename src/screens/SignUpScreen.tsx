import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignUp = async () => {
    try {
   sigue    // ... existing code ...
    } catch (error: any) {
      Alert.alert("Error al registrarse", error.message);
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
      <Button title="Regístrate" onPress={onSignUp} />
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