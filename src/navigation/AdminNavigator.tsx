import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageMembersScreen from '../screens/admin/ManageMembersScreen';
import ManageExercisesScreen from '../screens/admin/ManageExercisesScreen';
import ManageRoutinesScreen from '../screens/admin/ManageRoutinesScreen';
import ProfileScreen from '../screens/member/ProfileScreen'; // Los admins también tienen perfil
import AdminManagementScreen from '../screens/admin/AdminManagementScreen';
import PendingUsersScreen from '../screens/admin/PendingUsersScreen';
import ExerciseVideoScreen from '../screens/member/ExerciseVideoScreen';
import MigrateVideosScreen from '../screens/admin/MigrateVideosScreen';
import MigrateImagesScreen from '../screens/admin/MigrateImagesScreen';
import TestImageUploadScreen from '../screens/admin/TestImageUploadScreen';
import UpdateRoutinesScreen from '../screens/admin/UpdateRoutinesScreen';
import DeleteRoutinesScreen from '../screens/admin/DeleteRoutinesScreen';
import TestRoutinesScreen from '../screens/admin/TestRoutinesScreen';
import WebExerciseUploadScreen from '../screens/admin/WebExerciseUploadScreen';
import WebExerciseListScreen from '../screens/admin/WebExerciseListScreen';
import ExerciseMediaDiagnosticScreen from '../screens/admin/ExerciseMediaDiagnosticScreen';
import { COLORS } from '../utils/theme';

export type AdminTabParamList = {
  DashboardTab: undefined;
  GestionTab: undefined;
  PerfilTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator();

// Stack Navigator para la sección de Gestión
const GestionStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      headerStyle: {
        backgroundColor: '#E31C1F',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen name="ManagementHome" component={AdminManagementScreen} />
    <Stack.Screen 
      name="CreateUser" 
      component={require('../screens/admin/CreateUserScreen').default} 
      options={{
        headerShown: true,
        title: 'Crear Usuario',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="PendingUsers" 
      component={PendingUsersScreen}
      options={{
        headerShown: true,
        title: 'Usuarios Pendientes',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ManageMembers" 
      component={ManageMembersScreen}
      options={{ 
        headerShown: true,
        title: 'Gestionar Miembros',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ManageExercises" 
      component={ManageExercisesScreen}
      options={{ 
        headerShown: true,
        title: 'Gestionar Ejercicios',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ManageRoutines" 
      component={ManageRoutinesScreen}
      options={{ 
        headerShown: true,
        title: 'Gestionar Rutinas',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen name="CreateRoutine" component={require('../screens/admin/CreateRoutineScreen').default} options={{ headerShown: true, title: 'Crear Rutina', headerBackTitle: 'Atrás' }} />
    <Stack.Screen name="CreateExercise" component={require('../screens/admin/CreateExerciseScreen').default} options={{ headerShown: true, title: 'Crear Ejercicio', headerBackTitle: 'Atrás' }} />
    <Stack.Screen 
      name="ExerciseVideo" 
      component={ExerciseVideoScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="MigrateVideos" 
      component={MigrateVideosScreen}
      options={{ 
        headerShown: true,
        title: 'Migrar Videos',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="MigrateImages" 
      component={MigrateImagesScreen}
      options={{ 
        headerShown: true,
        title: 'Migrar Imágenes',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="TestImageUpload" 
      component={TestImageUploadScreen}
      options={{ 
        headerShown: true,
        title: 'Prueba de Imágenes',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="UpdateRoutines" 
      component={UpdateRoutinesScreen}
      options={{ 
        headerShown: true,
        title: 'Actualizar Rutinas',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="DeleteRoutines" 
      component={DeleteRoutinesScreen}
      options={{ 
        headerShown: true,
        title: 'Eliminar Rutinas',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="TestRoutines" 
      component={TestRoutinesScreen}
      options={{ 
        headerShown: true,
        title: 'Diagnóstico de Rutinas',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="WebExerciseUpload" 
      component={WebExerciseUploadScreen}
      options={{ 
        headerShown: true,
        title: 'Crear Ejercicio (Web)',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="WebExerciseList" 
      component={WebExerciseListScreen}
      options={{ 
        headerShown: true,
        title: 'Lista de Ejercicios (Web)',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ExerciseMediaDiagnostic" 
      component={ExerciseMediaDiagnosticScreen}
      options={{ 
        headerShown: true,
        title: 'Diagnóstico de Medios',
        headerBackTitle: 'Atrás'
      }}
    />
  </Stack.Navigator>
);

const AdminNavigator: React.FC = () => (
  <Tab.Navigator 
    screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: COLORS.primary || '#ff4444',
      tabBarInactiveTintColor: '#888888',
      tabBarStyle: {
        backgroundColor: '#000000',
        borderTopWidth: 0,
        height: 70,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      tabBarIconStyle: {
        marginTop: 5,
      },
    }}
  >
    <Tab.Screen
      name="DashboardTab"
      component={AdminDashboard}
      options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color} size={28} />,
        tabBarLabel: "Dashboard",
      }}
    />
    <Tab.Screen 
      name="GestionTab" 
      component={GestionStack}
      options={{ 
        tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={28} />,
        tabBarLabel: "Gestión",
      }}
    />
  </Tab.Navigator>
);

export default AdminNavigator; 