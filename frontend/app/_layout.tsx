import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/components/useColorScheme";
import { ensureSchema } from "../src/db/init";
import { db } from "../src/db/db";
import { student } from "../src/db/schemas/Student";
import { eq } from "drizzle-orm";
import * as Notifications from "expo-notifications";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true as any,
    shouldShowList: true as any,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      // Solicitar permisos de notificaciones
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      // Configurar canal de notificaciones default
      await Notifications.setNotificationChannelAsync("default", {
        name: "Recordatorios",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [250, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // Configurar canal de notificaciones para alarmas
      await Notifications.setNotificationChannelAsync("alarm-bell", {
        name: "Alarmas (Campana)",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "bell",
        vibrationPattern: [250, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // Inicializar esquema de base de datos
      ensureSchema();

      // Crear usuario de prueba "Pepito" si no existe
      const pepitoEmail = "pepito@gmail.com";
      const existing = await db
        .select()
        .from(student)
        .where(eq(student.email, pepitoEmail))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(student).values({
          name: "Pepito",
          email: pepitoEmail,
          password: "123456",
        });
        console.log("✅ Pepito creado");
      } else {
        console.log("ℹ️ Pepito ya existía, no se vuelve a crear");
      }

      // Mostrar estudiantes en la consola
      const result = await db.select().from(student);
      console.log("📂 Students en DB:", result);

      await SplashScreen.hideAsync();
    })();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}