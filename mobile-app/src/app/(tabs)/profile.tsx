import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { LogOut, User as UserIcon, Briefcase, FileText, Heart, MapPin, Calendar, Camera } from 'lucide-react-native';
import { auth, db, storage } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal membuka galeri.");
    }
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) return;
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileRef = ref(storage, `profiles/${auth.currentUser.uid}.jpg`);
      await uploadBytes(fileRef, blob);
      
      const downloadURL = await getDownloadURL(fileRef);
      
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      if (userData?.id) {
        await updateDoc(doc(db, 'users', userData.id), { photoURL: downloadURL });
      }
      
      setUserData({ ...userData, photoURL: downloadURL });
      Alert.alert("Sukses", "Foto profil berhasil diperbarui!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Gagal", "Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploadingImage(false);
    }
  };

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
        <View style={styles.profileImageContainer}>
          {userData?.photoURL || auth.currentUser?.photoURL ? (
            <Image 
              source={{ uri: userData?.photoURL || auth.currentUser?.photoURL || '' }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <UserIcon color="#94a3b8" size={40} />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editImageBtn} 
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Camera color="#fff" size={16} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{userData?.name || auth.currentUser?.displayName || 'Karyawan'}</Text>
        <Text style={styles.headerSubtitle}>{userData?.nipp || userData?.jabatan || 'PUD Pasar Kota Medan'}</Text>
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
  header: { padding: 24, paddingTop: 60, backgroundColor: '#2563eb', alignItems: 'center' },
  profileImageContainer: { position: 'relative', marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  editImageBtn: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#10b981', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSubtitle: { fontSize: 14, fontWeight: '500', color: '#bfdbfe', marginTop: 4 },
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
