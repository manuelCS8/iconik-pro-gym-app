import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService, PendingUser } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PendingUsersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const users = await authService.getPendingUsers();
      setPendingUsers(users);
    } catch (error: any) {
      console.error('Error cargando usuarios pendientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPendingUsers();
    setIsRefreshing(false);
  };

  const handleDeleteUser = async (email: string, displayName: string) => {
    Alert.alert(
      'Eliminar Usuario Pendiente',
      `¿Estás seguro de que quieres eliminar a ${displayName}?\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deletePendingUser(email);
              Alert.alert('Éxito', 'Usuario pendiente eliminado correctamente');
              loadPendingUsers(); // Recargar lista
            } catch (error: any) {
              console.error('Error eliminando usuario pendiente:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario pendiente');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return '#4CAF50';
      case 'premium': return '#FF9800';
      case 'vip': return '#9C27B0';
      default: return '#666';
    }
  };

  const getMembershipTypeText = (type: string) => {
    switch (type) {
      case 'basic': return 'Básica';
      case 'premium': return 'Premium';
      case 'vip': return 'VIP';
      default: return type;
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? 'shield' : 'person';
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? '#ff4444' : '#2196F3';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Usuarios Pendientes</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4444" />
          <Text style={styles.loadingText}>Cargando usuarios pendientes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios Pendientes</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateUser' as never)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ff4444"
            colors={['#ff4444']}
          />
        }
      >
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No hay usuarios pendientes</Text>
            <Text style={styles.emptySubtitle}>
              Todos los usuarios han completado su registro o no se han creado usuarios pendientes.
            </Text>
            <TouchableOpacity 
              style={styles.createUserButton}
              onPress={() => navigation.navigate('CreateUser' as never)}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.createUserButtonText}>Crear Nuevo Usuario</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Resumen</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{pendingUsers.length}</Text>
                  <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {pendingUsers.filter(u => u.role === 'MEMBER').length}
                  </Text>
                  <Text style={styles.statLabel}>Miembros</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {pendingUsers.filter(u => u.role === 'ADMIN').length}
                  </Text>
                  <Text style={styles.statLabel}>Admins</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>👥 Usuarios Pendientes de Registro</Text>
            
            {pendingUsers.map((pendingUser, index) => (
              <View key={pendingUser.email} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(pendingUser.role) }]}>
                      <Ionicons name={getRoleIcon(pendingUser.role) as any} size={16} color="#fff" />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{pendingUser.displayName}</Text>
                      <Text style={styles.userEmail}>{pendingUser.email}</Text>
                      <Text style={styles.userAge}>{pendingUser.age} años</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(pendingUser.email, pendingUser.displayName)}
                  >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.membershipInfo}>
                  <View style={styles.membershipBadge}>
                    <View style={[
                      styles.membershipDot, 
                      { backgroundColor: getMembershipTypeColor(pendingUser.membershipType) }
                    ]} />
                    <Text style={styles.membershipText}>
                      {getMembershipTypeText(pendingUser.membershipType)}
                    </Text>
                  </View>
                  <Text style={styles.membershipDates}>
                    {formatDate(pendingUser.membershipStart)} - {formatDate(pendingUser.membershipEnd)}
                  </Text>
                </View>

                <View style={styles.registrationInfo}>
                  <Ionicons name="information-circle" size={16} color="#ff4444" />
                  <Text style={styles.registrationText}>
                    El usuario debe completar su registro con: nombre completo, email y edad exactos.
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  createUserButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createUserButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  userAge: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    padding: 8,
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membershipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  membershipDates: {
    fontSize: 12,
    color: '#ccc',
  },
  registrationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  registrationText: {
    flex: 1,
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
});

export default PendingUsersScreen;
