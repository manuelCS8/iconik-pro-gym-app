import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";
import AuthNavigator from "./AuthNavigator";
import MemberNavigator from "./MemberNavigator";
import AdminNavigator from "./AdminNavigator";
import TrainingModal from "../components/TrainingModal";
import { RootState } from "../redux/store";

const AppNavigator: React.FC = () => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  // Log para depuración
  console.log("NAVIGATOR - isAuthenticated:", isAuthenticated, "role:", role);

  if (!isAuthenticated) return <AuthNavigator />;
  if (role === "ADMIN") return <AdminNavigator />;
  if (role === "MEMBER") return <MemberNavigator />;
  // Si el rol no es válido, muestra pantalla de login
  return <AuthNavigator />;
};

export default () => (
  <NavigationContainer>
    <AppNavigator />
    <TrainingModal />
  </NavigationContainer>
); 