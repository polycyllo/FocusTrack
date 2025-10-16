import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';

export default function Index() {
  const { isAuthenticated, restoreSession } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restaurar sesión si existe
    const init = async () => {
      await restoreSession();
      setIsReady(true);
    };
    init();
  }, []);

  // Mostrar loader mientras se verifica la sesión
  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  // Siempre ir a landing primero (el usuario decide si quiere login o continuar sin cuenta)
  return <Redirect href="/landing" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
  },
});