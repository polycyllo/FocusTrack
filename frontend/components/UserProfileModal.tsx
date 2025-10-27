import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/auth.store';

type UserProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onStatistics: () => void;
};

export default function UserProfileModal({
  visible,
  onClose,
  onLogout,
  onStatistics,
}: UserProfileModalProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  // Obtener la inicial del nombre
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay para cerrar al tocar fuera */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Modal content - prevenir que se cierre al tocar dentro */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modal}>
            {/* Avatar con inicial */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            </View>

            {/* Nombre del usuario */}
            <Text style={styles.userName}>{user.name}</Text>

            {/* Botón Estadísticas */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.statsButton,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                onClose();
                onStatistics();
              }}
            >
              <Ionicons name="stats-chart" size={20} color="#fff" />
              <Text style={styles.buttonText}>Estadísticas</Text>
            </Pressable>

            {/* Botón Cerrar sesión */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.logoutButton,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                onClose();
                onLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  modalContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#70B1EA',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  statsButton: {
    backgroundColor: '#4A90E2',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    marginBottom: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});