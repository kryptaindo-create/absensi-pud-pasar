import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { FileText, ChevronRight, X, UploadCloud } from 'lucide-react-native';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const JENIS_PENGAJUAN = [
  { id: 'SAKIT', title: 'Izin Sakit', icon: '🩺' },
  { id: 'CUTI', title: 'Izin Cuti Tahunan', icon: '🌴' },
  { id: 'KELUAR_KANTOR', title: 'Izin Keluar Saat Kerja', icon: '🏃' },
  { id: 'NAIK_GOLONGAN', title: 'Pengajuan Naik Golongan', icon: '📈' },
  { id: 'NAIK_STATUS', title: 'Pengajuan Status Pegawai', icon: '⭐' },
];

export default function SubmissionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [keterangan, setKeterangan] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openForm = (jenis: any) => {
    setSelectedType(jenis);
    setKeterangan('');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setModalVisible(true);
  };

  const submitPengajuan = async () => {
    if (!keterangan.trim()) {
      Alert.alert('Error', 'Mohon isi keterangan pengajuan secara detail.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || auth.currentUser?.email,
        type: selectedType.id,
        title: selectedType.title,
        description: keterangan,
        startDate: startDate || null,
        endDate: endDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        status: 'PENDING', // PENDING, APPROVED, REJECTED
        timestamp: serverTimestamp(),
      });
      
      Alert.alert('Sukses', 'Pengajuan berhasil dikirim ke HR/Admin!');
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengajuan & Izin</Text>
        <Text style={styles.headerSubtitle}>Pilih jenis pengajuan yang ingin Anda buat</Text>
      </View>

      <ScrollView style={styles.listContainer}>
        {JENIS_PENGAJUAN.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => openForm(item)}
          >
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <ChevronRight color="#cbd5e1" size={24} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal Form Pengajuan */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buat Pengajuan</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {selectedType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{selectedType.icon} {selectedType.title}</Text>
              </View>
            )}

            {selectedType && (selectedType.id === 'SAKIT' || selectedType.id === 'CUTI') && (
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.label}>Mulai Tanggal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tgl/Bln/Thn"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.label}>Sampai Tanggal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tgl/Bln/Thn"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            )}

            {selectedType && selectedType.id === 'KELUAR_KANTOR' && (
              <View>
                <Text style={styles.label}>Tanggal Izin Keluar</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tgl/Bln/Thn"
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <View style={styles.row}>
                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Dari Jam</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: 09:00"
                      value={startTime}
                      onChangeText={setStartTime}
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Sampai Jam</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: 12:00"
                      value={endTime}
                      onChangeText={setEndTime}
                    />
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.label}>Keterangan / Alasan Lengkap</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tuliskan alasan pengajuan Anda di sini..."
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              value={keterangan}
              onChangeText={setKeterangan}
            />

            {(!selectedType || selectedType.id !== 'KELUAR_KANTOR') && (
              <View style={styles.uploadBox}>
                <UploadCloud color="#94a3b8" size={32} />
                <Text style={styles.uploadText}>Upload Dokumen (Opsional)</Text>
                <Text style={styles.uploadSubtext}>Misal: Surat Dokter (Batas 2MB)</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={submitPengajuan}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  listContainer: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
  cardIcon: { width: 50, height: 50, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalBody: { padding: 20 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  typeBadgeText: { color: '#2563eb', fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 15, color: '#334155', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  halfCol: { width: '48%' },
  textArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 15, color: '#334155', height: 120, marginBottom: 20 },
  uploadBox: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, padding: 30, alignItems: 'center', marginBottom: 24, backgroundColor: '#f8fafc' },
  uploadText: { marginTop: 12, fontSize: 15, fontWeight: 'bold', color: '#475569' },
  uploadSubtext: { marginTop: 4, fontSize: 12, color: '#94a3b8' },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
