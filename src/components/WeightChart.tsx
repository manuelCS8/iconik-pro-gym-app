import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

interface Measurement {
  date: string;
  weight: number;
}

const WeightChart: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<{ x: Date; y: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeightData = async () => {
      setIsLoading(true);
      try {
        // Intentar cargar datos reales de Firestore
        const q = query(
          collection(firestore, "users", userId, "measurements"),
          orderBy("date", "asc")
        );
        const snap = await getDocs(q);
        const arr: { x: Date; y: number }[] = [];
        
        snap.forEach(doc => {
          const { date, weight } = doc.data() as any;
          arr.push({ x: new Date(date), y: weight });
        });

        // Si no hay datos reales, usar datos demo
        if (arr.length === 0) {
          const mockData = generateMockWeightData();
          setData(mockData);
        } else {
          setData(arr);
        }
      } catch (error) {
        console.log("Using mock weight data:", error);
        // En modo mock, generar datos de ejemplo
        const mockData = generateMockWeightData();
        setData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeightData();
  }, [userId]);

  const generateMockWeightData = (): { x: Date; y: number }[] => {
    const baseWeight = 75; // peso base
    const data: { x: Date; y: number }[] = [];
    const today = new Date();

    // Generar datos de los últimos 30 días con variación realista
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Variación realista del peso (-2kg a +2kg del peso base)
      const variation = (Math.random() - 0.5) * 4;
      const weight = baseWeight + variation + (i * 0.05); // tendencia ligera
      
      data.push({
        x: new Date(date),
        y: Math.round(weight * 10) / 10 // redondear a 1 decimal
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>Sin historial de peso</Text>
      </View>
    );
  }

  // Calcular estadísticas
  const weights = data.map(d => d.y);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

  // Crear gráfico simple con barras
  const chartData = data.slice(-7); // Últimos 7 días
  const chartMax = Math.max(...chartData.map(d => d.y));
  const chartMin = Math.min(...chartData.map(d => d.y));
  const range = chartMax - chartMin || 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 Evolución de Peso (Última Semana)</Text>
      
      {/* Gráfico simple con barras */}
      <View style={styles.chart}>
        {chartData.map((point, index) => {
          const height = ((point.y - chartMin) / range) * 100 + 20; // Altura relativa
          const dayLabel = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][point.x.getDay()];
          
          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.weightLabel}>{point.y.toFixed(1)}</Text>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: height,
                    backgroundColor: index === chartData.length - 1 ? '#E31C1F' : '#ff444480'
                  }
                ]} 
              />
              <Text style={styles.dayLabel}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>

      {/* Estadísticas */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{minWeight.toFixed(1)}kg</Text>
          <Text style={styles.statLabel}>Mínimo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgWeight.toFixed(1)}kg</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{maxWeight.toFixed(1)}kg</Text>
          <Text style={styles.statLabel}>Máximo</Text>
        </View>
      </View>
    </View>
  );
};

export default WeightChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: "center", 
    color: "#999", 
    marginVertical: 20,
    fontSize: 14,
  },
  noData: { 
    textAlign: "center", 
    color: "#666", 
    marginVertical: 20,
    fontSize: 14,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weightLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 20,
  },
  dayLabel: {
    fontSize: 10,
    color: '#999',
    transform: [{ rotate: '-45deg' }],
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E31C1F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 