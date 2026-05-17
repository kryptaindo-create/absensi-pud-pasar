import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LogOut, User as UserIcon } from 'lucide-react-native';
import { auth } from '../../lib/firebase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Keluar', 
        style: 'destructive',
        onPress: async () => {
          await auth.signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Karyawan</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <UserIcon color="#94a3b8" size={40} />
        </View>
        <Text style={styles.name}>{auth.currentUser?.displayName || 'Nama Pegawai'}</Text>
        <Text style={styles.email}>{auth.currentUser?.email || 'email@pudpasar.com'}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
            <LogOut color="#ef4444" size={20} />
          </View>
          <Text style={styles.menuTextLogout}>Keluar (Logout)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  profileCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 1 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b' },
  menuContainer: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTextLogout: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
});
