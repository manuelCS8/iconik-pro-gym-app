import React, { useState } from "react";
import { View, Button, Alert, StyleSheet, TextInput } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function CreateExerciseScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tips, setTips] = useState("");

  const pickVideo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "video/*" });
    if (res.type === "success") setVideoUri(res.uri);
  };

  const uploadVideo = async () => {
    if (!videoUri) return Alert.alert("Selecciona un video primero");
    if (!exerciseName) return Alert.alert("Ingresa el nombre del ejercicio");

    try {
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const filename = `videos/${Date.now()}_${videoUri.split("/").pop()}`;
      const storageRef = ref(storage, filename);
      const task = uploadBytesResumable(storageRef, blob);

      task.on(
        "state_changed",
        snapshot => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Progreso: ${Math.round(pct)}%`);
        },
        error => Alert.alert("Error al subir video", error.message),
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          
          // Guardar en Firestore
          await addDoc(collection(firestore, "exercises"), {
            name: exerciseName,
            videoUrl: downloadURL,
            primaryMuscle,
            equipment,
            difficulty,
            instructions,
            tips,
            createdAt: serverTimestamp(),
          });

          Alert.alert("Éxito", "Ejercicio creado correctamente");
          // Limpiar formulario
          setVideoUri(null);
          setExerciseName("");
          setPrimaryMuscle("");
          setEquipment("");
          setDifficulty("");
          setInstructions("");
          setTips("");
        }
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nombre del ejercicio"
        value={exerciseName}
        onChangeText={setExerciseName}
        style={styles.input}
      />
      <TextInput
        placeholder="Músculo principal"
        value={primaryMuscle}
        onChangeText={setPrimaryMuscle}
        style={styles.input}
      />
      <TextInput
        placeholder="Equipamiento"
        value={equipment}
        onChangeText={setEquipment}
        style={styles.input}
      />
      <TextInput
        placeholder="Dificultad"
        value={difficulty}
        onChangeText={setDifficulty}
        style={styles.input}
      />
      <TextInput
        placeholder="Instrucciones"
        value={instructions}
        onChangeText={setInstructions}
        multiline
        style={[styles.input, styles.multilineInput]}
      />
      <TextInput
        placeholder="Consejos"
        value={tips}
        onChangeText={setTips}
        multiline
        style={[styles.input, styles.multilineInput]}
      />
      <Button title="Seleccionar Video" onPress={pickVideo} />
      {videoUri && <Button title="Subir Ejercicio" onPress={uploadVideo} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 12,
    borderBottomWidth: 1,
    padding: 8,
    borderColor: '#ccc',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 