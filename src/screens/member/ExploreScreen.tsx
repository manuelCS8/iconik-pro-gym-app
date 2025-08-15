import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { COLORS, SIZES } from "../../utils/theme";
import { useNavigation } from "@react-navigation/native";
import ArtisticBackground from '../../components/ArtisticBackground';

const windowWidth = Dimensions.get("window").width;

interface Routine {
  id: string;
  name: string;
  level: string;
  objective: string;
  description: string;
  duration: number; // en semanas
  exerciseCount: number;
  sessionsPerWeek: number;
  difficulty: string;
  category: string;
}

const levels = ["Principiante", "Intermedio", "Avanzado"];
const objectives = ["Hipertrofia", "Fuerza", "Resistencia", "Pérdida de Peso", "Acondicionamiento"];

// Mock data para programas/rutinas especializadas
const MOCK_PROGRAMS: Routine[] = [
  {
    id: "program1",
    name: "Programa Fuerza Básica",
    level: "Principiante",
    objective: "Fuerza",
    description: "Programa de 8 semanas para desarrollar fuerza básica con movimientos fundamentales",
    duration: 8,
    exerciseCount: 12,
    sessionsPerWeek: 3,
    difficulty: "Fácil",
    category: "Programa Estructurado",
  },
  {
    id: "program2",
    name: "Hipertrofia Push/Pull/Legs",
    level: "Intermedio",
    objective: "Hipertrofia",
    description: "Programa de 12 semanas dividido en empuje, tirón y piernas para máximo crecimiento muscular",
    duration: 12,
    exerciseCount: 18,
    sessionsPerWeek: 6,
    difficulty: "Moderado",
    category: "Programa Avanzado",
  },
  {
    id: "program3",
    name: "Quema Grasa Intensiva",
    level: "Intermedio",
    objective: "Pérdida de Peso",
    description: "Programa de 6 semanas con entrenamientos HIIT y circuitos para quemar grasa rápidamente",
    duration: 6,
    exerciseCount: 15,
    sessionsPerWeek: 5,
    difficulty: "Intenso",
    category: "Programa Metabólico",
  },
  {
    id: "program4",
    name: "Fuerza Powerlifting",
    level: "Avanzado",
    objective: "Fuerza",
    description: "Programa de 16 semanas enfocado en los 3 levantamientos básicos: sentadilla, press banca y peso muerto",
    duration: 16,
    exerciseCount: 9,
    sessionsPerWeek: 4,
    difficulty: "Muy Difícil",
    category: "Programa Especializado",
  },
  {
    id: "program5",
    name: "Acondicionamiento General",
    level: "Principiante",
    objective: "Acondicionamiento",
    description: "Programa de 4 semanas para mejorar la condición física general y preparar el cuerpo para entrenamientos más intensos",
    duration: 4,
    exerciseCount: 10,
    sessionsPerWeek: 3,
    difficulty: "Fácil",
    category: "Programa Base",
  },
  {
    id: "program6",
    name: "Resistencia Cardiovascular",
    level: "Intermedio",
    objective: "Resistencia",
    description: "Programa de 10 semanas para mejorar significativamente la resistencia cardiovascular y pulmonar",
    duration: 10,
    exerciseCount: 12,
    sessionsPerWeek: 4,
    difficulty: "Moderado",
    category: "Programa Cardio",
  },
  {
    id: "program7",
    name: "Músculo Magro Avanzado",
    level: "Avanzado",
    objective: "Hipertrofia",
    description: "Programa de 20 semanas con técnicas avanzadas para atletas experimentados que buscan máximo desarrollo",
    duration: 20,
    exerciseCount: 25,
    sessionsPerWeek: 6,
    difficulty: "Extremo",
    category: "Programa Elite",
  },
  {
    id: "program8",
    name: "Transformación 90 Días",
    level: "Principiante",
    objective: "Pérdida de Peso",
    description: "Programa completo de 12 semanas diseñado para principiantes que buscan una transformación corporal total",
    duration: 12,
    exerciseCount: 16,
    sessionsPerWeek: 4,
    difficulty: "Progresivo",
    category: "Programa Transformación",
  },
  {
    id: "program9",
    name: "Atleta Funcional",
    level: "Avanzado",
    objective: "Acondicionamiento",
    description: "Programa de 14 semanas para atletas que buscan mejorar rendimiento deportivo con movimientos funcionales",
    duration: 14,
    exerciseCount: 20,
    sessionsPerWeek: 5,
    difficulty: "Muy Difícil",
    category: "Programa Deportivo",
  },
  {
    id: "program10",
    name: "Resistencia Militar",
    level: "Intermedio",
    objective: "Resistencia",
    description: "Programa de 8 semanas inspirado en entrenamientos militares para desarrollar resistencia mental y física",
    duration: 8,
    exerciseCount: 14,
    sessionsPerWeek: 5,
    difficulty: "Intenso",
    category: "Programa Militar",
  },
];

const ExploreScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [programs, setPrograms] = useState<Routine[]>(MOCK_PROGRAMS);
  const [filteredPrograms, setFilteredPrograms] = useState<Routine[]>(MOCK_PROGRAMS);

  useEffect(() => {
    const filterPrograms = () => {
      let filtered = programs;

      // Filtrar por nivel
      if (selectedLevel) {
        filtered = filtered.filter(program => program.level === selectedLevel);
      }

      // Filtrar por objetivo
      if (selectedObjective) {
        filtered = filtered.filter(program => program.objective === selectedObjective);
      }

      setFilteredPrograms(filtered);
    };

    filterPrograms();
  }, [selectedLevel, selectedObjective, programs]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "#4CAF50"; // Verde
      case "Moderado":
        return "#FF9800"; // Naranja
      case "Intenso":
        return "#F44336"; // Rojo
      case "Muy Difícil":
        return "#9C27B0"; // Púrpura
      case "Extremo":
        return "#000000"; // Negro
      default:
        return COLORS.gray;
    }
  };

  const onProgramPress = (programId: string) => {
    console.log(`Navegando a detalle del programa: ${programId}`);
    navigation.navigate("RoutineDetail" as never, { routineId: programId } as never);
  };

  const clearFilters = () => {
    setSelectedLevel("");
    setSelectedObjective("");
  };

  const renderProgramCard = ({ item }: { item: Routine }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onProgramPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <View style={styles.levelContainer}>
            <Text style={styles.infoLabel}>Nivel:</Text>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
          <View style={styles.objectiveContainer}>
            <Text style={styles.infoLabel}>Objetivo:</Text>
            <Text style={styles.objectiveText}>{item.objective}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.duration}</Text>
            <Text style={styles.statLabel}>Semanas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.sessionsPerWeek}</Text>
            <Text style={styles.statLabel}>Días/Semana</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.exerciseCount}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>
          <View style={styles.difficultyContainer}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.startButtonText}>Toca para ver detalles</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ArtisticBackground />
      {/* Header negro superior */}
      <View style={{ width: '100%', backgroundColor: '#111', paddingTop: 30, paddingBottom: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10, zIndex: 2 }}>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>Explorar</Text>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: 18, paddingBottom: 40, backgroundColor: '#000' }}>
        {/* Filtros */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', width: '90%', alignSelf: 'center', marginBottom: 18 }}>
          <TouchableOpacity style={{ backgroundColor: '#181818', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginRight: 8, borderWidth: 1, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Filtros</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#181818', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginRight: 8, borderWidth: 1, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Nivel ▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#181818', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Objetivo ▼</Text>
          </TouchableOpacity>
        </View>
        {/* Lista de rutinas */}
        {filteredPrograms.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{ backgroundColor: '#111', borderRadius: 24, marginBottom: 24, width: '90%', paddingVertical: 32, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}
            onPress={() => onProgramPress(item.id)}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  filtersSection: {
    marginBottom: SIZES.padding,
    maxHeight: 140,
  },
  filterGroup: {
    marginRight: SIZES.padding,
    marginBottom: SIZES.padding / 2,
  },
  filterGroupTitle: {
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
  },
  chip: {
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 90,
    alignItems: "center",
  },
  chipText: {
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
  },
  clearButton: {
    alignSelf: "center",
    backgroundColor: COLORS.gray,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
  },
  resultsCounter: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
    textAlign: "center",
  },
  card: {
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
  categoryBadge: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  categoryText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.grayDark,
    fontWeight: "bold",
  },
  cardDescription: {
    fontSize: SIZES.fontSmall,
    color: COLORS.grayDark,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  objectiveContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginRight: 4,
  },
  levelText: {
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  objectiveText: {
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  difficultyContainer: {
    alignItems: "center",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  difficultyText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: "bold",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    fontStyle: "italic",
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
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    textAlign: "center",
  },
}); 