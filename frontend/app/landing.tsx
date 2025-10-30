import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Menú desplegable */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setMenuVisible(!menuVisible)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={styles.dropdown}>
          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/auth/login');
            }}
          >
            <Ionicons name="log-in-outline" size={20} color="#0A0A0A" />
            <Text style={styles.dropdownText}>Iniciar Sesión</Text>
          </Pressable>
          <View style={styles.dropdownDivider} />
          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/auth/register');
            }}
          >
            <Ionicons name="person-add-outline" size={20} color="#0A0A0A" />
            <Text style={styles.dropdownText}>Registrarse</Text>
          </Pressable>
        </View>
      )}

      {/* Logo y contenido central */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="time" size={80} color="#fff" />
          <Text style={styles.logoText}>FocusTrack</Text>
          <Text style={styles.tagline}>Tu agenda estudiantil inteligente</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.beginButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push('/(tabs)/subjects')}
        >
          <Text style={styles.beginButtonText}>Comenzar</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#0A0A0A',
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '500',
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#70B1EA',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  beginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});