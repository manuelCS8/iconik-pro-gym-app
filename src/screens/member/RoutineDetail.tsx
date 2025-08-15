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

type RouteParams = {
  RoutineDetail: {
    routineId: string;
  };
};

interface Routine {
  id: string;
  name: string;
  creatorType: string;
  creatorId?: string;
  level: string;
  objective: string;
  description: string;
  estimatedTime: number;
  exerciseCount: number;
}

interface RoutineItem {
  id: string;
  exerciseName: string;
  series: number;
  reps: number;
  restTime: number;
  previousReps: number;
  position: number;
  muscleGroup: string;
  equipment: string;
}

const windowWidth = Dimensions.get("window").width;

// Mock data para rutinas detalladas
const MOCK_ROUTINE_DETAILS: Record<string, Routine> = {
  routine1: {
    id: "routine1",
    name: "Rutina 1 Básica Caballero",
    creatorType: "GYM",
    level: "Principiante",
    objective: "Fuerza",
    description: "Rutina ideal para principiantes enfocada en el tren superior",
    estimatedTime: 45,
    exerciseCount: 6,
  },
  routine2: {
    id: "routine2",
    name: "Rutina Pecho Intensivo",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Hipertrofia",
    description: "Entrenamiento intensivo para desarrollo del pecho",
    estimatedTime: 50,
    exerciseCount: 7,
  },
  routine3: {
    id: "routine3",
    name: "Rutina Piernas Completa",
    creatorType: "GYM",
    level: "Avanzado",
    objective: "Fuerza",
    description: "Entrenamiento completo para el tren inferior",
    estimatedTime: 60,
    exerciseCount: 8,
  },
  routine4: {
    id: "routine4",
    name: "Rutina Funcional Sin Equipos",
    creatorType: "GYM",
    level: "Principiante",
    objective: "Acondicionamiento",
    description: "Ejercicios funcionales que puedes hacer en casa",
    estimatedTime: 30,
    exerciseCount: 5,
  },
  routine5: {
    id: "routine5",
    name: "Rutina Espalda y Bíceps",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Hipertrofia",
    description: "Enfoque en el desarrollo del tren superior posterior",
    estimatedTime: 55,
    exerciseCount: 6,
  },
  // Rutinas personales
  user_routine1: {
    id: "user_routine1",
    name: "Mi Rutina de Pecho",
    creatorType: "USER",
    level: "Intermedio",
    objective: "Hipertrofia",
    description: "Mi rutina personalizada para desarrollar el pecho",
    estimatedTime: 45,
    exerciseCount: 6,
  },
  user_routine2: {
    id: "user_routine2",
    name: "Rutina Express Mañana",
    creatorType: "USER",
    level: "Principiante",
    objective: "Acondicionamiento",
    description: "Rutina rápida para hacer en las mañanas",
    estimatedTime: 25,
    exerciseCount: 4,
  },
  user_routine3: {
    id: "user_routine3",
    name: "Super Piernas",
    creatorType: "USER",
    level: "Avanzado",
    objective: "Fuerza",
    description: "Rutina intensa para el desarrollo de piernas",
    estimatedTime: 60,
    exerciseCount: 8,
  },
  // Programas de ExploreScreen
  program1: {
    id: "program1",
    name: "Programa Fuerza Básica",
    creatorType: "GYM",
    level: "Principiante",
    objective: "Fuerza",
    description: "Programa de 8 semanas para desarrollar fuerza básica con movimientos fundamentales",
    estimatedTime: 60,
    exerciseCount: 12,
  },
  program2: {
    id: "program2",
    name: "Hipertrofia Push/Pull/Legs",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Hipertrofia",
    description: "Programa de 12 semanas dividido en empuje, tirón y piernas para máximo crecimiento muscular",
    estimatedTime: 90,
    exerciseCount: 18,
  },
  program3: {
    id: "program3",
    name: "Quema Grasa Intensiva",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Pérdida de Peso",
    description: "Programa de 6 semanas con entrenamientos HIIT y circuitos para quemar grasa rápidamente",
    estimatedTime: 45,
    exerciseCount: 15,
  },
  program4: {
    id: "program4",
    name: "Fuerza Powerlifting",
    creatorType: "GYM",
    level: "Avanzado",
    objective: "Fuerza",
    description: "Programa de 16 semanas enfocado en los 3 levantamientos básicos: sentadilla, press banca y peso muerto",
    estimatedTime: 120,
    exerciseCount: 9,
  },
  program5: {
    id: "program5",
    name: "Acondicionamiento General",
    creatorType: "GYM",
    level: "Principiante",
    objective: "Acondicionamiento",
    description: "Programa de 4 semanas para mejorar la condición física general y preparar el cuerpo para entrenamientos más intensos",
    estimatedTime: 40,
    exerciseCount: 10,
  },
  program6: {
    id: "program6",
    name: "Resistencia Cardiovascular",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Resistencia",
    description: "Programa de 10 semanas para mejorar significativamente la resistencia cardiovascular y pulmonar",
    estimatedTime: 50,
    exerciseCount: 12,
  },
  program7: {
    id: "program7",
    name: "Músculo Magro Avanzado",
    creatorType: "GYM",
    level: "Avanzado",
    objective: "Hipertrofia",
    description: "Programa de 20 semanas con técnicas avanzadas para atletas experimentados que buscan máximo desarrollo",
    estimatedTime: 120,
    exerciseCount: 25,
  },
  program8: {
    id: "program8",
    name: "Transformación 90 Días",
    creatorType: "GYM",
    level: "Principiante",
    objective: "Pérdida de Peso",
    description: "Programa completo de 12 semanas diseñado para principiantes que buscan una transformación corporal total",
    estimatedTime: 60,
    exerciseCount: 16,
  },
  program9: {
    id: "program9",
    name: "Atleta Funcional",
    creatorType: "GYM",
    level: "Avanzado",
    objective: "Acondicionamiento",
    description: "Programa de 14 semanas para atletas que buscan mejorar rendimiento deportivo con movimientos funcionales",
    estimatedTime: 75,
    exerciseCount: 20,
  },
  program10: {
    id: "program10",
    name: "Resistencia Militar",
    creatorType: "GYM",
    level: "Intermedio",
    objective: "Resistencia",
    description: "Programa de 8 semanas inspirado en entrenamientos militares para desarrollar resistencia mental y física",
    estimatedTime: 65,
    exerciseCount: 14,
  },
};

