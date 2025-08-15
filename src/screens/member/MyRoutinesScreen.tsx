// src/screens/member/MyRoutinesScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from "react-native";
import { COLORS, SIZES } from "../../utils/theme";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

const windowWidth = Dimensions.get("window").width;

interface Routine {
  id: string;
  name: string;
  level: string;
  objective: string;
  createdAt: string;
  exerciseCount: number;
  estimatedTime: number; // en minutos
}

// Mock data para rutinas del usuario
const MOCK_USER_ROUTINES: Routine[] = [
  {
    id: "user_routine1",
    name: "Mi Rutina de Pecho",
    level: "Intermedio",
    objective: "Hipertrofia",
    createdAt: "2024-01-15",
    exerciseCount: 6,
    estimatedTime: 45,
  },
  {
    id: "user_routine2",
    name: "Rutina Express Mañana",
    level: "Principiante",
    objective: "Acondicionamiento",
    createdAt: "2024-01-10",
    exerciseCount: 4,
    estimatedTime: 25,
  },
  {
    id: "user_routine3",
    name: "Super Piernas",
    level: "Avanzado",
    objective: "Fuerza",
    createdAt: "2024-01-08",
    exerciseCount: 8,
    estimatedTime: 60,
  },
];

const MyRoutinesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { uid, user } = useSelector((state: RootState) => state.auth);
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    // Simular carga de rutinas del usuario
    // En el futuro aquí harías la consulta a Firestore filtrada por uid
    if (uid) {
      setMyRoutines(MOCK_USER_ROUTINES);
    }
  }, [uid]);

  const onCreateNewRoutine = () => {
    console.log("Creando nueva rutina...");
    Alert.alert(
      "Nueva Rutina",
      "¿Cómo deseas crear tu rutina?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Desde Cero", 
          onPress: () => {
            console.log("Navegando a crear rutina desde cero");
            // TODO: navigation.navigate("CreateRoutine", { mode: "new" });
          }
        },
        {
          text: "Duplicar Existente",
          onPress: () => {
            console.log("Navegando a duplicar rutina");
            // TODO: navigation.navigate("SelectRoutineToDuplicate");
          }
        }
      ]
    );
  };

  const onStartRoutine = (routineId: string) => {
    console.log(`Navigando a detalle de rutina personal: ${routineId}`);
    navigation.navigate("RoutineDetail" as never, { routineId } as never);
  };

  const onEditRoutine = (routineId: string) => {
    console.log(`Editando rutina: ${routineId}`);
    // TODO: navigation.navigate("EditRoutine", { routineId });
  };

  const onDeleteRoutine = (routineId: string, routineName: string) => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Estás seguro de que deseas borrar "${routineName}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setMyRoutines((prev) => prev.filter((r) => r.id !== routineId));
            console.log(`Rutina ${routineId} eliminada`);
            // TODO: Eliminar también de Firestore
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderItem = ({ item }: { item: Routine }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardSubtitle}>Objetivo: {item.objective}</Text>
          <Text style={styles.cardSubtitle}>
            {item.exerciseCount} ejercicios • {item.estimatedTime} min
          </Text>
          <Text style={styles.cardDate}>
            Creada: {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.cardButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => onStartRoutine(item.id)}
        >
          <Text style={styles.actionButtonText}>Comenzar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.info }]}
          onPress={() => onEditRoutine(item.id)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
          onPress={() => onDeleteRoutine(item.id, item.name)}
        >
          <Text style={styles.actionButtonText}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Sin rutinas personales</Text>
      <Text style={styles.emptySubtitle}>
        Aún no has creado ninguna rutina personalizada.
      </Text>
      <Text style={styles.emptySubtitle}>
        ¡Crea tu primera rutina usando el botón de arriba!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con botón Nueva Rutina */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Mis Rutinas</Text>
            <Text style={styles.headerSubtitle}>
              Rutinas creadas por {user?.name || "Usuario"}
            </Text>
          </View>
          <TouchableOpacity style={styles.newRoutineButton} onPress={onCreateNewRoutine}>
            <Text style={styles.newRoutineButtonText}>+ Nueva Rutina</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{myRoutines.length}</Text>
          <Text style={styles.statLabel}>Rutinas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {myRoutines.reduce((sum, routine) => sum + routine.exerciseCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Ejercicios</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.round(myRoutines.reduce((sum, routine) => sum + routine.estimatedTime, 0) / myRoutines.length) || 0}
          </Text>
          <Text style={styles.statLabel}>Min promedio</Text>
        </View>
      </View>

      {/* Lista de rutinas del usuario */}
      <FlatList
        data={myRoutines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  header: {
    marginBottom: SIZES.padding,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  headerSubtitle: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    marginTop: 4,
  },
  newRoutineButton: {
    backgroundColor: COLORS.danger,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newRoutineButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
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
    color: COLORS.secondary,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: COLORS.badgeObjetivo,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  levelText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: "bold",
  },
  cardInfo: {
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: SIZES.fontSmall,
    color: COLORS.grayLight,
    marginTop: 4,
  },
  cardButtons: {
    marginLeft: SIZES.padding,
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: SIZES.padding / 3,
    paddingHorizontal: SIZES.padding / 2,
    borderRadius: SIZES.radius / 2,
    marginBottom: 6,
    minWidth: 60,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
});

export default MyRoutinesScreen; 