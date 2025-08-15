import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { COLORS, SIZES, GLOBAL_STYLES } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import RoleGuard from '../../components/RoleGuard';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/authService';

interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  totalRoutines: number;
  totalExercises: number;
  totalVolume: number;
  todayWorkouts: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'workout' | 'routine_created';
  description: string;
  timestamp: Date;
  userName: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalRoutines: 0,
    totalExercises: 0,
    totalVolume: 0,
    todayWorkouts: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Usar datos mock en caso de error
      setStats({
        totalMembers: 156,
        activeMembers: 142,
        totalRoutines: 24,
        totalExercises: 89,
        totalVolume: 2847500,
        todayWorkouts: 38,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Fecha de hoy para filtrar membresías activas
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // En modo mock, usar datos simulados
      console.log("Cargando estadísticas admin (modo mock)");
      
      setStats({
        totalMembers: Math.floor(Math.random() * 50) + 120,
        activeMembers: Math.floor(Math.random() * 40) + 100,
        totalRoutines: Math.floor(Math.random() * 10) + 15,
        totalExercises: Math.floor(Math.random() * 20) + 60,
        totalVolume: Math.floor(Math.random() * 500000) + 2500000,
        todayWorkouts: Math.floor(Math.random() * 20) + 25,
      });

    } catch (error) {
      console.log("Error loading stats (using fallback mock):", error);
      // Datos mock de fallback
      setStats({
        totalMembers: 156,
        activeMembers: 142,
        totalRoutines: 24,
        totalExercises: 89,
        totalVolume: 2847500,
        todayWorkouts: 38,
      });
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Simular actividad reciente (en producción vendría de múltiples colecciones)
      const mockActivity: RecentActivity[] = [
        {
          id: "1",
          type: "registration",
          description: "Nuevo miembro registrado",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
          userName: "María González"
        },
        {
          id: "2", 
          type: "workout",
          description: "Completó rutina de Pecho y Tríceps",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // hace 4 horas
          userName: "Carlos Ruiz"
        },
        {
          id: "3",
          type: "routine_created",
          description: "Nueva rutina oficial creada",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // hace 6 horas
          userName: "Admin"
        },
        {
          id: "4",
          type: "workout",
          description: "Completó rutina de Piernas",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // hace 8 horas
          userName: "Ana Silva"
        },
      ];
      
      setRecentActivity(mockActivity);
    } catch (error) {
      console.log("Error loading recent activity:", error);
      setRecentActivity([]);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // menos de 24 horas
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Hace ${days}d`;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration': return 'person-add';
      case 'workout': return 'fitness';
      case 'routine_created': return 'add-circle';
      default: return 'information-circle';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration': return COLORS.success;
      case 'workout': return COLORS.primary;
      case 'routine_created': return COLORS.secondary;
      default: return COLORS.gray;
    }
  };

  return (
    <View style={styles.container}> 
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Bienvenido{user?.name ? `, ${user.name}` : ''}
        </Text>
        <Text style={styles.subtitle}>Iconik Pro Gym</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statNumber}>{stats.activeMembers}</Text><Text style={styles.statLabel}>Miembros Activos</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{stats.totalMembers}</Text><Text style={styles.statLabel}>Total Miembros</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{stats.totalExercises}</Text><Text style={styles.statLabel}>Ejercicios</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{stats.totalRoutines}</Text><Text style={styles.statLabel}>Rutinas Oficiales</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{stats.todayWorkouts}</Text><Text style={styles.statLabel}>Entrenamientos Hoy</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{formatNumber(stats.totalVolume)} kg</Text><Text style={styles.statLabel}>Volumen Total</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acciones Rápidas</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GestionTab', { screen: 'ManageMembers' })}>
              <Ionicons name="person-add" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Agregar Nuevo Miembro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GestionTab', { screen: 'ManageRoutines' })}>
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Crear Nueva Rutina</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GestionTab', { screen: 'ManageExercises' })}>
              <Ionicons name="fitness" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Agregar Ejercicio</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]} 
              onPress={async () => {
                try {
                  await authService.updateExistingUsers();
                  alert('Usuarios actualizados correctamente');
                } catch (error) {
                  alert('Error actualizando usuarios: ' + error);
                }
              }}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Actualizar Usuarios Existentes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} 
              onPress={async () => {
                try {
                  const currentUser = useSelector((state: RootState) => state.auth.user);
                  if (currentUser?.uid) {
                    await authService.renewMembership(currentUser.uid, 12); // 12 meses
                    alert('Membresía renovada por 12 meses');
                  } else {
                    alert('No se pudo identificar el usuario actual');
                  }
                } catch (error) {
                  alert('Error renovando membresía: ' + error);
                }
              }}
            >
              <Ionicons name="calendar" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Renovar Mi Membresía (12 meses)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: SIZES.paddingLarge,
    backgroundColor: '#181818', // gris oscuro
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc', // gris claro
    textAlign: 'center',
    marginBottom: 8,
  },
  content: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  statCard: { backgroundColor: '#222', borderRadius: 12, padding: 18, alignItems: 'center', margin: 6, flex: 1, minWidth: 140 },
  statNumber: { color: '#ff4444', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#eee', fontSize: 15, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#181818', borderRadius: 16, padding: 18, marginTop: 24, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  actionButton: { backgroundColor: '#ff4444', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.margin,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: SIZES.fontRegular,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activityUser: {
    fontSize: SIZES.fontSmall,
    color: '#888',
  },
});

export default AdminDashboard; 