// Mock data para ejercicios de rutinas
const MOCK_ROUTINE_EXERCISES: Record<string, RoutineItem[]> = {
  routine1: [
    {
      id: "1",
      exerciseName: "Press Pecho Vertical (Máquina)",
      series: 3,
      reps: 12,
      restTime: 90,
      previousReps: 12,
      position: 1,
      muscleGroup: "Pecho",
      equipment: "Máquina",
    },
    {
      id: "2",
      exerciseName: "Press Inclinado (Mancuernas)",
      series: 3,
      reps: 10,
      restTime: 90,
      previousReps: 8,
      position: 2,
      muscleGroup: "Pecho",
      equipment: "Mancuernas",
    },
    {
      id: "3",
      exerciseName: "Extensión de Tríceps",
      series: 3,
      reps: 15,
      restTime: 60,
      previousReps: 12,
      position: 3,
      muscleGroup: "Tríceps",
      equipment: "Poleas",
    },
    {
      id: "4",
      exerciseName: "Press Militar (Barra)",
      series: 3,
      reps: 8,
      restTime: 90,
      previousReps: 6,
      position: 4,
      muscleGroup: "Hombro",
      equipment: "Barra",
    },
    {
      id: "5",
      exerciseName: "Elevaciones Laterales",
      series: 3,
      reps: 12,
      restTime: 60,
      previousReps: 10,
      position: 5,
      muscleGroup: "Hombro",
      equipment: "Mancuernas",
    },
    {
      id: "6",
      exerciseName: "Fondos en Paralelas",
      series: 3,
      reps: 10,
      restTime: 90,
      previousReps: 8,
      position: 6,
      muscleGroup: "Pecho",
      equipment: "Sin Equipo",
    },
  ],
  routine2: [
    {
      id: "1",
      exerciseName: "Press Banca Plano (Barra)",
      series: 4,
      reps: 8,
      restTime: 120,
      previousReps: 8,
      position: 1,
      muscleGroup: "Pecho",
      equipment: "Barra",
    },
    {
      id: "2",
      exerciseName: "Press Inclinado (Mancuernas)",
      series: 4,
      reps: 10,
      restTime: 90,
      previousReps: 9,
      position: 2,
      muscleGroup: "Pecho",
      equipment: "Mancuernas",
    },
    {
      id: "3",
      exerciseName: "Cristos (Mancuernas)",
      series: 3,
      reps: 12,
      restTime: 75,
      previousReps: 10,
      position: 3,
      muscleGroup: "Pecho",
      equipment: "Mancuernas",
    },
    {
      id: "4",
      exerciseName: "Press Declinado (Barra)",
      series: 3,
      reps: 10,
      restTime: 90,
      previousReps: 8,
      position: 4,
      muscleGroup: "Pecho",
      equipment: "Barra",
    },
  ],
  user_routine1: [
    {
      id: "1",
      exerciseName: "Press Pecho (Mi Favorito)",
      series: 4,
      reps: 10,
      restTime: 90,
      previousReps: 10,
      position: 1,
      muscleGroup: "Pecho",
      equipment: "Máquina",
    },
    {
      id: "2",
      exerciseName: "Cristos con Mancuernas",
      series: 3,
      reps: 12,
      restTime: 60,
      previousReps: 11,
      position: 2,
      muscleGroup: "Pecho",
      equipment: "Mancuernas",
    },
  ],
};

