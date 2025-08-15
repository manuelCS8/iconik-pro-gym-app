import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EntrenarHomeScreen from "../screens/member/EntrenarHomeScreen";
import TrainingScreen from "../screens/member/TrainingScreen";
import MyRoutinesScreen from "../screens/member/MyRoutinesScreen";
import RoutinesScreen from "../screens/member/RoutinesScreen"; // renombrar a ExploreRoutines
import CreateRoutineScreen from "../screens/member/CreateRoutineScreen";
import ConfigureExerciseScreen from "../screens/member/ConfigureExerciseScreen";
import RoutineDetail from "../screens/member/RoutineDetail";
import RoutineDetailScreen from "../screens/member/RoutineDetailScreen";
import TrainingSessionScreen from "../screens/member/TrainingSessionScreen";
import TrainingSummaryScreen from "../screens/member/TrainingSummaryScreen";
import TrainingSuccessScreen from "../screens/member/TrainingSuccessScreen";
import ExercisesScreen from "../screens/member/ExercisesScreen";
import ExerciseDetailScreen from "../screens/member/ExerciseDetailScreen";
import ExerciseVideoScreen from "../screens/member/ExerciseVideoScreen";


const Stack = createNativeStackNavigator();

const EntrenarStack = () => (
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
    <Stack.Screen name="EntrenarHome" component={EntrenarHomeScreen} />
    <Stack.Screen name="MyRoutines" component={MyRoutinesScreen} />
    <Stack.Screen name="ExploreRoutines" component={RoutinesScreen} />
    <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} />
    <Stack.Screen 
      name="ConfigureExercise" 
      component={ConfigureExerciseScreen}
      options={{ 
        headerShown: false
      }}
    />

    <Stack.Screen name="Training" component={TrainingScreen} />
    <Stack.Screen 
      name="RoutineDetail" 
      component={RoutineDetailScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="RoutineDetailScreen" 
      component={RoutineDetailScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="TrainingSession" 
      component={TrainingSessionScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="TrainingSummary" 
      component={TrainingSummaryScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="TrainingSuccess" 
      component={TrainingSuccessScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="ExercisesList" 
      component={ExercisesScreen}
      options={{ 
        headerShown: true,
        title: 'Ejercicios',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ExerciseDetail" 
      component={ExerciseDetailScreen}
      options={{ 
        headerShown: true,
        title: 'Detalle de Ejercicio',
        headerBackTitle: 'Atrás'
      }}
    />
    <Stack.Screen 
      name="ExerciseVideo" 
      component={ExerciseVideoScreen}
      options={{ 
        headerShown: false
      }}
    />

  </Stack.Navigator>
);

export default EntrenarStack; 