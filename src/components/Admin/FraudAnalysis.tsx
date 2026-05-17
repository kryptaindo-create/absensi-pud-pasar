import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserX, MapPin, Smartphone, Fingerprint,
  Lock, Search, Filter, AlertTriangle, Scale, Hammer,
  ExternalLink, Trash2, Eye, ShieldOff, Clock
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export function FraudAnalysis() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const unsubLogs = onSnapshot(query(collection(db, 'fraudLogs'), orderBy('timestamp', 'desc')), (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.GET, 'fraudLogs'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => { unsubLogs(); unsubUsers(); };
  }, []);

  const getFraudTypeLabel = (type: string) => {
    switch (type) {
      case 'FAKE_GPS': return { label: 'Mock Location / GPS Palsu', icon: MapPin, color: 'text-red-600', bg: 'bg-red-50' };
      case 'ROOTED': return { label: 'Device Rooted / Jailbreak', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'FACE_MISMATCH': return { label: 'Verifikasi Wajah Gagal', icon: UserX, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'GEOFENCE_BYPASS': return { label: 'Manipulasi Geofence', icon: ShieldOff, color: 'text-amber-600', bg: 'bg-amber-50' };
      default: return { label: 'Aktivitas Mencurigakan', icon: ShieldAlert, color: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">6. Analisis Fraud</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Deteksi Kecurangan & Keamanan Perangkat</p>
        </div>
        <div className="flex gap-3">
           {['ALL', 'FAKE_GPS', 'ROOTED', 'FACE_MISMATCH'].map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Summary Panel */}
         <div className="space-y-6">
            <div className="bg-red-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-100 opacity-80">Total Temuan Fraud</p>
                  <h3 className="text-4xl font-black mt-4">{logs.length}</h3>
                  <div className="mt-8 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                     <p className="text-[9px] font-bold text-red-100 uppercase leading-relaxed">
                        Sistem mendeteksi aktivitas anomali yang berpotensi melanggar integritas data absensi.
                     </p>
                  </div>
               </div>
               <ShieldAlert className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Distribusi Kecurangan</h4>
               <div className="space-y-4">
                  {[
                    { label: 'FAKE GPS', count: logs.filter(l => l.type === 'FAKE_GPS').length, color: 'bg-red-500' },
                    { label: 'ROOTED', count: logs.filter(l => l.type === 'ROOTED').length, color: 'bg-orange-500' },
                    { label: 'BIOMETRIC', count: logs.filter(l => l.type === 'FACE_MISMATCH').length, color: 'bg-purple-500' },
                  ].map(stat => (
                    <div key={stat.label} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-slate-500">{stat.label}</span>
                          <span className="text-slate-900">{stat.count}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.color}`} style={{ width: `${(stat.count / (logs.length || 1)) * 100}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Log Table */}
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Papan Pantau Kecurangan (Fraud Log)</h3>
               </div>
               <div className="divide-y divide-slate-50">
                  {logs.filter(l => filter === 'ALL' || l.type === filter).map((log, i) => {
                    const user = users.find(u => u.id === log.userId);
                    const config = getFraudTypeLabel(log.type);
                    return (
                      <div key={log.id} className="p-6 hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-red-500">
                         <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                               <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${config.bg} ${config.color}`}>
                                  <config.icon className="h-6 w-6" />
                               </div>
                               <div>
                                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{config.label}</h4>
                                  <div className="mt-2 flex items-center gap-3">
                                     <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-300">
                                        {user?.name?.[0]}
                                     </div>
                                     <div>
                                        <p className="text-xs font-black text-slate-700 uppercase">{user?.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.nipp}</p>
                                     </div>
                                  </div>
                                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 italic text-[10px] text-slate-500 leading-relaxed max-w-lg">
                                     "{log.description || 'Sistem mendeteksi adanya aplikasi tambahan yang memanipulasi parameter keamanan perangkat saat melakukan absensi.'}"
                                  </div>
                               </div>
                            </div>
                            <div className="text-right space-y-3">
                               <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 text-slate-400">
                                     <Clock className="h-3 w-3" />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{log.timestamp?.toDate().toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">{log.timestamp?.toDate().toLocaleDateString()}</p>
                               </div>
                               <div className="flex gap-2">
                                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                                     <Hammer className="h-3 w-3" /> Tindak
                                  </button>
                                  <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600"><Eye className="h-3.5 w-3.5" /></button>
                               </div>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <div className="p-20 text-center">
                       <AlertTriangle className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Belum Ada Laporan Kecurangan</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
