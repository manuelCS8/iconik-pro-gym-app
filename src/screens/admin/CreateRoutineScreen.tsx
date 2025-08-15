import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CreateRoutineScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#181818' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Crear Rutina Oficial</Text>
        <TouchableOpacity style={{ backgroundColor: '#ff4444', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Crear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: '#181818', borderRadius: 16, padding: 24, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Nombre de la Rutina *</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 16, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} placeholder="Ej: Pecho y Tríceps Avanzado" placeholderTextColor="#888" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Descripción</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 16, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} placeholder="Describe los objetivos y características de esta rutina..." placeholderTextColor="#888" multiline />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Nivel de Dificultad</Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#ff4444', marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Principiante</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#222', marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ccc' }}>Intermedio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#222' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ccc' }}>Avanzado</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Objetivo Principal</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 16, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} placeholder="Ej: Desarrollo muscular, Fuerza, Resistencia" placeholderTextColor="#888" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Duración Estimada (minutos)</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 16, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} placeholder="60" placeholderTextColor="#888" keyboardType="numeric" />
          <View style={{ backgroundColor: '#333', borderRadius: 8, padding: 12, marginTop: 12 }}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>Después de crear la rutina podrás agregar y configurar los ejercicios.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#181818',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#222',
    color: '#fff',
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  levelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    backgroundColor: '#222',
    marginRight: 8,
  },
  levelButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
  },
});

export default CreateRoutineScreen; 