import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, Dimensions, TouchableOpacity, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { SIZES } from "../../utils/theme";
import { useTheme } from "../../contexts/ThemeContext";
import syncService from "../../services/syncService";
import ConnectionStatus from "../../components/ConnectionStatus";
import ArtisticBackground from "../../components/ArtisticBackground";
import SparklineTraining from "../../components/SparklineTraining";
import { useTabBarVisibility } from "../../hooks/useTabBarVisibility";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import trainingHistoryService from "../../services/trainingHistoryService";

const windowWidth = Dimensions.get("window").width;

interface TrainingStats {
  todayWorkouts: number;
  todayVolume: number;
  totalWorkouts: number;
  totalVolume: number;
  streak: number;
}

const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { uid, name: userNameFromRedux, displayName, user } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string>("");
  const [membershipEnd, setMembershipEnd] = useState<string>("");
  const [stats, setStats] = useState<TrainingStats>({
    todayWorkouts: 0,
    todayVolume: 0,
    totalWorkouts: 0,
    totalVolume: 0,
    streak: 0
  });
  const [motivationalText, setMotivationalText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Hook para manejar la visibilidad de la barra de navegación
  const { handleScroll } = useTabBarVisibility();

  // Array de frases motivacionales
  const motivationalQuotes = [
    "\"La fuerza no viene de lo que puedes hacer. Viene de superar lo que alguna vez creíste que no podías.\"",
    "\"El único entrenamiento malo es el que no haces.\"",
    "\"Tu cuerpo puede resistirlo. Tu mente es la que tienes que convencer.\"",
    "\"No se trata de ser perfecto, se trata de ser mejor que ayer.\"",
    "\"El éxito comienza con la voluntad de intentarlo.\"",
    "\"Cada repetición te acerca más a tu objetivo.\"",
    "\"No encuentres excusas, encuentra una manera.\"",
    "\"Los resultados se logran fuera de la zona de confort.\"",
  ];

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!uid) return;
      
      setIsLoading(true);
      try {
        // Inicializar servicio de sincronización
        syncService.initialize();
        
        // 1. Cargar información del usuario desde Redux
        const realUserName = displayName || userNameFromRedux || "Usuario";
        setUserName(realUserName);
        
        // 2. Obtener fecha de vencimiento de membresía desde Redux
        console.log("🔍 Debug - User data from Redux:", {
          membershipEnd: user?.membershipEnd,
          user: user
        });
        
        if (user?.membershipEnd) {
          console.log("✅ Setting membership end from Redux:", user.membershipEnd);
          setMembershipEnd(user.membershipEnd);
        } else {
          console.log("⚠️ No membership end found, using fallback date");
          // Fallback: usar fecha demo si no hay datos
          setMembershipEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        }

        // 3. Calcular estadísticas reales de entrenamiento
        await calculateTrainingStats();

        // 4. Seleccionar frase motivacional aleatoria
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setMotivationalText(randomQuote);

      } catch (error) {
        console.error("Error loading user info:", error);
        // Fallback con datos básicos
        setUserName(displayName || userNameFromRedux || "Usuario");
        setStats({
          todayWorkouts: 0,
          todayVolume: 0,
          totalWorkouts: 0,
          totalVolume: 0,
          streak: 0
        });
        setMotivationalText(motivationalQuotes[0]);
      } finally {
        setIsLoading(false);
      }
    };

    const calculateTrainingStats = async () => {
      try {
        // Usar el servicio de historial de entrenamiento
        const userStats = await trainingHistoryService.getUserStats(uid);
        
        // Obtener sesiones de entrenamiento
        const trainingSessions = await trainingHistoryService.getTrainingSessions(uid);
        
        // Calcular estadísticas de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let todayWorkouts = 0;
        let todayVolume = 0;
        
        // Filtrar sesiones de hoy
        const todaySessions = trainingSessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= today && sessionDate < tomorrow;
        });
        
        todayWorkouts = todaySessions.length;
        todayVolume = todaySessions.reduce((total, session) => total + session.volume, 0);

        setStats({
          todayWorkouts,
          todayVolume,
          totalWorkouts: userStats.totalSessions,
          totalVolume: userStats.totalVolume,
          streak: userStats.streak
        });

      } catch (error) {
        console.log("Error calculating stats:", error);
        // Fallback con datos básicos
        setStats({
          todayWorkouts: 0,
          todayVolume: 0,
          totalWorkouts: 0,
          totalVolume: 0,
          streak: 0
        });
      }
    };



    loadUserInfo();
  }, [uid, userNameFromRedux, user]);

  // Formatear la fecha de membresía (ISO → DD/MM/YYYY)
  const formatDate = (isoDate: string) => {
    if (!isoDate) return "";
    console.log("📅 Formatting date:", isoDate);
    const d = new Date(isoDate);
    const formatted = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth()+1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
    console.log("📅 Formatted date:", formatted);
    return formatted;
  };

  // Formatear volumen (ej: 5500 → "5.5K")
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return `${volume}`;
  };

  // Determinar el color del recordatorio según proximidad
  const getMembershipReminderColor = () => {
    if (!membershipEnd) return colors.success;
    
    const endDate = new Date(membershipEnd);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) return colors.danger;
    if (daysLeft <= 15) return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ArtisticBackground />
      
      {/* Margen superior negro con texto */}
      <View style={[styles.topMargin, { paddingTop: insets.top }]}>
        <Text style={styles.welcomeHeader}>Bienvenido</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
                 {/* Logo centrado en la mancha gris */}
         <View style={styles.logoSection}>
           <Image 
             source={require("../../assets/logo.png")} 
             style={{ width: 260, height: 260, alignSelf: 'center', marginBottom: 0, marginTop: -20 }} 
             resizeMode="contain" 
           />
         </View>

        {/* Estado de conexión (oculto visualmente pero funcional) */}
        <View style={styles.hiddenConnection}>
          <ConnectionStatus showDetails={false} />
        </View>

        {/* Contenido principal */}
        <View style={styles.contentContainer}>
                     {/* Bienvenida en cuadro */}
           <View style={styles.welcomeCard}>
             <Text style={styles.welcomeText}>¡Bienvenido a</Text>
             <Text style={styles.welcomeBold}>ICONIK PRO GYM</Text>
           </View>

                     {/* Recordatorio de membresía */}
           <TouchableOpacity 
             style={[styles.reminderBox, { 
               borderLeftColor: colors.success 
             }]}
             activeOpacity={0.8}
           >
             <Text style={styles.reminderText}>
               Recuerda pagar a tiempo tu membresía
             </Text>
           </TouchableOpacity>

          {/* Cards de estadísticas principales (2 cards como en el diseño) */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.mainStatCard}>
              <Text style={styles.largeNumber}>{stats.totalWorkouts}</Text>
              <Text style={styles.cardLabel}>Entrenamientos</Text>
            </View>
            <View style={styles.mainStatCard}>
              <Text style={styles.largeNumber}>{formatVolume(stats.totalVolume)}</Text>
              <Text style={styles.cardLabel}>Kg Volumen</Text>
            </View>
          </View>

          

          {/* Texto motivacional */}
          {motivationalText ? (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{motivationalText}</Text>
            </View>
          ) : null}

          {/* Botones de acción */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('EntrenarTab' as never, {
                  screen: 'ExercisesList'
                } as never);
              }}
            >
              <Ionicons name="barbell-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Ejercicios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('NutricionTab' as never);
              }}
            >
              <Ionicons name="nutrition-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Nutrición</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Margen inferior negro */}
      <View style={styles.bottomMargin} />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topMargin: {
    backgroundColor: '#000',
    paddingBottom: 12, // Reducido
    alignItems: 'center',
    marginBottom: 8, // Reducido
  },
  welcomeHeader: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomMargin: {
    height: 30,
    backgroundColor: '#000',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoSection: {
    marginTop: 0, // Eliminado margen extra
    marginBottom: 8, // Reducido
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 0,
  },
  hiddenConnection: {
    position: 'absolute',
    top: -100,
    opacity: 0,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0, // Eliminado margen extra
  },
  welcomeCard: {
    borderRadius: 10,
    padding: 12, // Reducido
    marginBottom: 10, // Reducido
    width: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    textAlign: "center",
    color: '#333',
    fontWeight: '500',
  },
  welcomeBold: {
    fontSize: 24,
    textAlign: "center",
    color: '#333',
    fontWeight: "bold",
  },

  reminderBox: {
    borderRadius: 10,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    borderLeftWidth: 4,
    width: "100%",
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderText: {
    fontSize: SIZES.fontRegular,
    textAlign: "center",
    color: '#666',
  },

  mainStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: SIZES.margin,
  },
  mainStatCard: {
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: '#ff4444',
  },
  cardLabel: {
    fontSize: SIZES.fontSmall,
    marginTop: 6,
    textAlign: "center",
    color: '#666',
  },

  quoteBox: {
    borderRadius: 12,
    padding: SIZES.padding,
    marginTop: SIZES.margin,
    width: "100%",
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteText: {
    fontSize: SIZES.fontSmall,
    fontStyle: "italic",
    textAlign: "center",
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: SIZES.margin,
  },
     actionButton: {
     flex: 1,
     backgroundColor: '#ff4444',
     borderRadius: 12,
     padding: 20,
     alignItems: "center",
     marginHorizontal: 8,
     flexDirection: "row",
     justifyContent: "center",
     gap: 8,
   },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 