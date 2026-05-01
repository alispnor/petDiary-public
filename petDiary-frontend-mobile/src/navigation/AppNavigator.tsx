import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/useAppStore";
import { LoginScreen } from "../screens/Login";
import { RegisterScreen } from "../screens/Register";
import { ForgotPasswordScreen } from "../screens/ForgotPassword";
import { HomeTutor } from "../screens/HomeTutor";
import { PetDashboard } from "../screens/PetDashboard";
import { AccountSettings } from "../screens/AccountSettings";
import { SubscriptionDashboard } from "../screens/SubscriptionDashboard";
import { HelpCenter } from "../screens/HelpCenter";
import { colors } from "../theme";
import type { Pet } from "../types";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
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
  const [hydrated, setHydrated] = useState(
    useAppStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand.teal} />
      </View>
    );
  }

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
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Criar conta" }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: "Recuperar senha" }}
            />
          </>
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg.app,
    justifyContent: "center",
    alignItems: "center",
  },
});
