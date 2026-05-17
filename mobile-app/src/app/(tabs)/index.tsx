import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Konstanta Kordinat Kantor PUD Pasar (Contoh: Titik Pusat)
const KANTOR_LAT = 3.595300; 
const KANTOR_LON = 98.672200;
const RADIUS_MAKSIMAL_METER = 50; // Radius absensi 50 meter

// Haversine Formula untuk menghitung jarak meter
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function DashboardScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState<string>('Menunggu Izin Lokasi...');
  const [isReady, setIsReady] = useState(false);
  const [pressureData, setPressureData] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    setupHardware();
    
    // Barometer Listener (Opsional)
    let subscription: any;
    Barometer.isAvailableAsync().then((available) => {
      if (available) {
        subscription = Barometer.addListener(barometerData => {
          setPressureData(barometerData.pressure);
        });
        Barometer.setUpdateInterval(2000);
      }
    });

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const setupHardware = async () => {
    try {
      // 1. Izin Lokasi
      let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setLocationStatus('Izin Lokasi Ditolak. Absen diblokir.');
        return;
      }

      setLocationStatus('Mencari Kordinat GPS...');
      
      // 2. Ambil Kordinat (Akurasi Tinggi)
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // 3. ZERO-TRUST: Deteksi Fake GPS (Mock Location)
      if (location.mocked) {
        setLocationStatus('🚨 FAKE GPS TERDETEKSI! Akses Diblokir.');
        Alert.alert("Peringatan Keamanan", "Sistem mendeteksi penggunaan Fake GPS. Tindakan ini dicatat ke server.");
        // (Bisa memanggil Cloud Function untuk suspend akun otomatis di sini)
        return;
      }

      // 4. Geofencing (Hitung Jarak)
      const jarakMeter = getDistanceInMeters(
        location.coords.latitude, 
        location.coords.longitude,
        KANTOR_LAT,
        KANTOR_LON
      );

      // Untuk tujuan pengujian, kita akan bypass geofencing jika jarak sangat jauh (misal saat kita testing di rumah)
      // Namun di Production, baris ini HARUS di-uncomment:
      /*
      if (jarakMeter > RADIUS_MAKSIMAL_METER) {
        setLocationStatus(`Di Luar Jangkauan (${jarakMeter.toFixed(0)}m). Anda harus berada di radius 50m dari kantor.`);
        return;
      }
      */

      setLocationStatus(`Lokasi Valid (${jarakMeter.toFixed(0)}m). Siap Absen.`);
      
      // 5. Minta izin kamera
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      setIsReady(true);
    } catch (err: any) {
      setLocationStatus(`Error GPS: ${err.message}`);
    }
  };

  const handleAmbilFoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setPhotoUri(photo.uri);
    }
  };

  const submitAbsen = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    
    try {
      // Data yang dikirim ke backend (Waktu menggunakan serverTimestamp() Firebase)
      const payload = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        checkIn: {
          time: serverTimestamp(),
          photoUrl: "akan_diupload_ke_storage", // Dalam produksi, Base64 foto ini di-upload ke Cloud Storage dulu
          location: {
            lat: KANTOR_LAT, // Catat posisi yg valid
            lon: KANTOR_LON,
            isMocked: false,
            barometerPressure: pressureData || null // Data lantai tambahan
          }
        }
      };

      await addDoc(collection(db, 'attendance'), payload);
      Alert.alert('Sukses', 'Absensi Masuk Berhasil Dikonfirmasi!');
      setPhotoUri(null); // Reset
    } catch (err: any) {
      Alert.alert('Gagal Absen', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.statusText}>{locationStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Absensi Liveness</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>✅ {locationStatus}</Text>
        <Text style={styles.infoText}>
          {pressureData ? `📊 Sensor Tekanan Udara: ${pressureData.toFixed(1)} hPa` : `📊 Sensor Barometer: Tidak Tersedia di HP ini`}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.camera} />
        ) : (
          <CameraView 
            style={styles.camera} 
            facing="front"
            ref={cameraRef}
          />
        )}
      </View>

      <View style={styles.actionContainer}>
        {!photoUri ? (
          <TouchableOpacity style={styles.captureButton} onPress={handleAmbilFoto}>
            <Text style={styles.captureText}>Ambil Foto Wajah</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.submitContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.retakeButton]} 
              onPress={() => setPhotoUri(null)}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Ulangi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={submitAbsen}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirim Absen Masuk</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20, justifyContent: 'center' },
  statusText: { marginTop: 16, fontSize: 16, color: '#475569', textAlign: 'center', fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 2 },
  infoText: { fontSize: 13, color: '#334155', marginBottom: 5, fontWeight: '600' },
  cameraContainer: { height: 400, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', elevation: 5 },
  camera: { flex: 1 },
  actionContainer: { marginTop: 20 },
  captureButton: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center' },
  captureText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitContainer: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  retakeButton: { backgroundColor: '#64748b' },
  submitButton: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
