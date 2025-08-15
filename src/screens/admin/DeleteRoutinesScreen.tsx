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
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

const DeleteRoutinesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingRoutine, setDeletingRoutine] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setIsLoading(true);
      
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
          isPublic: data.isPublic || false,
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

  const deleteRoutine = async (routine: Routine) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar la rutina "${routine.name}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingRoutine(routine.id);
              
              console.log(`🗑️ Eliminando rutina: ${routine.name}`);
              
              await deleteDoc(doc(db, 'routines', routine.id));
              
              // Actualizar la lista local
              setRoutines(prev => prev.filter(r => r.id !== routine.id));
              
              console.log(`✅ Rutina eliminada: ${routine.name}`);
              Alert.alert('Éxito', `Rutina "${routine.name}" eliminada correctamente`);
              
            } catch (error) {
              console.error('Error eliminando rutina:', error);
              Alert.alert('Error', `No se pudo eliminar la rutina "${routine.name}"`);
            } finally {
              setDeletingRoutine(null);
            }
          }
        }
      ]
    );
  };

  const deleteAllRoutines = async () => {
    if (routines.length === 0) {
      Alert.alert('Info', 'No hay rutinas para eliminar');
      return;
    }

    Alert.alert(
      '⚠️ ELIMINACIÓN MASIVA',
      `¿Estás SEGURO de que quieres eliminar TODAS las ${routines.length} rutinas?\n\nEsta acción NO se puede deshacer y eliminará todas las rutinas del sistema.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'ELIMINAR TODAS',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              console.log(`🗑️ Eliminando ${routines.length} rutinas...`);
              
              // Eliminar todas las rutinas
              const deletePromises = routines.map(routine => 
                deleteDoc(doc(db, 'routines', routine.id))
              );
              
              await Promise.all(deletePromises);
              
              // Limpiar la lista local
              setRoutines([]);
              
              console.log(`✅ ${routines.length} rutinas eliminadas`);
              Alert.alert(
                'Éxito', 
                `${routines.length} rutinas eliminadas correctamente del sistema`
              );
              
            } catch (error) {
              console.error('Error eliminando rutinas:', error);
              Alert.alert('Error', 'No se pudieron eliminar todas las rutinas');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderRoutineItem = ({ item }: { item: Routine }) => (
    <View style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <Text style={styles.routineName}>{item.name}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.isActive ? COLORS.success : COLORS.gray }
        ]}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Activa' : 'Inactiva'}
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
        <Text style={styles.routineInfoText}>
          ID: {item.id}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteRoutine(item)}
        disabled={deletingRoutine === item.id}
      >
        {deletingRoutine === item.id ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="trash" size={20} color={COLORS.white} />
        )}
        <Text style={styles.deleteButtonText}>
          {deletingRoutine === item.id ? 'Eliminando...' : 'Eliminar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🗑️ Eliminar Rutinas</Text>
          <Text style={styles.subtitle}>
            Eliminar rutinas existentes del sistema
          </Text>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color={COLORS.warning} />
          <Text style={styles.warningTitle}>⚠️ ADVERTENCIA</Text>
          <Text style={styles.warningText}>
            Esta acción eliminará permanentemente las rutinas del sistema.{'\n'}
            No se puede deshacer.
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
              {routines.filter(r => r.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.gray }]}>
              {routines.filter(r => !r.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Inactivas</Text>
          </View>
        </View>

        {/* Delete All Button */}
        {routines.length > 0 && (
          <View style={styles.deleteAllContainer}>
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={deleteAllRoutines}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="trash-outline" size={24} color={COLORS.white} />
              )}
              <Text style={styles.deleteAllButtonText}>
                {isLoading ? 'Eliminando...' : `ELIMINAR TODAS (${routines.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
              <Ionicons name="checkmark-circle" size={50} color={COLORS.success} />
              <Text style={styles.emptyText}>No hay rutinas para eliminar</Text>
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
    backgroundColor: COLORS.danger,
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
  warningContainer: {
    backgroundColor: COLORS.warning,
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 5,
    marginBottom: 10,
  },
  warningText: {
    fontSize: SIZES.body,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 20,
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
  deleteAllContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    padding: 15,
    borderRadius: 8,
  },
  deleteAllButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    padding: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
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

export default DeleteRoutinesScreen; 