import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../utils/theme';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Routine {
  id: string;
  name: string;
  description: string;
  level: string;
  objective: string;
  estimatedDuration: number;
  exercises: any[];
  creatorType: string;
  createdAt: any;
  createdBy: string;
  isActive: boolean;
  isPublic?: boolean;
}

const UpdateRoutinesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingRoutine, setUpdatingRoutine] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setIsLoading(true);
      
      // Cargar todas las rutinas (sin filtro de isPublic)
      const routinesRef = collection(db, 'routines');
      const snapshot = await getDocs(routinesRef);
      
      const routinesFromFirestore: Routine[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          description: data.description || '',
          level: data.level || 'Principiante',
          objective: data.objective || '',
          estimatedDuration: data.estimatedDuration || 60,
          exercises: data.exercises || [],
          creatorType: data.creatorType || 'GYM',
          createdAt: data.createdAt || new Date(),
          createdBy: data.createdBy || 'admin',
          isActive: data.isActive !== false,
          isPublic: data.isPublic || false, // Campo que necesitamos agregar
        };
      });

      setRoutines(routinesFromFirestore);
      console.log(`📊 Encontradas ${routinesFromFirestore.length} rutinas en Firestore`);
      
    } catch (error) {
      console.error('Error cargando rutinas:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutinas');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoutineToPublic = async (routine: Routine) => {
    try {
      setUpdatingRoutine(routine.id);
      
      console.log(`🔄 Actualizando rutina: ${routine.name}`);
      
      // Actualizar la rutina para hacerla pública
      await updateDoc(doc(db, 'routines', routine.id), {
        isPublic: true,
        updatedAt: new Date(),
      });
      
      // Actualizar la lista local
      setRoutines(prev => prev.map(r => 
        r.id === routine.id 
          ? { ...r, isPublic: true }
          : r
      ));
      
      console.log(`✅ Rutina actualizada: ${routine.name}`);
      Alert.alert('Éxito', `Rutina "${routine.name}" ahora es pública`);
      
    } catch (error) {
      console.error('Error actualizando rutina:', error);
      Alert.alert('Error', `No se pudo actualizar la rutina "${routine.name}"`);
    } finally {
      setUpdatingRoutine(null);
    }
  };

  const updateAllRoutinesToPublic = async () => {
    try {
      setIsLoading(true);
      
      const routinesToUpdate = routines.filter(r => !r.isPublic);
      
      if (routinesToUpdate.length === 0) {
        Alert.alert('Info', 'Todas las rutinas ya son públicas');
        return;
      }
      
      console.log(`🔄 Actualizando ${routinesToUpdate.length} rutinas...`);
      
      // Actualizar todas las rutinas que no son públicas
      const updatePromises = routinesToUpdate.map(routine => 
        updateDoc(doc(db, 'routines', routine.id), {
          isPublic: true,
          updatedAt: new Date(),
        })
      );
      
      await Promise.all(updatePromises);
      
      // Actualizar la lista local
      setRoutines(prev => prev.map(r => ({ ...r, isPublic: true })));
      
      console.log(`✅ ${routinesToUpdate.length} rutinas actualizadas`);
      Alert.alert(
        'Éxito', 
        `${routinesToUpdate.length} rutinas ahora son públicas y visibles para los miembros`
      );
      
    } catch (error) {
      console.error('Error actualizando rutinas:', error);
      Alert.alert('Error', 'No se pudieron actualizar todas las rutinas');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoutineItem = ({ item }: { item: Routine }) => (
    <View style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <Text style={styles.routineName}>{item.name}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.isPublic ? COLORS.success : COLORS.warning }
        ]}>
          <Text style={styles.statusText}>
            {item.isPublic ? 'Pública' : 'Privada'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.routineDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.routineInfo}>
        <Text style={styles.routineInfoText}>
          Nivel: {item.level} • Duración: {item.estimatedDuration} min
        </Text>
        <Text style={styles.routineInfoText}>
          Ejercicios: {item.exercises.length} • Creada: {item.createdBy}
        </Text>
      </View>
      
      {!item.isPublic && (
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => updateRoutineToPublic(item)}
          disabled={updatingRoutine === item.id}
        >
          {updatingRoutine === item.id ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="globe" size={20} color={COLORS.white} />
          )}
          <Text style={styles.updateButtonText}>
            {updatingRoutine === item.id ? 'Actualizando...' : 'Hacer Pública'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const publicRoutinesCount = routines.filter(r => r.isPublic).length;
  const privateRoutinesCount = routines.filter(r => !r.isPublic).length;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔄 Actualizar Rutinas</Text>
          <Text style={styles.subtitle}>
            Hacer públicas las rutinas para que los miembros puedan verlas
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{routines.length}</Text>
            <Text style={styles.statLabel}>Total Rutinas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {publicRoutinesCount}
            </Text>
            <Text style={styles.statLabel}>Públicas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>
              {privateRoutinesCount}
            </Text>
            <Text style={styles.statLabel}>Privadas</Text>
          </View>
        </View>

        {/* Update All Button */}
        {privateRoutinesCount > 0 && (
          <View style={styles.updateAllContainer}>
            <TouchableOpacity 
              style={styles.updateAllButton}
              onPress={updateAllRoutinesToPublic}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="globe-outline" size={24} color={COLORS.white} />
              )}
              <Text style={styles.updateAllButtonText}>
                {isLoading ? 'Actualizando...' : `Hacer Públicas (${privateRoutinesCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📋 Información:</Text>
          <Text style={styles.instructionsText}>
            • Las rutinas <Text style={{ fontWeight: 'bold', color: COLORS.success }}>verdes</Text> ya son públicas{'\n'}
            • Las rutinas <Text style={{ fontWeight: 'bold', color: COLORS.warning }}>amarillas</Text> son privadas{'\n'}
            • Al hacer una rutina pública, los miembros podrán verla{'\n'}
            • Este cambio es necesario para que las rutinas aparezcan en la app
          </Text>
        </View>

        {/* Routines List */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>📋 Lista de Rutinas:</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando rutinas...</Text>
            </View>
          ) : routines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={50} color={COLORS.gray} />
              <Text style={styles.emptyText}>No hay rutinas disponibles</Text>
            </View>
          ) : (
            <FlatList
              data={routines}
              renderItem={renderRoutineItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadRoutines}>
          <Ionicons name="refresh" size={20} color={COLORS.gray} />
          <Text style={styles.refreshButtonText}>Actualizar Lista</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: SIZES.largeTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 5,
  },
  updateAllContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  updateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: 15,
    borderRadius: 8,
  },
  updateAllButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  instructionsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    lineHeight: 20,
  },
  listContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
  },
  listTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 10,
  },
  routineCard: {
    backgroundColor: COLORS.lightGray,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  routineDescription: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginBottom: 8,
  },
  routineInfo: {
    marginBottom: 10,
  },
  routineInfoText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 6,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  refreshButtonText: {
    color: COLORS.gray,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default UpdateRoutinesScreen; 