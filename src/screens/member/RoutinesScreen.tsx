import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS, SIZES } from "../../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { auth } from "../../config/firebase";

const windowWidth = Dimensions.get("window").width;

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  series: number;
  reps: number;
  restTime: number;
  order: number;
  notes?: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: number;
  exercises: RoutineExercise[];
  creatorType: 'GYM';
  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
  isActive: boolean;
  isPublic?: boolean;
}

const muscleGroups = [
  { key: "", value: "Todos" },
  { key: "Pecho", value: "Pecho" },
  { key: "Dorsales", value: "Dorsales" },
  { key: "Biceps", value: "Bíceps" },
  { key: "Triceps", value: "Tríceps" },
  { key: "Cuadriceps", value: "Cuádriceps" },
  { key: "Femorales", value: "Femorales" },
  { key: "Aductores", value: "Aductores" },
  { key: "Abdominales", value: "Abdominales" },
  { key: "Pantorrilla", value: "Pantorrilla" },
  { key: "Hombro", value: "Hombro" },
  { key: "Trapecios", value: "Trapecios" },
  { key: "Gluteo", value: "Glúteo" },
];

const equipmentTypes = [
  { key: "", value: "Todos" },
  { key: "Maquina", value: "Máquina" },
  { key: "Barra", value: "Barra" },
  { key: "Disco", value: "Disco" },
  { key: "Poleas", value: "Poleas" },
  { key: "SinEquipo", value: "Sin Equipo" },
  { key: "Mancuernas", value: "Mancuernas" },
  { key: "Banco", value: "Banco" },
  { key: "BarraZ", value: "Barra Z" },
  { key: "Cables", value: "Cables" },
  { key: "Smith", value: "Smith" },
  { key: "PesaRusa", value: "Pesa Rusa" },
];



const RoutinesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [filteredRoutines, setFilteredRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  useEffect(() => {
    const filterRoutines = () => {
      let filtered = routines;

      // Filtrar por texto de búsqueda
      if (searchText) {
        filtered = filtered.filter(routine =>
          routine.name.toLowerCase().includes(searchText.toLowerCase()) ||
          routine.description.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      // Filtrar por grupo muscular
      if (selectedMuscle) {
        filtered = filtered.filter(routine =>
          routine.exercises.some(exercise => 
            exercise.primaryMuscleGroups.includes(selectedMuscle)
          )
        );
      }

      // Filtrar por equipo
      if (selectedEquipment) {
        filtered = filtered.filter(routine =>
          routine.exercises.some(exercise => 
            exercise.equipment === selectedEquipment
          )
        );
      }

      setFilteredRoutines(filtered);
    };

    filterRoutines();
  }, [searchText, selectedMuscle, selectedEquipment, routines]);

  const loadRoutines = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando carga de rutinas...');
      
      // Verificar autenticación
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ Usuario no autenticado');
        setError('Usuario no autenticado');
        return;
      }
      
      console.log('👤 Usuario autenticado:', user.email);
      console.log('🆔 UID del usuario:', user.uid);
      
      // Verificar rol del usuario
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📋 Datos del usuario:', {
            role: userData.role,
            isActive: userData.isActive,
            membershipStatus: userData.membershipStatus
          });
        } else {
          console.log('⚠️ Documento de usuario no encontrado');
        }
      } catch (userError) {
        console.log('⚠️ Error obteniendo datos del usuario:', userError);
      }
      
      // Intentar cargar todas las rutinas primero
      console.log('📊 Intentando cargar TODAS las rutinas...');
      const routinesRef = collection(db, 'routines');
      const allSnapshot = await getDocs(routinesRef);
      
      console.log(`📊 Encontradas ${allSnapshot.docs.length} rutinas totales en Firestore`);
      
      // Mostrar detalles de cada rutina
      allSnapshot.docs.forEach((docSnap, index) => {
        const data = docSnap.data();
        console.log(`📋 Rutina ${index + 1}:`, {
          id: docSnap.id,
          name: data.name || 'Sin nombre',
          isActive: data.isActive,
          isPublic: data.isPublic,
          creatorType: data.creatorType,
          createdBy: data.createdBy,
        });
      });
      
      // Filtrar en el cliente: solo rutinas activas (sin importar isPublic)
      const routinesFromFirestore: Routine[] = allSnapshot.docs
        .map(docSnap => {
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
            updatedAt: data.updatedAt,
            createdBy: data.createdBy || 'admin',
            isActive: data.isActive !== false,
            isPublic: data.isPublic || false,
          };
        })
        .filter(routine => routine.isActive); // Solo rutinas activas
        
      console.log(`🔍 Filtrado en cliente: ${routinesFromFirestore.length} rutinas activas`);
      
      setRoutines(routinesFromFirestore);
      console.log(`✅ Cargadas ${routinesFromFirestore.length} rutinas activas desde Firestore`);

    } catch (error: any) {
      console.error('❌ Error loading routines:', error);
      
      // Log detallado del error
      if (error.code === 'permission-denied') {
        console.log('🚨 Error de permisos específico');
        console.log('🔍 Verificando reglas de Firebase...');
        console.log('📋 El usuario debe tener permisos para leer rutinas activas');
      }
      
      setError(`Error loading routines: ${error.message}`);
      
      if (routines.length === 0) {
        console.log('⚠️ No hay rutinas públicas disponibles o problemas de permisos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener color del badge según nivel
  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "Principiante":
        return "#28A745"; // Verde
      case "Intermedio":
        return "#FFC107"; // Naranja
      case "Avanzado":
        return "#C82333"; // Rojo oscuro
      default:
        return COLORS.primary;
    }
  };

  // Función para obtener color del texto según nivel
  const getLevelTextColor = (level: string) => {
    switch (level) {
      case "Principiante":
        return "#FFFFFF"; // Texto blanco
      case "Intermedio":
        return "#000000"; // Texto oscuro
      case "Avanzado":
        return "#FFFFFF"; // Texto blanco
      default:
        return COLORS.white;
    }
  };

  const onStartRoutine = (routine: Routine) => {
    // Navegar a la pantalla de detalle de rutina
    navigation.navigate('RoutineDetail', { 
      routineId: routine.id,
      isUserRoutine: false 
    });
  };

  const renderRoutineCard = ({ item }: { item: Routine }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={[styles.levelBadge, { backgroundColor: getLevelBadgeColor(item.level) }]}>
          <Text style={[styles.levelText, { color: getLevelTextColor(item.level) }]}>{item.level}</Text>
        </View>
      </View>
      
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardSubtitle}>
          Objetivo: {item.objective}
        </Text>
        <Text style={styles.cardSubtitle}>
          Duración: {item.estimatedDuration} min
        </Text>
        <Text style={styles.cardSubtitle}>
          Ejercicios: {item.exercises.length} ejercicio{item.exercises.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cardSubtitle}>
          Músculos: {item.exercises.slice(0, 2).map(ex => ex.primaryMuscleGroups[0]).join(", ")}
          {item.exercises.length > 2 && " +más"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.cardButton, { backgroundColor: COLORS.danger }]}
        onPress={() => onStartRoutine(item)}
      >
        <Text style={styles.cardButtonText}>🚀 Comenzar Rutina</Text>
      </TouchableOpacity>
    </View>
  );

  const clearFilters = () => {
    setSearchText("");
    setSelectedMuscle("");
    setSelectedEquipment("");
  };

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar rutinas..."
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor="#ccc"
      />

      {/* Filtros */}
      <View style={styles.filtersRow}>
        <View style={styles.selectBox}>
          <Picker
            selectedValue={selectedMuscle}
            onValueChange={(itemValue) => setSelectedMuscle(itemValue)}
            style={styles.picker}
            dropdownIconColor="#ccc"
          >
            {muscleGroups.map((item) => (
              <Picker.Item 
                key={item.key} 
                label={item.value} 
                value={item.key}
                color="#ccc"
              />
            ))}
          </Picker>
        </View>
        <View style={styles.selectBox}>
          <Picker
            selectedValue={selectedEquipment}
            onValueChange={(itemValue) => setSelectedEquipment(itemValue)}
            style={styles.picker}
            dropdownIconColor="#ccc"
          >
            {equipmentTypes.map((item) => (
              <Picker.Item 
                key={item.key} 
                label={item.value} 
                value={item.key}
                color="#ccc"
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Botón limpiar filtros */}
      {(searchText || selectedMuscle || selectedEquipment) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
        </TouchableOpacity>
      )}

      {/* Contador de resultados */}
      <Text style={styles.resultsCounter}>
        {filteredRoutines.length} rutina{filteredRoutines.length !== 1 ? 's' : ''} encontrada{filteredRoutines.length !== 1 ? 's' : ''}
      </Text>

      {/* Botón de Refresh */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadRoutines}>
        <Text style={styles.refreshButtonText}>
          🔄 Actualizar Rutinas
        </Text>
      </TouchableOpacity>

      {/* Lista de Rutinas Oficiales */}
      <FlatList
        data={filteredRoutines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineCard}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default RoutinesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fondo negro
    padding: SIZES.padding,
  },
  searchInput: {
    backgroundColor: '#181818', // Gris oscuro
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    fontSize: SIZES.fontRegular,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: '#333', // Gris más oscuro
    color: '#fff', // Texto blanco
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding,
  },
  selectBox: {
    backgroundColor: '#181818', // Gris oscuro
    borderRadius: SIZES.radius,
    width: (windowWidth - SIZES.padding * 2 - 16) / 2,
    borderColor: '#333',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  picker: {
    color: '#ccc',
    backgroundColor: 'transparent',
  },
  clearButton: {
    alignSelf: "center",
    backgroundColor: '#333', // Gris oscuro
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
  },
  resultsCounter: {
    fontSize: SIZES.fontSmall,
    color: '#aaa', // Gris claro
    marginBottom: SIZES.padding,
    textAlign: "center",
  },
  refreshButton: {
    alignSelf: "center",
    backgroundColor: COLORS.primary, // Rojo
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    shadowColor: '#E31C1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    backgroundColor: '#181818', // Gris oscuro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: '#fff', // Blanco
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#222', // Badge más oscuro
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 80,
    alignItems: 'center',
  },
  levelText: {
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: SIZES.fontSmall,
    color: '#ccc', // Gris claro
    marginBottom: 8,
    lineHeight: 18,
  },
  cardInfo: {
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: SIZES.fontSmall,
    color: '#aaa', // Gris claro
    marginBottom: 2,
  },
  cardButton: {
    backgroundColor: COLORS.primary, // Rojo
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    alignItems: "center",
    shadowColor: '#E31C1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
}); 