import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { auth, db } from '../lib/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengekstrak Hardware ID (Device ID)
  const getDeviceId = async () => {
    try {
      if (Platform.OS === 'android') {
        return Application.getAndroidId();
      } else if (Platform.OS === 'ios') {
        return await Application.getIosIdForVendorAsync();
      } else {
        // Fallback untuk simulator Web / Web platform
        return "SIMULATOR_DEVICE_ID";
      }
    } catch (e) {
      console.warn("Could not get device ID", e);
      return "UNKNOWN_DEVICE";
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Mohon isi email dan password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch User Profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await auth.signOut();
        throw new Error('Data karyawan tidak ditemukan di database.');
      }

      const userData = userDoc.data();
      
      // 3. ZERO-TRUST: Device Binding Check
      const currentDeviceId = await getDeviceId();

      if (!userData.lockedDeviceId) {
        // KONDISI A: Login pertama kali, Kunci Perangkat!
        await updateDoc(userDocRef, {
          lockedDeviceId: currentDeviceId
        });
        Alert.alert('Perangkat Terkunci', 'Akun Anda berhasil ditautkan secara permanen ke perangkat ini.');
      } else if (userData.lockedDeviceId !== currentDeviceId) {
        // KONDISI C: HP Berbeda (Terdeteksi Titip Absen / Pinjam HP)
        await auth.signOut();
        Alert.alert(
          'Akses Ditolak (Pelanggaran Keamanan)',
          'Akun ini telah terkunci di perangkat lain. Anda tidak bisa login menggunakan HP ini. Hubungi Admin HR untuk permohonan reset perangkat.'
        );
        setLoading(false);
        return;
      }

      // KONDISI B: Lolos Validasi
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Gagal Login', error.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>PUD PASAR</Text>
          <Text style={styles.subtitle}>Sistem Absensi Keamanan Tinggi</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Karyawan"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>MASUK & KUNCI PERANGKAT</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
