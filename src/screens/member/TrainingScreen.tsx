import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from "@react-navigation/native";

// Definir los tipos
interface Routine {
  id: string;
  name: string;
  creatorType: string;
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
  // ... agrega los demás mocks necesarios ...
};

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
      exerciseName: "Press Inclinado con Mancuernas",
      series: 4,
      reps: 10,
      restTime: 90,
      previousReps: 10,
      position: 2,
      muscleGroup: "Pecho",
      equipment: "Mancuernas",
    },
    {
      id: "3",
      exerciseName: "Aperturas con Polea",
      series: 3,
      reps: 15,
      restTime: 60,
      previousReps: 15,
      position: 3,
      muscleGroup: "Pecho",
      equipment: "Polea",
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
      exerciseName: "Press Declinado",
      series: 3,
      reps: 12,
      restTime: 90,
      previousReps: 12,
      position: 2,
      muscleGroup: "Pecho",
      equipment: "Barra",
    },
    {
      id: "3",
      exerciseName: "Fondos en Paralelas",
      series: 3,
      reps: 8,
      restTime: 120,
      previousReps: 8,
      position: 3,
      muscleGroup: "Pecho",
      equipment: "Peso Corporal",
    },
  ],
};

type TrainingRouteParams = {
  Training: {
    routineId: string;
  };
};

const TrainingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TrainingRouteParams, "Training">>();
  const { routineId } = route.params || {};

  const routine: Routine | undefined = routineId ? MOCK_ROUTINE_DETAILS[routineId] : undefined;
  const exercises: RoutineItem[] = routineId ? MOCK_ROUTINE_EXERCISES[routineId] || [] : [];

  // Cronómetro
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // Estado de series completadas y datos de usuario
  const [seriesState, setSeriesState] = useState(() => {
    // Estructura: { [exerciseId]: [{ reps, weight, done }] }
    const state: Record<string, { reps: string; weight: string; done: boolean }[]> = {};
    exercises.forEach((ex) => {
      state[ex.id] = Array.from({ length: ex.series }).map(() => ({ reps: "", weight: "", done: false }));
    });
    return state;
  });

  // Contador de series completadas
  const totalSeries = Object.values(seriesState).reduce((acc, arr) => acc + arr.length, 0);
  const completedSeries = Object.values(seriesState).reduce((acc, arr) => acc + arr.filter(s => s.done).length, 0);

  // Formato de tiempo
  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}min ${sec < 10 ? "0" : ""}${sec}s`;
  };

  if (!routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Rutina no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, backgroundColor: '#E31C1F', borderRadius: 8, padding: 12 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header negro con flecha y botón Terminar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingTop: 18, paddingBottom: 10, paddingHorizontal: 12, justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', flex: 1 }}>Entrenamiento</Text>
        <TouchableOpacity style={{ backgroundColor: '#E31C1F', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Terminar</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen con Ejercicios y Series */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Ejercicios</Text>
          <Text style={{ color: '#E31C1F', fontSize: 13 }}>{formatTime(seconds)}</Text>
        </View>
        <View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Series</Text>
          <Text style={{ color: '#fff', fontSize: 15 }}>{completedSeries}</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={{ height: 1, backgroundColor: '#333', marginHorizontal: 14 }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {exercises.map((ex) => (
          <View key={ex.id} style={{ backgroundColor: '#181818', borderRadius: 12, marginHorizontal: 10, marginTop: 16, marginBottom: 8, padding: 16 }}>
            {/* Título del ejercicio con icono */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#E31C1F" />
              <Text style={{ color: '#E31C1F', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>{ex.exerciseName}</Text>
            </View>

            {/* Tabla de series */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', width: 50, textAlign: 'center' }}>SERIE</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', width: 60, textAlign: 'center' }}>ANTERIOR</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', width: 60, textAlign: 'center' }}>Kg/LBS</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', width: 60, textAlign: 'center' }}>REPS</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', width: 30, textAlign: 'center' }}></Text>
            </View>

            {/* Filas de series */}
            {seriesState[ex.id].map((serie, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#E31C1F', fontWeight: 'bold', width: 50, textAlign: 'center' }}>F</Text>
                <Text style={{ color: '#fff', width: 60, textAlign: 'center' }}>{ex.previousReps || '-'}</Text>
                <TextInput
                  style={{ backgroundColor: '#222', color: '#fff', borderRadius: 6, width: 56, height: 28, textAlign: 'center', marginHorizontal: 2, fontSize: 15, borderWidth: 1, borderColor: '#fff' }}
                  placeholder="-"
                  placeholderTextColor="#888"
                  value={serie.weight}
                  keyboardType="numeric"
                  onChangeText={(val) => setSeriesState((prev) => {
                    const arr = [...prev[ex.id]];
                    arr[idx] = { ...arr[idx], weight: val };
                    return { ...prev, [ex.id]: arr };
                  })}
                />
                <TextInput
                  style={{ backgroundColor: '#222', color: '#fff', borderRadius: 6, width: 56, height: 28, textAlign: 'center', marginHorizontal: 2, fontSize: 15, borderWidth: 1, borderColor: '#fff' }}
                  placeholder="-"
                  placeholderTextColor="#888"
                  value={serie.reps}
                  keyboardType="numeric"
                  onChangeText={(val) => setSeriesState((prev) => {
                    const arr = [...prev[ex.id]];
                    arr[idx] = { ...arr[idx], reps: val };
                    return { ...prev, [ex.id]: arr };
                  })}
                />
                <TouchableOpacity onPress={() => setSeriesState((prev) => {
                  const arr = [...prev[ex.id]];
                  arr[idx] = { ...arr[idx], done: !arr[idx].done };
                  return { ...prev, [ex.id]: arr };
                })}>
                  <MaterialCommunityIcons name={serie.done ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={serie.done ? '#28A745' : '#fff'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 0,
    backgroundColor: '#111',
  },
  headerDark: {
    width: '100%',
    backgroundColor: '#222',
    paddingTop: 30,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  routineInfoBox: {
    backgroundColor: '#181818',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 18,
    alignItems: 'center',
  },
  routineName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  routineCreator: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: '#E31C1F',
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  startBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  exercisesTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editRoutineText: {
    color: '#E31C1F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  exerciseBox: {
    backgroundColor: '#181818',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#222',
  },
  exerciseName: {
    color: '#E31C1F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  seriesTable: {
    marginTop: 4,
    marginBottom: 2,
  },
  seriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  seriesHeader: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
  seriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  seriesF: {
    color: '#E31C1F',
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
  seriesWeight: {
    color: '#fff',
    width: 60,
    textAlign: 'center',
  },
  seriesReps: {
    color: '#fff',
    width: 60,
    textAlign: 'center',
  },
});

export default TrainingScreen; 