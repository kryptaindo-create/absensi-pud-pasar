import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CheckCircle2, XCircle, Clock, ShieldAlert, User, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ApprovalQueue({ profile }: { profile: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'approval_queue'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleApprove = async (request: any) => {
    if (profile.role !== 'SuperMaster') return;
    
    if (confirm(`Apakah Anda yakin ingin menyetujui request: ${request.actionType} untuk ${request.targetUserName}?`)) {
      try {
        // Update user data (Simulation of Cloud Functions)
        if (request.actionType === 'RESET_DEVICE_BINDING') {
          await updateDoc(doc(db, 'users', request.targetUserId), {
            lockedDeviceId: null,
            faceDescriptor: null // Opsional: reset wajah juga jika diminta
          });
        }

        // Update queue status
        await updateDoc(doc(db, 'approval_queue', request.id), {
          status: 'APPROVED',
          approvedBy: profile.uid,
          approvedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Gagal menyetujui request:", err);
        alert("Gagal memproses persetujuan.");
      }
    }
  };

  const handleReject = async (request: any) => {
    if (profile.role !== 'SuperMaster') return;

    if (confirm(`Tolak request ini?`)) {
      try {
        await updateDoc(doc(db, 'approval_queue', request.id), {
          status: 'REJECTED',
          rejectedBy: profile.uid,
          rejectedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Gagal menolak request:", err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="h-3 w-3" /> Menunggu</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Disetujui</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><XCircle className="h-3 w-3" /> Ditolak</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Antrian Persetujuan</h2>
          <p className="text-sm text-slate-500">Pusat Validasi Keamanan & Perubahan Data (Zero-Trust)</p>
        </div>
      </div>

      <div className="theme-card p-6 bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Tidak ada antrian persetujuan saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold tracking-widest rounded-tl-xl">Karyawan Target</th>
                  <th className="px-4 py-3 font-bold tracking-widest">Jenis Request</th>
                  <th className="px-4 py-3 font-bold tracking-widest">Diminta Oleh</th>
                  <th className="px-4 py-3 font-bold tracking-widest">Status</th>
                  <th className="px-4 py-3 font-bold tracking-widest text-right rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {requests.map((req) => (
                    <motion.tr 
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-900 uppercase">{req.targetUserName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-slate-700">{req.actionType.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-500">
                        {req.requestedByName}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {req.status === 'PENDING' && profile.role === 'SuperMaster' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleReject(req)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Tolak
                            </button>
                            <button 
                              onClick={() => handleApprove(req)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold uppercase tracking-widest shadow-md transition-colors"
                            >
                              Setujui
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Action Needed</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
