import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../utils/theme";
import ArtisticBackground from "../../components/ArtisticBackground";
import { setRoutines, setLoading, setError, deleteRoutine } from "../../redux/slices/userRoutinesSlice";
import userRoutineService from "../../services/userRoutineService";

const EntrenarHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.auth);
  const { routines, loading } = useSelector((state: RootState) => state.userRoutines);
  const [showRoutines, setShowRoutines] = useState(true);

  useEffect(() => {
    if (uid) {
      loadUserRoutines();
    }
  }, [uid]);

  // Recargar rutinas cuando se regrese a esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (uid) {
        loadUserRoutines();
      }
    });

    return unsubscribe;
  }, [navigation, uid]);

  const loadUserRoutines = async () => {
    if (!uid) return;
    
    console.log('🔄 Cargando rutinas para usuario:', uid);
    dispatch(setLoading(true));
    try {
      const userRoutines = await userRoutineService.getUserRoutines(uid);
      
      console.log('✅ Rutinas cargadas:', userRoutines.length);
      
      dispatch(setRoutines(userRoutines));
    } catch (error: any) {
      console.error('❌ Error loading user routines:', error);
      dispatch(setError('Error al cargar rutinas'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteRoutine = async (routineId: string, routineName: string) => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Estás seguro de que quieres eliminar la rutina "${routineName}"?\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              dispatch(setLoading(true));
              await userRoutineService.deleteUserRoutine(routineId);
              
              // Actualizar el estado local
              dispatch(deleteRoutine(routineId));
              
              Alert.alert(
                "✅ Rutina Eliminada",
                `La rutina "${routineName}" ha sido eliminada exitosamente.`
              );
              
              console.log('✅ Rutina eliminada:', routineName);
            } catch (error: any) {
              console.error('❌ Error eliminando rutina:', error);
              Alert.alert(
                "Error",
                "No se pudo eliminar la rutina. Por favor, inténtalo de nuevo."
              );
            } finally {
              dispatch(setLoading(false));
            }
          }
        }
      ]
    );
  };



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ArtisticBackground />
      {/* Rectángulo negro superior con título */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Entrenamiento</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.headerTitle}>Entrenamiento</Text>

        {/* Botones superiores */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => navigation.navigate("CreateRoutine")}
          >
            <Ionicons name="add" size={32} color="#fff" />
            <Text style={styles.topButtonText}>Nueva Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => navigation.navigate("ExploreRoutines")}
          >
            <Ionicons name="search" size={32} color="#fff" />
            <Text style={styles.topButtonText}>Explorar</Text>
          </TouchableOpacity>
        </View>



        {/* Rutinas del usuario desplegables */}
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setShowRoutines((v) => !v)}
        >
          <Ionicons
            name={showRoutines ? "chevron-down" : "chevron-forward"}
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.dropdownHeaderText}>
            Mis Rutinas ({routines.length})
          </Text>
        </TouchableOpacity>

        {showRoutines && (
          <View style={{ width: "100%" }}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando rutinas...</Text>
              </View>
            ) : routines.length === 0 ? (
              <Text style={styles.noRoutinesText}>
                No tienes rutinas creadas
              </Text>
            ) : (
                             routines.map((rutina) => (
                 <View style={styles.rutinaCard} key={rutina.id}>
                   <View style={styles.rutinaCardHeader}>
                     <View style={styles.rutinaInfo}>
                       <Text style={styles.rutinaCardTitle}>{rutina.name}</Text>
                       <Text style={styles.rutinaCardSubtitle}>
                         {rutina.category} • {rutina.difficulty} • {rutina.duration}min
                       </Text>
                     </View>
                     <TouchableOpacity
                       onPress={() => {
                         Alert.alert(
                           "Opciones de Rutina",
                           "Selecciona una opción:",
                           [
                             {
                               text: "Eliminar Rutina",
                               style: "destructive",
                               onPress: () => handleDeleteRoutine(rutina.id!, rutina.name)
                             },
                             {
                               text: "Cancelar",
                               style: "cancel"
                             }
                           ]
                         );
                       }}
                     >
                       <Entypo name="dots-three-horizontal" size={20} color="#fff" />
                     </TouchableOpacity>
                   </View>
                   <TouchableOpacity
                     style={styles.rutinaStartButton}
                     onPress={() => navigation.navigate("RoutineDetail", { 
                       routineId: rutina.id,
                       isUserRoutine: true 
                     })}
                   >
                     <Text style={styles.rutinaStartButtonText}>Empezar Rutina</Text>
                   </TouchableOpacity>
                 </View>
               ))
            )}
          </View>
        )}

        {/* Botón Agregar Entrenamiento */}
        <TouchableOpacity
          style={styles.addTrainingButton}
          onPress={() => navigation.navigate("CreateRoutine")}
        >
          <Text style={styles.addTrainingButtonText}>Agregar Entrenamiento</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EntrenarHomeScreen;

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    backgroundColor: '#111',
    paddingTop: 30,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 18,
    paddingBottom: 40,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 18,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginBottom: 18,
  },
  topButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  topButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 2,
  },
  dropdownHeaderText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noRoutinesText: {
    color: "#fff",
    fontSize: 15,
    marginVertical: 10,
    alignSelf: "center",
    opacity: 0.8,
  },
  rutinaCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    width: '90%',
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rutinaCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rutinaCardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  rutinaStartButton: {
    backgroundColor: "#E31C1F",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 2,
    marginHorizontal: 10,
  },
  rutinaStartButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  addTrainingButton: {
    backgroundColor: "#181818",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 18,
    width: '90%',
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addTrainingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
  rutinaInfo: {
    flex: 1,
  },
  rutinaCardSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },


}); 