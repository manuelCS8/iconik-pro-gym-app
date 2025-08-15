import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";

const AdminManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalMembers: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const users = await authService.getAllUsers();
      const admins = users.filter(u => u.role === 'ADMIN');
      const members = users.filter(u => u.role === 'MEMBER');
      
      setStats({
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalMembers: members.length,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const managementOptions = [
    {
      title: "Crear Usuario",
      subtitle: "Crear nuevos miembros y administradores",
      icon: "person-add",
      screen: "CreateUser",
      color: "#4CAF50",
    },
    {
      title: "Usuarios Pendientes",
      subtitle: "Ver y gestionar usuarios pendientes de registro",
      icon: "time",
      screen: "PendingUsers",
      color: "#FF9800",
    },
    {
      title: "Gestionar Miembros",
      subtitle: "Ver y administrar usuarios",
      icon: "people",
      screen: "ManageMembers",
      color: "#2196F3",
    },
    {
      title: "Gestionar Ejercicios",
      subtitle: "Añadir y editar ejercicios",
      icon: "fitness",
      screen: "ManageExercises",
      color: "#FF9800",
    },
    {
      title: "Gestionar Rutinas",
      subtitle: "Crear y modificar rutinas",
      icon: "list",
      screen: "ManageRoutines",
      color: "#9C27B0",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Panel de Administración</Text>
          <Text style={styles.subtitle}>Gestiona tu gimnasio</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Usuarios</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAdmins}</Text>
              <Text style={styles.statLabel}>Administradores</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalMembers}</Text>
              <Text style={styles.statLabel}>Miembros</Text>
            </View>
          </View>
        </View>

        {/* Management Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>⚙️ Gestión</Text>
          {managementOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.title}
              style={[styles.optionCard, { borderLeftColor: option.color }]}
              onPress={() => navigation.navigate(option.screen)}
            >
              <View style={[styles.iconCircle, { backgroundColor: option.color }]}> 
                <Ionicons name={option.icon as any} size={24} color="#fff" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>🚀 Acciones Rápidas</Text>
          
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("CreateUser")}
          >
            <Ionicons name="person-add" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Crear Nuevo Usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("ManageMembers")}
          >
            <Ionicons name="people" size={24} color="#2196F3" />
            <Text style={styles.quickActionText}>Gestionar Miembros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("ManageExercises")}
          >
            <Ionicons name="fitness" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>Gestionar Ejercicios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("ManageRoutines")}
          >
            <Ionicons name="list" size={24} color="#9C27B0" />
            <Text style={styles.quickActionText}>Gestionar Rutinas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    backgroundColor: '#181818',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    opacity: 0.9,
  },
  statsContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  optionsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  optionCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  quickActionsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  quickActionCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
});

export default AdminManagementScreen; 