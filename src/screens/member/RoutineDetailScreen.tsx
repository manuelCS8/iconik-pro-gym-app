import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { COLORS, SIZES } from "../../utils/theme";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { routineService } from "../../services/routineService";
import userRoutineService from "../../services/userRoutineService";
import userPreferencesService from "../../services/userPreferencesService";
import WeightUnitSelector from "../../components/WeightUnitSelector";
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  RoutineDetail: {
    routineId: string;
    isUserRoutine?: boolean;
  };
};

interface Routine {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number;
  createdBy: string;
  isUserRoutine?: boolean;
}

interface RoutineItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  notes?: string;
  muscleGroup?: string;
  equipment?: string;
}

const windowWidth = Dimensions.get("window").width;

const RoutineDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
  const navigation = useNavigation();
  const { routineId, isUserRoutine } = route.params;
  const { user, uid } = useSelector((state: RootState) => state.auth);

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LBS'>('KG');

  // Cargar preferencias del usuario
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!uid) return;
      
      try {
        const userWeightUnit = await userPreferencesService.getWeightUnit(uid);
        setWeightUnit(userWeightUnit);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [uid]);

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        console.log('🔄 Cargando rutina con ID:', routineId, 'isUserRoutine:', isUserRoutine);
        
        let routineData: Routine | null = null;
        let exerciseData: RoutineItem[] = [];
        
        if (isUserRoutine) {
          // Cargar rutina de usuario
          console.log('👤 Cargando rutina de usuario...');
          const userRoutine = await userRoutineService.getUserRoutineById(routineId);
          if (userRoutine) {
            routineData = {
              id: userRoutine.id!,
              name: userRoutine.name,
              description: userRoutine.description,
              category: userRoutine.category,
              difficulty: userRoutine.difficulty,
              duration: userRoutine.duration,
              createdBy: userRoutine.createdBy,
              isUserRoutine: true
            };
            console.log('👤 Ejercicios del usuario:', userRoutine.exercises);
            exerciseData = userRoutine.exercises.map((ex, index) => {
              console.log(`👤 Ejercicio ${index}:`, ex);
              return {
                id: index.toString(),
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                restTime: ex.restTime,
                notes: ex.notes,
                muscleGroup: ex.primaryMuscleGroups?.[0] || 'No especificado',
                equipment: ex.equipment || 'No especificado'
              };
            });
          }
        } else {
          // Cargar rutina del gimnasio
          console.log('🏋️ Cargando rutina del gimnasio...');
          const gymRoutine = await routineService.getRoutineById(routineId);
          if (gymRoutine) {
            routineData = {
              id: gymRoutine.id!,
              name: gymRoutine.name,
              description: gymRoutine.description || '',
              category: gymRoutine.category,
              difficulty: gymRoutine.difficulty,
              duration: gymRoutine.duration,
              createdBy: gymRoutine.createdBy || 'Gimnasio',
              isUserRoutine: false
            };
            console.log('🏋️ Ejercicios del gimnasio:', gymRoutine.exercises);
            exerciseData = (gymRoutine.exercises || []).map((ex, index) => {
              console.log(`🏋️ Ejercicio ${index}:`, ex);
              return {
                id: index.toString(),
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                sets: ex.series || ex.sets || 3, // Usar 'series' si existe, sino 'sets', sino 3 por defecto
                reps: ex.reps,
                weight: ex.weight,
                restTime: ex.restTime,
                notes: ex.notes,
                muscleGroup: ex.primaryMuscleGroups?.[0] || 'No especificado',
                equipment: ex.equipment || 'No especificado'
              };
            });
          }
        }
        
        if (routineData) {
          console.log('✅ Rutina encontrada:', routineData.name);
          console.log('✅ Ejercicios encontrados:', exerciseData.length);
          console.log('✅ Datos finales de ejercicios:', exerciseData);
          
          // Debug: Verificar que los datos se mapearon correctamente
          exerciseData.forEach((item, index) => {
            console.log(`🎯 Renderizando ejercicio: ${item.exerciseName} sets: ${item.sets} reps: ${item.reps}`);
          });
          
          setRoutine(routineData);
          setItems(exerciseData);
        } else {
          console.log('❌ Rutina no encontrada');
          Alert.alert("Error", "Rutina no encontrada");
        }
      } catch (error) {
        console.error("Error loading routine:", error);
        Alert.alert("Error", "No se pudo cargar la rutina");
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [routineId, isUserRoutine]);

  const onStartRoutine = () => {
    (navigation as any).navigate("TrainingSession", { routineId, isUserRoutine });
  };

  const onEditRoutine = () => {
    console.log(`Editando rutina: ${routineId}`);
    if (isUserRoutine) {
      (navigation as any).navigate("EditRoutine", { routineId });
    } else {
      Alert.alert(
        "Editar Rutina",
        "Solo puedes editar rutinas que hayas creado tú mismo",
        [{ text: "OK" }]
      );
    }
  };

  const handleUnitChange = async (newUnit: 'KG' | 'LBS') => {
    if (!uid) return;
    
    try {
      await userPreferencesService.updateWeightUnit(uid, newUnit);
      setWeightUnit(newUnit);
    } catch (error) {
      console.error('Error updating weight unit:', error);
      Alert.alert('Error', 'No se pudo actualizar la unidad de peso');
    }
  };

  const renderItem = ({ item }: { item: RoutineItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.exerciseName}</Text>
        <View style={styles.muscleTag}>
          <Text style={styles.muscleTagText}>{item.muscleGroup}</Text>
        </View>
      </View>
      
      <View style={styles.itemStatsRow}>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>SERIE</Text>
          <Text style={styles.itemStatValue}>{item.sets}</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>Kg/LBS</Text>
          <Text style={styles.itemStatValue}>{item.weight || '-'}</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>REPS</Text>
          <Text style={styles.itemStatValue}>{item.reps}</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>ANTERIOR</Text>
          <Text style={styles.itemStatValue}>-</Text>
        </View>
      </View>
      
      <View style={styles.itemFooter}>
        <Text style={styles.itemEquipment}>📦 {item.equipment}</Text>
        <Text style={styles.itemRestTime}>⏱️ {item.restTime}s descanso</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Cargando rutina...</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Rutina no encontrada</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, backgroundColor: '#E31C1F', borderRadius: 8, padding: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header oscuro */}
      <View style={{ width: '100%', backgroundColor: '#222', paddingTop: 32, paddingBottom: 18, alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>Rutina</Text>
      </View>
      {/* Info principal */}
      <View style={{ backgroundColor: '#181818', borderRadius: 18, marginHorizontal: 14, marginBottom: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 }}>
        <Text style={{ color: '#fff', fontSize: 21, fontWeight: 'bold', marginBottom: 2 }}>{routine.name}</Text>
        <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Creada por {routine.isUserRoutine ? (user?.name || 'Tú') : 'Iconik Pro Gym'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Nivel</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.difficulty}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Objetivo</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.category}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Duración</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.duration} min</Text>
          </View>
        </View>
      </View>
      {/* Botones de acción */}
      <View style={{ marginHorizontal: 14, marginBottom: 10 }}>
        <TouchableOpacity style={{ backgroundColor: '#E31C1F', borderRadius: 8, paddingVertical: 12, alignItems: 'center', width: '100%', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 1 }} onPress={onStartRoutine}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Comenzar Rutina</Text>
        </TouchableOpacity>
        {routine.isUserRoutine && (
          <TouchableOpacity style={{ backgroundColor: '#333', borderRadius: 8, paddingVertical: 12, alignItems: 'center', width: '100%' }} onPress={onEditRoutine}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Editar Rutina</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Ejercicios */}
      <View style={{ marginHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>Ejercicios</Text>
          <Text style={{ color: '#aaa', fontSize: 14 }}>{items.length} ejercicio{items.length !== 1 ? 's' : ''}</Text>
        </View>
        {items.map((ex) => {
          console.log('🎯 Renderizando ejercicio:', ex.exerciseName, 'sets:', ex.sets, 'reps:', ex.reps);
          return (
                     <View key={ex.id} style={{ backgroundColor: '#181818', borderRadius: 20, marginBottom: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
                         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', marginRight: 12, justifyContent: 'center', alignItems: 'center' }} />
                <TouchableOpacity onPress={() => (navigation as any).navigate('ExerciseDetail', { exerciseId: ex.exerciseId })}>
                                     <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 19, marginRight: 10, textDecorationLine: 'underline' }}>{ex.exerciseName}</Text>
                </TouchableOpacity>
                                 <View style={{ backgroundColor: '#E31C1F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 6, alignSelf: 'flex-start' }}>
                   <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{ex.muscleGroup}</Text>
                 </View>
              </View>
            </View>
                         {/* Tabla de series */}
             <View style={{ marginTop: 6, marginBottom: 12 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                 <Text style={{ color: '#888', fontSize: 14, fontWeight: 'bold', width: 80, textAlign: 'center' }}>SERIE</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 80 }}>
                   <Text style={{ color: '#888', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>PESO</Text>
                   <WeightUnitSelector
                     currentUnit={weightUnit}
                     onUnitChange={handleUnitChange}
                     size="small"
                   />
                 </View>
                 <Text style={{ color: '#888', fontSize: 14, fontWeight: 'bold', width: 80, textAlign: 'center' }}>REPS</Text>
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                 <Text style={{ color: '#E31C1F', fontWeight: 'bold', width: 80, textAlign: 'center', fontSize: 17 }}>{ex.sets}</Text>
                 <Text style={{ color: '#fff', width: 80, textAlign: 'center', fontSize: 17 }}>{ex.weight || '-'}</Text>
                 <Text style={{ color: '#E31C1F', width: 80, textAlign: 'center', fontWeight: 'bold', fontSize: 17 }}>{ex.reps}</Text>
               </View>
             </View>
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 10 }}>
               <Text style={{ color: '#aaa', fontSize: 15, fontWeight: '500' }}>📦 {ex.equipment}</Text>
               <Text style={{ color: '#aaa', fontSize: 15, fontWeight: '500' }}>⏱️ {ex.restTime}s descanso</Text>
             </View>
                         {/* Notas del ejercicio */}
             {ex.notes && ex.notes.trim() && (
               <View style={{ backgroundColor: '#222', borderRadius: 10, padding: 16, borderLeftWidth: 4, borderLeftColor: '#E31C1F', marginTop: 12 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                   <Ionicons name="document-text" size={18} color="#E31C1F" />
                   <Text style={{ fontSize: 15, color: '#E31C1F', fontWeight: 'bold' }}>Notas:</Text>
                 </View>
                 <Text style={{ fontSize: 15, color: '#fff', fontStyle: 'italic', lineHeight: 22 }}>{ex.notes}</Text>
               </View>
             )}
          </View>
        );
        })}
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default RoutineDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.grayDark,
    textAlign: "center",
    marginBottom: SIZES.padding,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
     headerTitle: {
     fontSize: SIZES.fontLarge,
     fontWeight: "bold",
     color: COLORS.background,
   },
  itemRow: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.padding,
  },
     itemName: {
     fontSize: SIZES.fontMedium,
     fontWeight: "bold",
     color: COLORS.background,
     flex: 1,
   },
  muscleTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
  },
  muscleTagText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
  },
  itemStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding,
  },
  itemStatBox: {
    alignItems: "center",
    flex: 1,
  },
  itemStatLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 4,
  },
  itemStatValue: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemEquipment: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  itemRestTime: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
});