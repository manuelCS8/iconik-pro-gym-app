import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import EntrenarStack from './EntrenarStackNavigator';
import HomeScreen from '../screens/member/HomeScreen';
import ProfileScreen from '../screens/member/ProfileScreen';
import NutritionStackNavigator from './NutritionStackNavigator';
import TrainingHistoryStack from './TrainingHistoryStackNavigator';
import TrainingDetailScreen from '../screens/member/TrainingDetailScreen';
import EditRoutineScreen from '../screens/member/EditRoutineScreen';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { useTraining } from '../contexts/TrainingContext';

export type MemberTabParamList = {
  InicioTab: undefined;
  EntrenarTab: undefined;
  NutricionTab: undefined;
  PerfilTab: undefined;
};

export type MemberStackParamList = {
  MainTabs: undefined;
  TrainingHistoryStack: undefined;
  TrainingDetail: { sessionId: string };
  EditRoutine: { routineId: string };
};

const Tab = createBottomTabNavigator<MemberTabParamList>();
const Stack = createNativeStackNavigator<MemberStackParamList>();

// Componente personalizado para el tab de Entrenar
const EntrenarTabComponent: React.FC = () => {
  return <EntrenarStack />;
};

// Componente personalizado para el tab de Nutrición
const NutritionTabComponent: React.FC = () => {
  return <NutritionStackNavigator />;
};

// Componente para los tabs principales
const MainTabs: React.FC = () => {
  const { isTrainingInProgress, showTrainingModal, isTabBarVisible } = useTraining();

  // Mostrar el modal cuando hay entrenamiento en progreso y el usuario navega
  React.useEffect(() => {
    if (isTrainingInProgress) {
      // Pequeño delay para asegurar que la navegación se complete
      const timer = setTimeout(() => {
        showTrainingModal();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTrainingInProgress, showTrainingModal]);

  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: COLORS.primary || '#ff4444',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // Transparente como Spotify
          borderTopWidth: 0,
          height: 54,
          paddingBottom: 8,
          paddingTop: 2,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute', // Para que se pueda ocultar
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
          display: isTabBarVisible ? 'flex' : 'none', // Ocultar/mostrar la barra
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="InicioTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={28} />,
          tabBarLabel: "Inicio",
        }}
      />
      <Tab.Screen
        name="EntrenarTab"
        component={EntrenarTabComponent}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" color={color} size={28} />,
          tabBarLabel: "Entrenar",
          tabBarButton: (props) => {
            const { isTrainingInProgress, showTrainingModal } = useTraining();
            
            return (
              <TouchableOpacity
                {...props}
                onPress={() => {
                  if (isTrainingInProgress) {
                    // Si hay entrenamiento en progreso, mostrar el modal
                    showTrainingModal();
                  } else {
                    // Si no hay entrenamiento en progreso, navegar normalmente
                    props.onPress?.();
                  }
                }}
              />
            );
          },
        }}
      />
      <Tab.Screen
        name="NutricionTab"
        component={NutritionTabComponent}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition" color={color} size={28} />,
          tabBarLabel: "Nutrición",
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={28} />,
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
};

const MemberNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="TrainingHistoryStack" component={TrainingHistoryStack} />
      <Stack.Screen name="TrainingDetail" component={TrainingDetailScreen} />
      <Stack.Screen name="EditRoutine" component={EditRoutineScreen} />
    </Stack.Navigator>
  );
};

export default MemberNavigator; 