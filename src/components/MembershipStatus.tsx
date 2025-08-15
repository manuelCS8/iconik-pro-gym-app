import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface MembershipStatusProps {
  showWarning?: boolean;
}

export const MembershipStatus: React.FC<MembershipStatusProps> = ({ showWarning = true }) => {
  const { membershipStatus, userProfile } = useAuth();

  if (!membershipStatus || !userProfile) {
    return null;
  }

  const { isActive, daysUntilExpiry } = membershipStatus;

  // Mostrar advertencia si la membresía está por vencer (7 días o menos)
  React.useEffect(() => {
    if (showWarning && !isActive) {
      Alert.alert(
        'Membresía Vencida',
        'Tu membresía ha vencido. Contacta al administrador para renovarla.',
        [{ text: 'OK' }]
      );
    } else if (showWarning && daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      Alert.alert(
        'Membresía por Vencer',
        `Tu membresía vence en ${daysUntilExpiry} días. Considera renovarla pronto.`,
        [{ text: 'OK' }]
      );
    }
  }, [isActive, daysUntilExpiry, showWarning]);

  if (!isActive) {
    return (
      <View style={[styles.container, styles.expired]}>
        <Text style={styles.expiredText}>Membresía Vencida</Text>
        <Text style={styles.expiredSubtext}>Contacta al administrador</Text>
      </View>
    );
  }

  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    return (
      <View style={[styles.container, styles.warning]}>
        <Text style={styles.warningText}>Membresía por Vencer</Text>
        <Text style={styles.warningSubtext}>{daysUntilExpiry} días restantes</Text>
      </View>
    );
  }

  if (daysUntilExpiry === -1) {
    return (
      <View style={[styles.container, styles.active]}>
        <Text style={styles.activeText}>Membresía Activa</Text>
        <Text style={styles.activeSubtext}>Sin fecha de vencimiento</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.active]}>
      <Text style={styles.activeText}>Membresía Activa</Text>
      <Text style={styles.activeSubtext}>{daysUntilExpiry} días restantes</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  active: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  expired: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  activeText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeSubtext: {
    color: '#155724',
    fontSize: 14,
    marginTop: 2,
  },
  warningText: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warningSubtext: {
    color: '#856404',
    fontSize: 14,
    marginTop: 2,
  },
  expiredText: {
    color: '#721c24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expiredSubtext: {
    color: '#721c24',
    fontSize: 14,
    marginTop: 2,
  },
}); 