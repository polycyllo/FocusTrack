import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ensureSchema } from '../src/db/init';
import { db } from '../src/db/db';
import { student } from '../src/db/schemas/Student';
import { eq } from 'drizzle-orm';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    //Para mockear un studiante
    (async () => {
 
      ensureSchema();

    
      const pepitoEmail = 'pepito@gmail.com';
      const existing = await db
        .select()
        .from(student)
        .where(eq(student.email, pepitoEmail))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(student).values({
          name: 'Pepito',
          email: pepitoEmail,
          password: '123456',
        });
         console.log('✅ Pepito creado');
      } else {
         console.log('ℹ️ Pepito ya existía, no se vuelve a crear');
      }
          const result = await db.select().from(student);
    console.log("📂 Students en DB:", result);
      // 3) Cierra splash
      await SplashScreen.hideAsync();
    })();
  }, [loaded]);


  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
