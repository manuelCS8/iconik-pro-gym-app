import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import EmailSignUpScreen from '../screens/auth/EmailSignUpScreen';
import CompleteRegistrationScreen from '../screens/auth/CompleteRegistrationScreen';
import TermsScreen from '../screens/auth/TermsScreen';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: { termsAccepted?: boolean } | undefined;
  EmailSignUp: undefined;
  CompleteRegistration: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} />
      <Stack.Screen name="CompleteRegistration" component={CompleteRegistrationScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 