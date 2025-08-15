import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NutritionData {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description?: string;
  imageUri?: string;
}

export interface DailyNutrition {
  date: string;
  meals: NutritionData[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

class NutritionDataService {
  private readonly STORAGE_KEY = 'nutrition_data';

  /**
   * Guarda datos nutricionales
   */
  async saveNutritionData(data: NutritionData): Promise<void> {
    try {
      const allData = await this.getAllNutritionData();
      allData.push(data);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
      console.log('✅ Datos nutricionales guardados');
    } catch (error) {
      console.error('❌ Error guardando datos nutricionales:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los datos nutricionales
   */
  async getAllNutritionData(): Promise<NutritionData[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error obteniendo datos nutricionales:', error);
      return [];
    }
  }

  /**
   * Obtiene datos nutricionales por fecha
   */
  async getNutritionDataByDate(date: string): Promise<DailyNutrition> {
    try {
      const allData = await this.getAllNutritionData();
      const dayData = allData.filter(item => item.date === date);
      
      const totalCalories = dayData.reduce((sum, meal) => sum + meal.calories, 0);
      const totalProtein = dayData.reduce((sum, meal) => sum + meal.protein, 0);
      const totalCarbs = dayData.reduce((sum, meal) => sum + meal.carbs, 0);
      const totalFats = dayData.reduce((sum, meal) => sum + meal.fats, 0);

      return {
        date,
        meals: dayData,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFats
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos por fecha:', error);
      return {
        date,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0
      };
    }
  }

  /**
   * Elimina datos nutricionales
   */
  async deleteNutritionData(id: string): Promise<void> {
    try {
      const allData = await this.getAllNutritionData();
      const filteredData = allData.filter(item => item.id !== id);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData));
      console.log('✅ Datos nutricionales eliminados');
    } catch (error) {
      console.error('❌ Error eliminando datos nutricionales:', error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos nutricionales
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Todos los datos nutricionales eliminados');
    } catch (error) {
      console.error('❌ Error limpiando datos nutricionales:', error);
      throw error;
    }
  }
}

export default new NutritionDataService();
