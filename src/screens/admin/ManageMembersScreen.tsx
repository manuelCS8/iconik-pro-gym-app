import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, GLOBAL_STYLES } from '../../utils/theme';
import RoleGuard from '../../components/RoleGuard';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  membershipStart?: string;
  membershipEnd?: string;
  weight?: number;
  height?: number;
  age?: number;
  phone?: string;
}

interface NewMemberForm {
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  membershipStart: string;
  membershipEnd: string;
  weight: string;
  height: string;
  age: string;
  phone: string;
}

const ManageMembersScreen: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | 'ADMIN' | 'MEMBER'>('All');
  const [filterMembership, setFilterMembership] = useState<'All' | 'Active' | 'Expired'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState<NewMemberForm>({
    name: '',
    email: '',
    role: 'MEMBER',
    membershipStart: new Date().toISOString().split('T')[0],
    membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weight: '',
    height: '',
    age: '',
    phone: '',
  });

  // Lógica para abrir el modal de edición
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [renewMonths, setRenewMonths] = useState('1');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [members, searchText, filterRole, filterMembership]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      // Consulta real a Firestore
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const membersFromFirestore: Member[] = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.displayName || data.name || '',
            email: data.email || '',
            role: data.role || 'MEMBER',
            membershipStart: data.membershipStart || '',
            membershipEnd: data.membershipEnd ? 
              (typeof data.membershipEnd === 'string' ? 
                data.membershipEnd.split('T')[0] : 
                (data.membershipEnd && typeof data.membershipEnd.toDate === 'function' ? 
                  data.membershipEnd.toDate().toISOString().split('T')[0] : 
                  new Date(data.membershipEnd).toISOString().split('T')[0]
                )
              ) : '',
            weight: data.weight,
            height: data.height,
            age: data.age,
            phone: data.phone || '',
          };
        })
        .filter(member => {
          // Filtrar usuarios eliminados (isActive: false o deletedAt presente)
          const userDoc = snapshot.docs.find(doc => doc.id === member.id);
          const userData = userDoc?.data();
          return userData?.isActive !== false && !userData?.deletedAt;
        });
      setMembers(membersFromFirestore);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los miembros.');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...members];

    // Filtro por texto de búsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search)
      );
    }

    // Filtro por rol
    if (filterRole !== 'All') {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    // Filtro por estado de membresía
    if (filterMembership !== 'All') {
      const today = new Date();
      filtered = filtered.filter(member => {
        if (!member.membershipEnd) return filterMembership === 'Expired';
        const endDate = new Date(member.membershipEnd);
        const isActive = endDate > today;
        return filterMembership === 'Active' ? isActive : !isActive;
      });
    }

    setFilteredMembers(filtered);
  };

  const getMembershipStatus = (membershipEnd?: string) => {
    if (!membershipEnd) return { text: "Sin membresía", color: COLORS.error };
    
    const today = new Date();
    const endDate = new Date(membershipEnd);
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { text: "Expirada", color: COLORS.error };
    if (daysLeft <= 7) return { text: `${daysLeft} días`, color: COLORS.warning };
    if (daysLeft <= 30) return { text: `${daysLeft} días`, color: COLORS.info };
    return { text: "Activa", color: COLORS.success };
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleAddMember = async () => {
    try {
      if (!newMember.name.trim() || !newMember.email.trim()) {
        Alert.alert("Error", "Nombre y email son obligatorios");
        return;
      }

      setIsLoading(true);
      
      // Simular creación de usuario (en producción usaría Firebase Auth)
      const newMemberData: Member = {
        id: `member-${Date.now()}`,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        role: newMember.role,
        membershipStart: newMember.membershipStart,
        membershipEnd: newMember.membershipEnd,
        weight: parseFloat(newMember.weight) || undefined,
        height: parseFloat(newMember.height) || undefined,
        age: parseInt(newMember.age) || undefined,
        phone: newMember.phone.trim() || undefined,
      };

      // Agregar a la lista local
      setMembers(prev => [...prev, newMemberData]);
      
      // Resetear formulario y cerrar modal
      setNewMember({
        name: '',
        email: '',
        role: 'MEMBER',
        membershipStart: new Date().toISOString().split('T')[0],
        membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weight: '',
        height: '',
        age: '',
        phone: '',
      });
      setShowAddModal(false);

      Alert.alert("Éxito", `Miembro ${newMemberData.name} agregado correctamente`);
      console.log("✅ Nuevo miembro agregado:", newMemberData.name);

    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "No se pudo agregar el miembro");
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal de edición de perfil
  const handleEditProfile = (member: Member) => {
    setEditMember(member);
    setRenewMonths('1');
  };

  // Renovar membresía por meses
  const handleRenewMembership = async () => {
    if (!editMember) return;
    
    const months = parseInt(renewMonths);
    if (isNaN(months) || months < 1 || months > 60) {
      Alert.alert('Error', 'Por favor ingresa un número válido de meses (1-60)');
      return;
    }

    try {
      // Calcular nueva fecha de expiración
      const currentEndDate = editMember.membershipEnd ? new Date(editMember.membershipEnd) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      const userRef = doc(db, 'users', editMember.id);
      await updateDoc(userRef, {
        membershipEnd: newEndDate.toISOString().split('T')[0],
        isActive: true,
      });

      Alert.alert('Éxito', `Membresía renovada por ${months} mes${months > 1 ? 'es' : ''}`);
      setEditMember(null);
      loadMembers();
    } catch (error) {
      console.error('Error renovando membresía:', error);
      Alert.alert('Error', 'No se pudo renovar la membresía. Por favor intenta de nuevo.');
    }
  };

  // Eliminar miembro
  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const userRef = doc(db, 'users', memberToDelete.id);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: new Date().toISOString(),
      });

      Alert.alert('Éxito', `${memberToDelete.name} ha sido eliminado`);
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      loadMembers();
    } catch (error) {
      console.error('Error eliminando miembro:', error);
      Alert.alert('Error', 'No se pudo eliminar el miembro. Por favor intenta de nuevo.');
    }
  };

  // Función anterior de eliminación (ya no se usa)
  const handleDeleteMemberOld = (member: Member) => {
    Alert.alert(
      "Eliminar Miembro",
      `¿Estás seguro de que quieres eliminar a ${member.name}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setMembers(prev => prev.filter(m => m.id !== member.id));
            Alert.alert("Éxito", `${member.name} ha sido eliminado`);
            console.log("❌ Miembro eliminado:", member.name);
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMembers();
    setIsRefreshing(false);
  };

  const renderMember = ({ item }: { item: Member }) => {
    const isAdmin = item.role === 'ADMIN';
    const daysLeft = item.membershipEnd ? Math.ceil((new Date(item.membershipEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    return (
      <View style={styles.memberCard}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
          <View style={[styles.roleTag, { backgroundColor: isAdmin ? '#222' : '#E31C1F' }]}> 
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
          {!isAdmin && daysLeft !== null && (
            <View style={styles.daysTag}>
              <Text style={styles.daysText}>{daysLeft} días</Text>
            </View>
          )}
        </View>
        {!isAdmin && item.membershipEnd && (
          <Text style={styles.memberExpire}>Expira: {item.membershipEnd}</Text>
        )}
        {item.age && <Text style={styles.memberAge}>Edad: {item.age} años</Text>}
        {/* Botones de acción solo para miembros */}
        {!isAdmin && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditProfile(item)}>
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMember(item)}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <RoleGuard 
      requiredRole="ADMIN" 
      fallbackMessage="Solo los administradores pueden gestionar miembros del gimnasio."
    >
      <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181818', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>Gestión de Miembros</Text>
        <TouchableOpacity style={{ backgroundColor: '#ff4444', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowAddModal(true)}>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 6 }}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
        
        {/* Filtros y búsqueda */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o email..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterTags}
          >
            <TouchableOpacity 
              style={[styles.filterTag, filterRole === 'All' && styles.activeFilterTag]}
              onPress={() => setFilterRole('All')}
            >
              <Text style={[styles.filterTagText, filterRole === 'All' && styles.activeFilterTagText]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterTag, filterRole === 'ADMIN' && styles.activeFilterTag]}
              onPress={() => setFilterRole('ADMIN')}
            >
              <Text style={[styles.filterTagText, filterRole === 'ADMIN' && styles.activeFilterTagText]}>
                Admins
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterTag, filterRole === 'MEMBER' && styles.activeFilterTag]}
              onPress={() => setFilterRole('MEMBER')}
            >
              <Text style={[styles.filterTagText, filterRole === 'MEMBER' && styles.activeFilterTagText]}>
                Miembros
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterTag, filterMembership === 'Active' && styles.activeFilterTag]}
              onPress={() => setFilterMembership('Active')}
            >
              <Text style={[styles.filterTagText, filterMembership === 'Active' && styles.activeFilterTagText]}>
                Activos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterTag, filterMembership === 'Expired' && styles.activeFilterTag]}
              onPress={() => setFilterMembership('Expired')}
            >
              <Text style={[styles.filterTagText, filterMembership === 'Expired' && styles.activeFilterTagText]}>
                Expirados
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Contenido de filtros */}
      </View>

      {/* Lista de miembros */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No se encontraron miembros</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? "Prueba con otros términos de búsqueda" : "Los miembros aparecerán aquí"}
            </Text>
          </View>
        }
      />

      {/* Modal para agregar miembro */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Agregar Nuevo Miembro</Text>
            <TouchableOpacity 
              onPress={handleAddMember}
              disabled={isLoading}
              style={[styles.saveButton, isLoading && styles.disabledButton]}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.formInput}
                value={newMember.name}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, name: text }))}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={COLORS.gray}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={newMember.email}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, email: text }))}
                placeholder="juan@email.com"
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rol</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[styles.roleOption, newMember.role === 'MEMBER' && styles.activeRoleOption]}
                  onPress={() => setNewMember(prev => ({ ...prev, role: 'MEMBER' }))}
                >
                  <Text style={[styles.roleOptionText, newMember.role === 'MEMBER' && styles.activeRoleOptionText]}>
                    Miembro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleOption, newMember.role === 'ADMIN' && styles.activeRoleOption]}
                  onPress={() => setNewMember(prev => ({ ...prev, role: 'ADMIN' }))}
                >
                  <Text style={[styles.roleOptionText, newMember.role === 'ADMIN' && styles.activeRoleOptionText]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Inicio Membresía</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.membershipStart}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, membershipStart: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Fin Membresía</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.membershipEnd}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, membershipEnd: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.weight}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, weight: text }))}
                  placeholder="75"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Altura (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.height}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, height: text }))}
                  placeholder="175"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Edad</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.age}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, age: text }))}
                  placeholder="28"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Teléfono</Text>
                <TextInput
                  style={styles.formInput}
                  value={newMember.phone}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, phone: text }))}
                  placeholder="+1234567890"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de edición de perfil */}
      <Modal visible={!!editMember} transparent animationType="slide" onRequestClose={() => setEditMember(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#181818', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Editar Perfil</Text>
            <Text style={{ color: '#ccc', marginBottom: 8 }}>Miembro: {editMember?.name}</Text>
            <Text style={{ color: '#ccc', marginBottom: 8 }}>Email: {editMember?.email}</Text>
            <Text style={{ color: '#ccc', marginBottom: 8 }}>Fecha actual de expiración: {editMember?.membershipEnd || 'N/A'}</Text>
            
            <Text style={{ color: '#fff', marginBottom: 8, marginTop: 16 }}>Renovar membresía por:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#333', 
                  borderRadius: 8, 
                  padding: 12, 
                  fontSize: 16, 
                  backgroundColor: '#222', 
                  color: '#fff', 
                  flex: 1,
                  marginRight: 8
                }}
                value={renewMonths}
                onChangeText={setRenewMonths}
                placeholder="1"
                placeholderTextColor="#888"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={{ color: '#ccc', fontSize: 16 }}>meses</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#666', 
                  borderRadius: 8, 
                  paddingHorizontal: 20, 
                  paddingVertical: 10 
                }} 
                onPress={() => setEditMember(null)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#ff4444', 
                  borderRadius: 8, 
                  paddingHorizontal: 20, 
                  paddingVertical: 10 
                }} 
                onPress={handleRenewMembership}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Renovar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#181818', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Confirmar Eliminación</Text>
            <Text style={{ color: '#ccc', marginBottom: 8 }}>
              ¿Estás seguro de que quieres eliminar a <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>{memberToDelete?.name}</Text>?
            </Text>
            <Text style={{ color: '#ff4444', marginBottom: 16, fontSize: 14 }}>
              ⚠️ Esta acción no se puede revertir
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#666', 
                  borderRadius: 8, 
                  paddingHorizontal: 20, 
                  paddingVertical: 10 
                }} 
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setMemberToDelete(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#ff4444', 
                  borderRadius: 8, 
                  paddingHorizontal: 20, 
                  paddingVertical: 10 
                }} 
                onPress={confirmDeleteMember}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
    backgroundColor: '#181818',
    padding: SIZES.padding,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  filtersContainer: {
    marginBottom: SIZES.margin,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.margin,
    backgroundColor: '#222',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding / 2,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#181818',
    color: '#fff',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginRight: SIZES.padding / 2,
    fontSize: SIZES.fontRegular,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius,
  },
  filtersTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.padding / 2,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: '#222',
    borderRadius: SIZES.radius,
    marginRight: SIZES.padding / 2,
    marginBottom: SIZES.padding / 2,
  },
  activeFilterTag: {
    backgroundColor: '#ff4444',
  },
  filterTagText: {
    fontSize: SIZES.fontSmall,
    color: '#ccc',
    fontWeight: '600',
  },
  activeFilterTagText: {
    color: '#fff',
  },
  resultsText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: SIZES.margin / 2,
  },
  list: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    padding: SIZES.padding,
  },
  memberCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberEmail: {
    fontSize: SIZES.fontSmall,
    color: '#ccc',
    marginBottom: 4,
  },
  memberDetails: {
    flexDirection: 'row',
    marginBottom: SIZES.margin / 2,
  },
  roleTag: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  roleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.fontSmall,
  },
  statusTag: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  membershipDate: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  memberActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.margin / 2,
    paddingTop: SIZES.margin / 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  statText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyText: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: SIZES.margin,
  },
  emptySubtext: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    marginTop: 4,
  },
  modalContainer: {
    ...GLOBAL_STYLES.container,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  formGroup: {
    marginBottom: SIZES.margin,
  },
  formLabel: {
    fontSize: SIZES.fontRegular,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.margin / 2,
  },
  formInput: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    fontSize: SIZES.fontRegular,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  formRow: {
    flexDirection: 'row',
  },
  roleSelector: {
    flexDirection: 'row',
  },
  roleOption: {
    flex: 1,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    marginRight: SIZES.margin / 2,
    borderRadius: SIZES.radius,
  },
  activeRoleOption: {
    backgroundColor: COLORS.primary,
  },
  roleOptionText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  activeRoleOptionText: {
    color: COLORS.white,
  },
  daysTag: {
    backgroundColor: '#444',
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SIZES.margin / 2,
  },
  daysText: {
    fontSize: SIZES.fontSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberExpire: {
    fontSize: SIZES.fontSmall,
    color: '#ccc',
    marginTop: SIZES.margin / 2,
  },
  memberAge: {
    fontSize: SIZES.fontSmall,
    color: '#ccc',
    marginTop: SIZES.margin / 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.margin / 2,
  },
  editButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.margin / 2,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.fontSmall,
  },
  deleteButton: {
    backgroundColor: '#333',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    flex: 1,
    marginLeft: SIZES.margin / 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.fontSmall,
  },
});

export default ManageMembersScreen; 