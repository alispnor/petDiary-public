import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/useAppStore";
import { LoginScreen } from "../screens/Login";
import { HomeTutor } from "../screens/HomeTutor";
import { PetDashboard } from "../screens/PetDashboard";
import { AccountSettings } from "../screens/AccountSettings";
import { SubscriptionDashboard } from "../screens/SubscriptionDashboard";
import { HelpCenter } from "../screens/HelpCenter";
import type { Pet } from "../types";

export type RootStackParamList = {
  Login: undefined;
  HomeTutor: undefined;
  PetDashboard: { pet: Pet };
  AccountSettings: undefined;
  SubscriptionDashboard: undefined;
  HelpCenter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);

  const isAuthenticated = !!token && !!user;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#24b6d4" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="HomeTutor"
              component={HomeTutor}
              options={{ title: "Meus Pets", headerShown: false }}
            />
            <Stack.Screen
              name="PetDashboard"
              component={PetDashboard}
              options={({ route }) => ({ title: route.params.pet.name })}
            />
            <Stack.Screen
              name="AccountSettings"
              component={AccountSettings}
              options={{ title: "Minha conta" }}
            />
            <Stack.Screen
              name="SubscriptionDashboard"
              component={SubscriptionDashboard}
              options={{ title: "Assinatura" }}
            />
            <Stack.Screen
              name="HelpCenter"
              component={HelpCenter}
              options={{ title: "Ajuda" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
