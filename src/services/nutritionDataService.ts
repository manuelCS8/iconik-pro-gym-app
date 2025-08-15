import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NutritionData {
  userId: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: string;
  objective: string;
  intensity: string;
  targetWeight?: number;
  targetDate?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

class NutritionDataService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitializing = false;

  async initialize(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (this.db) {
        await this.db.closeAsync();
      }

      this.db = await SQLite.openDatabaseAsync('nutrition_data.db');
      
      await this.createTables();
      console.log('✅ NutritionDataService inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando NutritionDataService:', error);
      this.db = null;
    } finally {
      this.isInitializing = false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS nutrition_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT UNIQUE,
        weight REAL,
        height REAL,
        age INTEGER,
        gender TEXT,
        activityLevel TEXT,
        objective TEXT,
        intensity TEXT,
        targetWeight REAL,
        targetDate TEXT,
        calories INTEGER,
        protein INTEGER,
        carbs INTEGER,
        fats INTEGER,
        tier TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);
  }

  async saveNutritionData(data: Omit<NutritionData, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const now = new Date().toISOString();
      
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO nutrition_data 
         (userId, weight, height, age, gender, activityLevel, objective, intensity, 
          targetWeight, targetDate, calories, protein, carbs, fats, tier, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.weight,
          data.height,
          data.age,
          data.gender,
          data.activityLevel,
          data.objective,
          data.intensity,
          data.targetWeight,
          data.targetDate,
          data.calories,
          data.protein,
          data.carbs,
          data.fats,
          data.tier,
          now,
          now
        ]
      );

      // También guardar en AsyncStorage como backup
      await AsyncStorage.setItem(`nutrition_data_${data.userId}`, JSON.stringify({
        ...data,
        createdAt: now,
        updatedAt: now
      }));

      console.log('✅ Datos nutricionales guardados correctamente');
    } catch (error) {
      console.error('❌ Error guardando datos nutricionales:', error);
      throw error;
    }
  }

  async getNutritionData(userId: string): Promise<NutritionData | null> {
    if (!this.db) await this.initialize();

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT * FROM nutrition_data WHERE userId = ?',
        [userId]
      );

      if (result) {
        return result as NutritionData;
      }

      // Intentar recuperar desde AsyncStorage si no está en SQLite
      const backupData = await AsyncStorage.getItem(`nutrition_data_${userId}`);
      if (backupData) {
        const parsedData = JSON.parse(backupData) as NutritionData;
        // Restaurar a SQLite
        await this.saveNutritionData(parsedData);
        return parsedData;
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo datos nutricionales:', error);
      return null;
    }
  }

  async updateNutritionData(userId: string, updates: Partial<NutritionData>): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const existingData = await this.getNutritionData(userId);
      if (!existingData) {
        throw new Error('No se encontraron datos nutricionales para actualizar');
      }

      const updatedData = {
        ...existingData,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.saveNutritionData(updatedData);
      console.log('✅ Datos nutricionales actualizados correctamente');
    } catch (error) {
      console.error('❌ Error actualizando datos nutricionales:', error);
      throw error;
    }
  }

  async deleteNutritionData(userId: string): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.runAsync(
        'DELETE FROM nutrition_data WHERE userId = ?',
        [userId]
      );

      // También eliminar de AsyncStorage
      await AsyncStorage.removeItem(`nutrition_data_${userId}`);

      console.log('✅ Datos nutricionales eliminados correctamente');
    } catch (error) {
      console.error('❌ Error eliminando datos nutricionales:', error);
      throw error;
    }
  }

  async hasNutritionData(userId: string): Promise<boolean> {
    const data = await this.getNutritionData(userId);
    return data !== null;
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  async reinitialize(): Promise<void> {
    this.db = null;
    this.isInitializing = false;
    await this.initialize();
  }
}

export default new NutritionDataService(); 