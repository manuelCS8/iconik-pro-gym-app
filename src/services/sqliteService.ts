import * as SQLite from 'expo-sqlite';

export interface LocalTrainingRecord {
  id?: number;
  userId: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  series: number;
  reps: number;
  weight: number;
  timestamp: string;
  synced: number; // 0 = not synced, 1 = synced
}

export interface NutritionConfig {
  userId: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
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
  synced: number;
}

export interface MealLog {
  id?: number;
  userId: string;
  date: string;
  mealType: string;
  imageUrl?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  aiAnalysis?: string;
  imageHash?: string;
  timestamp: string;
  synced: number;
}

export interface DailyUsage {
  userId: string;
  date: string;
  usageCount: number;
}

class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      console.log('🔄 Opening SQLite database...');
      // Abrir base de datos
      this.db = await SQLite.openDatabaseAsync('iconik.db');
      console.log('✅ Database opened successfully');
      
      console.log('📝 Creating tables...');
      // Crear tabla para records locales
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS records_local (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          routineId TEXT NOT NULL,
          exerciseId TEXT NOT NULL,
          exerciseName TEXT NOT NULL,
          series INTEGER NOT NULL,
          reps INTEGER NOT NULL,
          weight REAL NOT NULL,
          timestamp TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('✅ records_local table created');

      // Crear tabla para configuración nutricional
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS nutrition_config (
          userId TEXT PRIMARY KEY,
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
          protein REAL,
          carbs REAL,
          fats REAL,
          tier TEXT DEFAULT 'basic',
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('✅ nutrition_config table created');

      // Crear tabla para logs de comidas
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS meal_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          date TEXT NOT NULL,
          mealType TEXT NOT NULL,
          imageUrl TEXT,
          description TEXT,
          calories INTEGER,
          protein REAL,
          carbs REAL,
          fats REAL,
          aiAnalysis TEXT,
          imageHash TEXT,
          timestamp TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('✅ meal_logs table created');

      // Crear tabla para control de uso diario
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_usage (
          userId TEXT,
          date TEXT,
          usage_count INTEGER DEFAULT 0,
          PRIMARY KEY (userId, date)
        );
      `);
      console.log('✅ daily_usage table created');

      console.log('✅ SQLite database initialized');
      
      // Verificar que las tablas existen
      const tables = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
      console.log('📋 Available tables:', tables.map((t: any) => t.name));
      
    } catch (error) {
      console.error('❌ Error initializing SQLite:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      this.db = null;
      throw error;
    }
  }

  async insertLocalRecord(record: Omit<LocalTrainingRecord, 'id'>): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync(
        `INSERT INTO records_local (userId, routineId, exerciseId, exerciseName, series, reps, weight, timestamp, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [
          record.userId,
          record.routineId,
          record.exerciseId,
          record.exerciseName,
          record.series,
          record.reps,
          record.weight,
          record.timestamp
        ]
      );

      console.log('✅ Local record saved to SQLite');
    } catch (error) {
      console.error('❌ Error inserting local record:', error);
      throw error;
    }
  }

  async getUnsyncedRecords(): Promise<LocalTrainingRecord[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM records_local WHERE synced = 0 ORDER BY timestamp ASC;'
      );

      return result as LocalTrainingRecord[];
    } catch (error) {
      console.error('❌ Error getting unsynced records:', error);
      return [];
    }
  }

  async markRecordAsSynced(id: number): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync(
        'UPDATE records_local SET synced = 1 WHERE id = ?;',
        [id]
      );

      console.log(`✅ Record ${id} marked as synced`);
    } catch (error) {
      console.error('❌ Error marking record as synced:', error);
    }
  }

  async getLocalRecordsCount(): Promise<number> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT COUNT(*) as count FROM records_local WHERE synced = 0;'
      ) as { count: number };

      return result?.count || 0;
    } catch (error) {
      console.error('❌ Error getting local records count:', error);
      return 0;
    }
  }

  async getAllLocalRecords(userId: string): Promise<LocalTrainingRecord[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM records_local WHERE userId = ? ORDER BY timestamp DESC;',
        [userId]
      );

      return result as LocalTrainingRecord[];
    } catch (error) {
      console.error('❌ Error getting all local records:', error);
      return [];
    }
  }

  async clearSyncedRecords(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync('DELETE FROM records_local WHERE synced = 1;');
      console.log('✅ Cleared synced records from SQLite');
    } catch (error) {
      console.error('❌ Error clearing synced records:', error);
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ SQLite database closed');
    }
  }

  // ===== MÉTODOS PARA NUTRICIÓN =====

  async saveNutritionConfig(config: Omit<NutritionConfig, 'synced'>): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO nutrition_config 
         (userId, weight, height, age, gender, activityLevel, objective, intensity, 
          targetWeight, targetDate, calories, protein, carbs, fats, tier, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [
          config.userId,
          config.weight,
          config.height,
          config.age,
          config.gender,
          config.activityLevel,
          config.objective,
          config.intensity,
          config.targetWeight || null,
          config.targetDate || null,
          config.calories,
          config.protein,
          config.carbs,
          config.fats,
          config.tier
        ]
      );

      console.log('✅ Nutrition config saved to SQLite');
    } catch (error) {
      console.error('❌ Error saving nutrition config:', error);
      throw error;
    }
  }

  async getNutritionConfig(userId: string): Promise<NutritionConfig | null> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT * FROM nutrition_config WHERE userId = ?;',
        [userId]
      );

      return result as NutritionConfig | null;
    } catch (error) {
      console.error('❌ Error getting nutrition config:', error);
      return null;
    }
  }

  async insertMealLog(meal: Omit<MealLog, 'id' | 'synced'>): Promise<void> {
    console.log('🔧 Starting meal log insertion...');
    console.log('📊 Meal data:', JSON.stringify(meal, null, 2));
    
    // Forzar reinicialización de la base de datos
    console.log('🔄 Forcing database reinitialization...');
    this.db = null;
    await this.initDatabase();

    if (!this.db) {
      throw new Error('Failed to initialize database');
    }

    try {
      console.log('📝 Executing SQL insert...');
      await this.db.runAsync(
        `INSERT INTO meal_logs 
         (userId, date, mealType, imageUrl, description, calories, protein, carbs, fats, 
          aiAnalysis, imageHash, timestamp, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [
          meal.userId,
          meal.date,
          meal.mealType,
          meal.imageUrl || null,
          meal.description || null,
          meal.calories,
          meal.protein,
          meal.carbs,
          meal.fats,
          meal.aiAnalysis || null,
          meal.imageHash || null,
          meal.timestamp
        ]
      );

      console.log('✅ Meal log saved to SQLite successfully');
    } catch (error) {
      console.error('❌ Error inserting meal log:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getMealLogsByDate(userId: string, date: string): Promise<MealLog[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM meal_logs WHERE userId = ? AND date = ? ORDER BY timestamp DESC;',
        [userId, date]
      );

      return result as MealLog[];
    } catch (error) {
      console.error('❌ Error getting meal logs by date:', error);
      return [];
    }
  }

  async getUnsyncedMealLogs(): Promise<MealLog[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM meal_logs WHERE synced = 0 ORDER BY timestamp ASC;'
      );

      return result as MealLog[];
    } catch (error) {
      console.error('❌ Error getting unsynced meal logs:', error);
      return [];
    }
  }

  async markMealLogAsSynced(id: number): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync(
        'UPDATE meal_logs SET synced = 1 WHERE id = ?;',
        [id]
      );

      console.log(`✅ Meal log ${id} marked as synced`);
    } catch (error) {
      console.error('❌ Error marking meal log as synced:', error);
    }
  }

  async getDailyUsage(userId: string, date: string): Promise<number> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT usage_count FROM daily_usage WHERE userId = ? AND date = ?;',
        [userId, date]
      ) as { usage_count: number } | null;

      return result?.usage_count || 0;
    } catch (error) {
      console.error('❌ Error getting daily usage:', error);
      return 0;
    }
  }

  async incrementDailyUsage(userId: string, date: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO daily_usage (userId, date, usage_count)
         VALUES (?, ?, COALESCE((SELECT usage_count FROM daily_usage WHERE userId = ? AND date = ?), 0) + 1);`,
        [userId, date, userId, date]
      );

      console.log(`✅ Daily usage incremented for ${userId} on ${date}`);
    } catch (error) {
      console.error('❌ Error incrementing daily usage:', error);
    }
  }

  async resetDailyUsage(userId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    try {
      const today = new Date().toDateString();
      await this.db!.runAsync(
        'DELETE FROM daily_usage WHERE userId = ? AND date < ?;',
        [userId, today]
      );

      console.log(`✅ Daily usage reset for ${userId}`);
    } catch (error) {
      console.error('❌ Error resetting daily usage:', error);
    }
  }
}

export default new SQLiteService(); 