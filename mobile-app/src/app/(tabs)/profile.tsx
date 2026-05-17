import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LogOut, User as UserIcon, Briefcase, FileText, Heart, MapPin, Calendar } from 'lucide-react-native';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser?.email) return;
      try {
        const q = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setUserData(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

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

  const renderInfoRow = (label: string, value: string | undefined) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil & Data Kepegawaian</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card Identitas Dasar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UserIcon color="#2563eb" size={20} />
            <Text style={styles.cardTitle}>Identitas Pribadi</Text>
          </View>
          <View style={styles.cardBody}>
            {renderInfoRow("Nama Lengkap", userData?.name || auth.currentUser?.displayName)}
            {renderInfoRow("NIPP", userData?.nipp || userData?.employeeId)}
            {renderInfoRow("Tempat, Tanggal Lahir", `${userData?.tempatLahir || '-'}, ${userData?.tanggalLahir || '-'}`)}
            {renderInfoRow("Jenis Kelamin", userData?.jenisKelamin)}
            {renderInfoRow("Agama", userData?.agama)}
            {renderInfoRow("Alamat Lengkap", userData?.alamat)}
          </View>
        </View>

        {/* Card Kepegawaian */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Briefcase color="#10b981" size={20} />
            <Text style={styles.cardTitle}>Data Pekerjaan</Text>
          </View>
          <View style={styles.cardBody}>
            {renderInfoRow("Status Pegawai", userData?.statusPegawai)}
            {renderInfoRow("Golongan", userData?.golongan)}
            {renderInfoRow("Tempat Tugas", userData?.tempatTugas)}
            {renderInfoRow("Lokasi Absen", userData?.lokasiAbsen)}
            {renderInfoRow("Tanggal Masuk Kerja", userData?.tanggalMasuk)}
            {renderInfoRow("No. SK Pengangkatan", userData?.nomorSk)}
            {renderInfoRow("Tanggal SK Pengangkatan", userData?.tanggalSk)}
          </View>
        </View>

        {/* Card Keluarga */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart color="#ef4444" size={20} />
            <Text style={styles.cardTitle}>Status Perkawinan & Keluarga</Text>
          </View>
          <View style={styles.cardBody}>
            {renderInfoRow("Status Perkawinan", userData?.statusPerkawinan)}
            
            {userData?.statusPerkawinan === 'Sudah Menikah' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.subTitle}>Data Pasangan</Text>
                {renderInfoRow("Nama Istri/Suami", userData?.namaPasangan)}
                {renderInfoRow("Tanggal Lahir Pasangan", userData?.tanggalLahirPasangan)}
                {renderInfoRow("Jumlah Tanggungan", userData?.jumlahTanggungan ? `${userData.jumlahTanggungan} Orang` : '-')}

                {Number(userData?.jumlahTanggungan) > 0 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.subTitle}>Data Anak Pertama</Text>
                    {renderInfoRow("Nama Anak ke-1", userData?.anakPertama?.nama)}
                    {renderInfoRow("Tempat, Tgl Lahir", `${userData?.anakPertama?.tempatLahir || '-'}, ${userData?.anakPertama?.tanggalLahir || '-'}`)}
                  </>
                )}

                {Number(userData?.jumlahTanggungan) > 1 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.subTitle}>Data Anak Kedua</Text>
                    {renderInfoRow("Nama Anak ke-2", userData?.anakKedua?.nama)}
                    {renderInfoRow("Tempat, Tgl Lahir", `${userData?.anakKedua?.tempatLahir || '-'}, ${userData?.anakKedua?.tanggalLahir || '-'}`)}
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#fff" size={20} />
          <Text style={styles.logoutText}>Keluar dari Aplikasi (Logout)</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#2563eb' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, elevation: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginLeft: 10 },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: '#64748b', flex: 1, paddingRight: 10 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f1f5f9', my: 12 },
  subTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', padding: 16, borderRadius: 16, marginTop: 10 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
