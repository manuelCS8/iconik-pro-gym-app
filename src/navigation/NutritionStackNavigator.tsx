import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NutritionHomeScreen from '../screens/member/nutrition/NutritionHomeScreen';
import NutritionSetupScreen from '../screens/member/nutrition/NutritionSetupScreen';
import AddMealScreen from '../screens/member/nutrition/AddMealScreen';
import NutritionHistoryScreen from '../screens/member/nutrition/NutritionHistoryScreen';
import NutritionSettingsScreen from '../screens/member/nutrition/NutritionSettingsScreen';

export type NutritionStackParamList = {
  NutritionHome: undefined;
  NutritionSetup: undefined;
  AddMeal: undefined;
  NutritionHistory: undefined;
  NutritionSettings: undefined;
};

const Stack = createNativeStackNavigator<NutritionStackParamList>();

const NutritionStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NutritionHome" component={NutritionHomeScreen} />
      <Stack.Screen name="NutritionSetup" component={NutritionSetupScreen} />
      <Stack.Screen name="AddMeal" component={AddMealScreen} />
      <Stack.Screen name="NutritionHistory" component={NutritionHistoryScreen} />
      <Stack.Screen name="NutritionSettings" component={NutritionSettingsScreen} />
    </Stack.Navigator>
  );
};

export default NutritionStackNavigator; 