const RoutineDetail: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
  const navigation = useNavigation();
  const { routineId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        // Simular carga desde "base de datos"
        const routineData = MOCK_ROUTINE_DETAILS[routineId];
        const exerciseData = MOCK_ROUTINE_EXERCISES[routineId] || [];

        if (routineData) {
          setRoutine(routineData);
          setItems(exerciseData);
        }
      } catch (error) {
        console.error("Error loading routine:", error);
        Alert.alert("Error", "No se pudo cargar la rutina");
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [routineId]);

  const onStartRoutine = () => {
    navigation.navigate("Training", { routineId });
  };

  const onEditRoutine = () => {
    console.log(`Editando rutina: ${routineId}`);
    Alert.alert(
      "Editar Rutina",
      "La funcionalidad de edición estará disponible pronto",
      [{ text: "OK" }]
    );
    // TODO: navigation.navigate("EditRoutine", { routineId });
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
          <Text style={styles.itemStatValue}>{item.series}</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>Kg/LBS</Text>
          <Text style={styles.itemStatValue}>-</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>REPS</Text>
          <Text style={styles.itemStatValue}>{item.reps}F</Text>
        </View>
        <View style={styles.itemStatBox}>
          <Text style={styles.itemStatLabel}>ANTERIOR</Text>
          <Text style={styles.itemStatValue}>{item.previousReps}F</Text>
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
        <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Creada por {routine.creatorType === 'GYM' ? 'Iconik Pro Gym' : user?.name || 'Tú'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Nivel</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.level}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Objetivo</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.objective}</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Duración</Text>
            <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15 }}>{routine.estimatedTime} min</Text>
          </View>
        </View>
      </View>
      {/* Botones de acción */}
      <View style={{ marginHorizontal: 14, marginBottom: 10 }}>
        <TouchableOpacity style={{ backgroundColor: '#E31C1F', borderRadius: 8, paddingVertical: 12, alignItems: 'center', width: '100%', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 1 }} onPress={onStartRoutine}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Comenzar Rutina</Text>
        </TouchableOpacity>
        {routine.creatorType === 'USER' && (
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
        {items.map((ex) => (
          <View key={ex.id} style={{ backgroundColor: '#181818', borderRadius: 14, marginBottom: 10, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#222', marginRight: 8, justifyContent: 'center', alignItems: 'center' }} />
                <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}>
                  <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 15, marginRight: 6, textDecorationLine: 'underline' }}>{ex.exerciseName}</Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: '#E31C1F', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 1, marginLeft: 2, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{ex.muscleGroup}</Text>
                </View>
              </View>
            </View>
            {/* Tabla de series */}
            <View style={{ marginTop: 2, marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', width: 55, textAlign: 'center' }}>SERIE</Text>
                <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', width: 55, textAlign: 'center' }}>Kg/LBS</Text>
                <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', width: 55, textAlign: 'center' }}>REPS</Text>
                <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', width: 55, textAlign: 'center' }}>ANTERIOR</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                <Text style={{ color: '#E31C1F', fontWeight: 'bold', width: 55, textAlign: 'center', fontSize: 14 }}>{ex.series}</Text>
                <Text style={{ color: '#fff', width: 55, textAlign: 'center', fontSize: 14 }}>-</Text>
                <Text style={{ color: '#E31C1F', width: 55, textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>{ex.reps}F</Text>
                <Text style={{ color: '#E31C1F', width: 55, textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>{ex.previousReps}F</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '500' }}>Maq: {ex.equipment}</Text>
              <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '500' }}>{ex.restTime}s descanso</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default RoutineDetail;

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
    color: COLORS.secondary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  routineInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding,
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  description: {
    fontSize: SIZES.fontRegular,
    color: COLORS.grayDark,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginBottom: SIZES.padding / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: COLORS.gray,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
  exercisesSection: {
    paddingHorizontal: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  sectionSubtitle: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  itemRow: {
    backgroundColor: COLORS.white,
    marginBottom: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.secondary,
    flex: 1,
  },
  muscleTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  muscleTagText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: "bold",
  },
  itemStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemStatBox: {
    flex: 1,
    alignItems: "center",
  },
  itemStatLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
  },
  itemStatValue: {
    fontSize: SIZES.fontSmall,
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
    color: COLORS.grayDark,
  },
  itemRestTime: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
}); 