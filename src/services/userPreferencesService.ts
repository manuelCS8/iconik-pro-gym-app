import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightUnit } from '../redux/slices/userPreferencesSlice';

interface UserPreferences {
  weightUnit: WeightUnit;
}

class UserPreferencesService {
  private readonly PREFERENCES_KEY = 'user_preferences';

  /**
   * Guardar preferencias del usuario
   */
  async savePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      const key = `${this.PREFERENCES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Cargar preferencias del usuario
   */
  async loadPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const key = `${this.PREFERENCES_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const preferences = JSON.parse(data);
        return {
          weightUnit: preferences.weightUnit || 'KG', // Por defecto KG
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }

  /**
   * Actualizar unidad de peso
   */
  async updateWeightUnit(userId: string, weightUnit: WeightUnit): Promise<void> {
    try {
      const currentPreferences = await this.loadPreferences(userId) || { weightUnit: 'KG' };
      const updatedPreferences = { ...currentPreferences, weightUnit };
      await this.savePreferences(userId, updatedPreferences);
    } catch (error) {
      console.error('Error updating weight unit:', error);
      throw error;
    }
  }

  /**
   * Obtener unidad de peso actual
   */
  async getWeightUnit(userId: string): Promise<WeightUnit> {
    try {
      const preferences = await this.loadPreferences(userId);
      return preferences?.weightUnit || 'KG';
    } catch (error) {
      console.error('Error getting weight unit:', error);
      return 'KG'; // Por defecto KG
    }
  }

  /**
   * Eliminar preferencias del usuario
   */
  async clearPreferences(userId: string): Promise<void> {
    try {
      const key = `${this.PREFERENCES_KEY}_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing user preferences:', error);
      throw error;
    }
  }

  /**
   * Convertir peso entre unidades
   */
  convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
    if (fromUnit === toUnit) {
      return weight;
    }

    if (fromUnit === 'KG' && toUnit === 'LBS') {
      return Math.round(weight * 2.20462 * 10) / 10; // Redondear a 1 decimal
    }

    if (fromUnit === 'LBS' && toUnit === 'KG') {
      return Math.round(weight * 0.453592 * 10) / 10; // Redondear a 1 decimal
    }

    return weight;
  }

  /**
   * Obtener el símbolo de la unidad
   */
  getUnitSymbol(unit: WeightUnit): string {
    return unit === 'KG' ? 'kg' : 'lbs';
  }

  /**
   * Obtener el texto completo de la unidad
   */
  getUnitText(unit: WeightUnit): string {
    return unit === 'KG' ? 'Kilogramos' : 'Libras';
  }
}

export default new UserPreferencesService(); 