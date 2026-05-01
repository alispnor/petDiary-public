import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#24b6d4",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  let tokenData;
  try {
    tokenData = await Notifications.getExpoPushTokenAsync();
  } catch {
    return null;
  }

  const expoPushToken = tokenData.data;

  try {
    await api.post("/notifications/devices/register/", {
      platform: Platform.OS === "ios" ? "ios" : "android",
      expo_push_token: expoPushToken,
    });
  } catch {
    // não é fatal — token será re-registrado em logins futuros
  }

  return expoPushToken;
}

export async function unregisterPushAsync(): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.post("/notifications/devices/unregister/", {
      expo_push_token: tokenData.data,
    });
  } catch {
    // ignora silenciosamente
  }
}

type NavigateFn = (screen: string, params?: any) => void;

export function setupNotificationTapHandler(navigate: NavigateFn) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    const screen = data?.screen;
    if (!screen) return;

    if (screen === "PetDashboard" && data.petId) {
      // Sem objeto pet completo — Notifications navega pra HomeTutor que
      // tem a lista; user toca no card. Alternativa futura: GET /pets/<id>/
      navigate("HomeTutor");
    } else if (screen === "Subscription") {
      navigate("SubscriptionDashboard");
    } else if (screen === "Notifications") {
      navigate("Notifications");
    }
  });
}
