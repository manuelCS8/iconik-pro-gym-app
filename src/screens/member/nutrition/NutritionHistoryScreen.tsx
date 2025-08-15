import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { COLORS } from '../../../utils/theme';

const NutritionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const appColors = COLORS;
  const { mealLogs } = useSelector((state: RootState) => state.nutrition);
  const [groupedMeals, setGroupedMeals] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    groupMealsByDate();
  }, [mealLogs]);

  const groupMealsByDate = () => {
    const grouped: {[key: string]: any[]} = {};
    
    mealLogs.forEach(meal => {
      const date = meal.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(meal);
    });

    // Ordenar por fecha (más reciente primero)
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const sortedGrouped: {[key: string]: any[]} = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    setGroupedMeals(sortedGrouped);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'moon';
      case 'snack':
        return 'cafe';
      default:
        return 'restaurant';
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'Desayuno';
      case 'lunch':
        return 'Almuerzo';
      case 'dinner':
        return 'Cena';
      case 'snack':
        return 'Snack';
      default:
        return mealType;
    }
  };

  const renderMealItem = ({ item }: { item: any }) => (
    <View style={[styles.mealCard, { backgroundColor: appColors.white }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTypeContainer}>
          <Ionicons 
            name={getMealTypeIcon(item.mealType) as any} 
            size={20} 
            color={appColors.primary} 
          />
          <Text style={[styles.mealType, { color: appColors.secondary }]}>
            {getMealTypeLabel(item.mealType)}
          </Text>
        </View>
        <Text style={[styles.mealCalories, { color: appColors.primary }]}>
          {item.calories} kcal
        </Text>
      </View>

      {item.description && (
        <Text style={[styles.mealName, { color: appColors.secondary }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: appColors.primary }]}>
            {item.protein}g
          </Text>
          <Text style={[styles.macroLabel, { color: appColors.gray }]}>
            Proteína
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: appColors.primary }]}>
            {item.carbs}g
          </Text>
          <Text style={[styles.macroLabel, { color: appColors.gray }]}>
            Carbohidratos
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: appColors.primary }]}>
            {item.fats}g
          </Text>
          <Text style={[styles.macroLabel, { color: appColors.gray }]}>
            Grasas
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDateSection = ({ item }: { item: string }) => (
    <View style={styles.dateSection}>
      <Text style={[styles.dateTitle, { color: appColors.secondary }]}>
        {formatDate(item)}
      </Text>
      {groupedMeals[item].map((meal, index) => (
        <View key={meal.id || index}>
          {renderMealItem({ item: meal })}
        </View>
      ))}
    </View>
  );

  const allDates = Object.keys(groupedMeals);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appColors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: appColors.secondary }]}>Historial de Comidas</Text>
        <View style={styles.placeholder} />
      </View>

      {allDates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color={appColors.gray} />
          <Text style={[styles.emptyTitle, { color: appColors.secondary }]}>
            No hay comidas registradas
          </Text>
          <Text style={[styles.emptyText, { color: appColors.gray }]}>
            Las comidas que escanees aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={allDates}
          renderItem={renderDateSection}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Espacio para la barra de navegación */}
      <View style={{ height: 100 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealName: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default NutritionHistoryScreen; 