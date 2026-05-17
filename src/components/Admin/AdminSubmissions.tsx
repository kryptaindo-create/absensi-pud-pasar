import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, X, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminSubmissions({ profile }: { profile: any }) {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (sub: any, status: 'APPROVED' | 'REJECTED') => {
    if (profile.role !== 'SuperMaster' && status === 'APPROVED') {
      alert("Hanya Super Master yang memiliki wewenang untuk menyetujui secara mutlak.");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin memberikan status ${status} pada pengajuan ini?`)) {
      try {
        await updateDoc(doc(db, 'submissions', sub.id), {
          status: status,
          processedBy: profile.name,
          processedAt: new Date()
        });

        if (status === 'APPROVED' && (sub.type === 'SAKIT' || sub.type === 'CUTI')) {
          await addDoc(collection(db, 'inbox'), {
            userId: sub.userId,
            type: 'WARNING',
            title: '⚠️ Peringatan Berkas Fisik',
            message: `Pengajuan ${sub.title} Anda telah disetujui. WAJIB menyerahkan/mengupload surat bukti fisik/asli paling lambat 2 HARI setelah tanggal izin berakhir ke bagian Kepegawaian. Jika tidak, izin akan dibatalkan dan dianggap Alpa.`,
            senderId: 'Sistem Kepegawaian PUD Pasar',
            timestamp: serverTimestamp(),
            isRead: false
          });
        }
      } catch (error) {
        console.error(error);
        alert("Gagal memproses pengajuan.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">DISETUJUI</span>;
      case 'REJECTED': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">DITOLAK</span>;
      default: return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> MENUNGGU</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengajuan Karyawan</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Tinjau izin sakit, cuti, dan permohonan lainnya.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {submissions.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada pengajuan masuk.</p>
          </div>
        ) : (
          submissions.map((sub, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={sub.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{sub.userName}</h3>
                  {getStatusBadge(sub.status)}
                </div>
                <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold mb-2">
                  {sub.title}
                </div>
                
                {sub.startDate && sub.endDate && (
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    📅 Tanggal Izin: <span className="text-blue-600">{sub.startDate}</span> s/d <span className="text-blue-600">{sub.endDate}</span>
                  </div>
                )}
                
                {sub.startTime && sub.endTime && (
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    ⏰ Jam Keluar: <span className="text-blue-600">{sub.startTime}</span> s/d <span className="text-blue-600">{sub.endTime}</span>
                  </div>
                )}

                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                  "{sub.description}"
                </p>
                <div className="mt-2 text-xs text-slate-400 font-medium">
                  Dikirim pada: {sub.timestamp?.toDate ? sub.timestamp.toDate().toLocaleString() : 'Baru saja'}
                </div>
                {sub.processedBy && (
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    Diproses oleh: <span className="font-bold">{sub.processedBy}</span>
                  </div>
                )}
              </div>

              {sub.status === 'PENDING' && (
                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <button 
                    onClick={() => handleAction(sub, 'APPROVED')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl font-bold text-sm transition-all"
                  >
                    <Check className="w-4 h-4" /> Setujui
                  </button>
                  <button 
                    onClick={() => handleAction(sub, 'REJECTED')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl font-bold text-sm transition-all"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
