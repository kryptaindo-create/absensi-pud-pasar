import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BellRing, AlertTriangle, Info, MailOpen } from 'lucide-react-native';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function InboxScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Menarik pesan khusus untuk User ID ini, atau pesan global (userId == 'ALL')
    const q = query(
      collection(db, 'inbox'),
      where('userId', 'in', [auth.currentUser.uid, 'ALL']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil pesan:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}><AlertTriangle color="#ef4444" size={24} /></View>;
      case 'INFO':
        return <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}><Info color="#10b981" size={24} /></View>;
      default:
        return <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}><BellRing color="#3b82f6" size={24} /></View>;
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.messageCard, !item.isRead && styles.unreadCard]}>
      {renderIcon(item.type)}
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageTitle}>{item.title}</Text>
          {/* Format Waktu Sederhana */}
          <Text style={styles.timeText}>Baru saja</Text>
        </View>
        <Text style={styles.messageBody} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesan & Notifikasi</Text>
        <Text style={styles.headerSubtitle}>Surat Peringatan & Informasi Kerja</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <MailOpen color="#cbd5e1" size={64} />
          <Text style={styles.emptyText}>Belum ada pesan untuk Anda</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8', fontWeight: '600' },
  listContainer: { padding: 16 },
  messageCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  unreadCard: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  messageTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  messageBody: { fontSize: 13, color: '#475569', lineHeight: 18 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6', marginLeft: 12 }
});
