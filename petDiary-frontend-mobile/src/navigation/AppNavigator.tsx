import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
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
import { NotificationsScreen } from "../screens/Notifications";
import { NotificationPreferencesScreen } from "../screens/NotificationPreferences";
import {
  registerForPushNotificationsAsync,
  setupNotificationTapHandler,
} from "../services/notifications";
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
  Notifications: undefined;
  NotificationPreferences: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function AppNavigator() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const [hydrated, setHydrated] = useState(
    useAppStore.persist.hasHydrated()
  );
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (!isAuthenticated) {
      pushRegistered.current = false;
      return;
    }
    if (pushRegistered.current) return;
    pushRegistered.current = true;
    registerForPushNotificationsAsync().catch(() => {
      pushRegistered.current = false;
    });

    const sub = setupNotificationTapHandler((screen) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(screen as any);
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand.teal} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Notificações" }}
            />
            <Stack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
              options={{ title: "Notificações" }}
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
