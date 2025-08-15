import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TrainingHistoryScreen from "../screens/member/TrainingHistoryScreen";
import TrainingDetailScreen from "../screens/member/TrainingDetailScreen";

const Stack = createNativeStackNavigator();

const TrainingHistoryStack = () => (
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
    <Stack.Screen 
      name="TrainingHistory" 
      component={TrainingHistoryScreen}
      options={{ 
        headerShown: false
      }}
    />
    <Stack.Screen 
      name="TrainingDetail" 
      component={TrainingDetailScreen}
      options={{ 
        headerShown: false
      }}
    />
  </Stack.Navigator>
);

export default TrainingHistoryStack; 