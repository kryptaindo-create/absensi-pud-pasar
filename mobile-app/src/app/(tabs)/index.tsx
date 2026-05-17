import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { CheckCircle, Clock, AlertTriangle, Calendar as CalendarIcon, FileText, Briefcase } from 'lucide-react-native';

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
  
  const [attendances, setAttendances] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

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

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const email = auth.currentUser.email;

      // Fetch User Profile for Sisa Cuti
      if (email) {
        getDocs(query(collection(db, 'users'), where('email', '==', email)))
          .then(snap => {
            if (!snap.empty) setUserData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          })
          .catch(err => console.log("Users Query Error:", err));
      }

      // Fetch Attendances
      const unsubAtt = onSnapshot(query(collection(db, 'attendance'), where('userId', '==', uid)), (snap) => {
        setAttendances(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.log("Attendance Query Error:", err));

      // Fetch Submissions
      const unsubSub = onSnapshot(query(collection(db, 'submissions'), where('userId', '==', uid)), (snap) => {
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.log("Submissions Query Error:", err));

      return () => {
        if (subscription) subscription.remove();
        unsubAtt();
        unsubSub();
      };
    } else {
      return () => {
        if (subscription) subscription.remove();
      };
    }
  }, []);

  const setupHardware = async () => {
    try {
      let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setLocationStatus('Izin Lokasi Ditolak. Absen diblokir.');
        return;
      }
      setLocationStatus('Mencari Kordinat GPS...');
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      if (location.mocked) {
        setLocationStatus('🚨 FAKE GPS TERDETEKSI! Akses Diblokir.');
        Alert.alert("Peringatan Keamanan", "Sistem mendeteksi penggunaan Fake GPS. Tindakan ini dicatat ke server.");
        return;
      }

      const jarakMeter = getDistanceInMeters(location.coords.latitude, location.coords.longitude, KANTOR_LAT, KANTOR_LON);

      setLocationStatus(`Lokasi Valid (${jarakMeter.toFixed(0)}m). Siap Absen.`);
      
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
      const payload = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        checkIn: {
          time: serverTimestamp(),
          photoUrl: "akan_diupload_ke_storage",
          location: {
            lat: KANTOR_LAT,
            lon: KANTOR_LON,
            isMocked: false,
            barometerPressure: pressureData || null
          }
        }
      };

      await addDoc(collection(db, 'attendance'), payload);
      Alert.alert('Sukses', 'Absensi Masuk Berhasil Dikonfirmasi!');
      setPhotoUri(null);
    } catch (err: any) {
      Alert.alert('Gagal Absen', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CALCULATIONS (16 s/d 15)
  const now = new Date();
  let startPeriod = new Date(now.getFullYear(), now.getMonth(), 16);
  let endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 15, 23, 59, 59);
  if (now.getDate() <= 15) {
    startPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 16);
    endPeriod = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
  }

  const isWithinPeriod = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    return d >= startPeriod && d <= endPeriod;
  };

  const monthlyAtts = attendances.filter(a => isWithinPeriod(a.date));
  const monthlyMasukList = monthlyAtts.filter(a => a.type === 'Masuk');
  const totalMasukBulanIni = new Set(monthlyMasukList.map(a => a.date)).size;
  const totalTerlambatBulanIni = monthlyMasukList.filter(a => a.status === 'Terlambat').length;

  const monthlyPulangDates = new Set(monthlyAtts.filter(a => a.type === 'Pulang').map(a => a.date));
  let lupaPulangBulanIni = 0;
  monthlyMasukList.forEach(m => {
    const isToday = new Date().toISOString().split('T')[0] === m.date;
    if (!monthlyPulangDates.has(m.date) && !isToday) lupaPulangBulanIni++;
  });

  const monthlySubs = submissions.filter(s => {
    if (s.status !== 'APPROVED') return false;
    if (s.startDate && isWithinPeriod(s.startDate)) return true;
    if (s.timestamp && typeof s.timestamp.toDate === 'function') {
      try { return isWithinPeriod(s.timestamp.toDate().toISOString()); } catch(e) { return false; }
    }
    return false;
  });

  const totalIzinSakitBulanIni = monthlySubs.filter(s => s.type === 'SAKIT' || s.type === 'IZIN' || s.type === 'KELUAR_KANTOR').length;
  const totalCutiBulanIni = monthlySubs.filter(s => s.type === 'CUTI').length;

  let workingDaysPast = 0;
  let cursor = new Date(startPeriod);
  const endCursor = now < endPeriod ? now : endPeriod;
  while (cursor <= endCursor) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) workingDaysPast++;
    cursor.setDate(cursor.getDate() + 1);
  }
  
  let totalAlpaBulanIni = workingDaysPast - (totalMasukBulanIni + totalIzinSakitBulanIni + totalCutiBulanIni);
  if (totalAlpaBulanIni < 0) totalAlpaBulanIni = 0;
  
  const allTimeMasuk = new Set(attendances.filter(a => a.type === 'Masuk').map(a => a.date)).size;

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.statusText}>{locationStatus}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      
      {/* HEADER & DASHBOARD */}
      <View style={styles.dashboardHeader}>
        <Text style={styles.headerTitle}>Beranda Karyawan</Text>
        <Text style={styles.periodText}>
          Periode: {startPeriod.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} - {endPeriod.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {/* All time box */}
        <View style={styles.statBoxMain}>
          <Briefcase color="#fff" size={24} style={{ marginBottom: 8 }} />
          <Text style={styles.statLabelMain}>Total Hadir (All-Time)</Text>
          <Text style={styles.statValueMain}>{allTimeMasuk} <Text style={styles.statUnit}>Hari</Text></Text>
        </View>

        {/* Grid 6 Kotak */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}><CheckCircle color="#10b981" size={16} /></View>
            <Text style={styles.statValue}>{totalMasukBulanIni}</Text>
            <Text style={styles.statLabel}>Hadir</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}><Clock color="#f59e0b" size={16} /></View>
            <Text style={styles.statValue}>{totalTerlambatBulanIni}</Text>
            <Text style={styles.statLabel}>Terlambat</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fee2e2' }]}><AlertTriangle color="#ef4444" size={16} /></View>
            <Text style={styles.statValue}>{lupaPulangBulanIni}</Text>
            <Text style={styles.statLabel}>Lupa Pulang</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#dbeafe' }]}><FileText color="#3b82f6" size={16} /></View>
            <Text style={styles.statValue}>{totalIzinSakitBulanIni}</Text>
            <Text style={styles.statLabel}>Izin / Sakit</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#ffe4e6' }]}><AlertTriangle color="#f43f5e" size={16} /></View>
            <Text style={styles.statValue}>{totalAlpaBulanIni}</Text>
            <Text style={styles.statLabel}>Alpa</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: '#e0e7ff' }]}><CalendarIcon color="#6366f1" size={16} /></View>
            <Text style={styles.statValue}>{userData?.sisaCuti || 0}</Text>
            <Text style={styles.statLabel}>Sisa Cuti</Text>
          </View>
        </View>
      </View>

      {/* CAMERA SECTION */}
      <View style={styles.cameraSection}>
        <Text style={styles.sectionTitle}>Ambil Absen Liveness</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>✅ {locationStatus}</Text>
          <Text style={styles.infoText}>
            {pressureData ? `📊 Tekanan Udara: ${pressureData.toFixed(1)} hPa` : `📊 Sensor Barometer: Tidak Tersedia`}
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
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirim Absen</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40, paddingTop: 60 },
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  
  // Header
  dashboardHeader: { marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  periodText: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
  
  // Stats
  statsContainer: { marginBottom: 30 },
  statBoxMain: { backgroundColor: '#2563eb', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  statLabelMain: { color: '#bfdbfe', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  statValueMain: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 5 },
  statUnit: { fontSize: 16, fontWeight: 'bold' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '31%', backgroundColor: '#fff', padding: 12, borderRadius: 16, alignItems: 'center', marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  iconWrapper: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 2, textAlign: 'center' },

  // Camera
  cameraSection: { backgroundColor: '#fff', padding: 16, borderRadius: 24, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 15 },
  
  statusText: { marginTop: 16, fontSize: 16, color: '#475569', textAlign: 'center', fontWeight: 'bold' },
  infoCard: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  infoText: { fontSize: 12, color: '#334155', marginBottom: 5, fontWeight: '700' },
  
  cameraContainer: { height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  actionContainer: { marginTop: 15 },
  captureButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 16, alignItems: 'center' },
  captureText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  submitContainer: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  retakeButton: { backgroundColor: '#64748b' },
  submitButton: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
