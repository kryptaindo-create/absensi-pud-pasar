import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Bell, Send, User, Calendar, MapPin, 
  Search, ShieldCheck, Clock, Download, Trash2, Edit3,
  CheckCircle2, AlertTriangle, Paperclip
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export function SptManagement() {
  const [activeSubTab, setActiveSubTab] = useState<'spt' | 'announcements'>('spt');
  const [spts, setSpts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    userId: '', // For SPT and Announcements
    isAllEmployees: true, // For Announcements
    locations: '', // Comma separated for SPT
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    documentUrl: '',
    type: 'ASSIGNMENT'
  });

  useEffect(() => {
    const unsubSpt = onSnapshot(query(collection(db, 'spts'), orderBy('createdAt', 'desc')), (snap) => {
      setSpts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'spts'));

    const unsubAnn = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'announcements'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => { unsubSpt(); unsubAnn(); unsubUsers(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const collectionName = activeSubTab === 'spt' ? 'spts' : 'announcements';
      const data = {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'ACTIVE',
        updatedAt: serverTimestamp()
      };
      
      // Clean up locations string to array if SPT
      if (activeSubTab === 'spt' && data.locations) {
        data.locationList = data.locations.split(',').map((l: string) => l.trim()).filter(Boolean);
      }

      await addDoc(collection(db, collectionName), data);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, activeSubTab);
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      userId: '', 
      isAllEmployees: true,
      locations: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0], 
      documentUrl: '',
      type: activeSubTab === 'spt' ? 'ASSIGNMENT' : 'ANNOUNCEMENT' 
    });
  };

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">5. SPT & Informasi</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Manajemen Penugasan Luar & Pengumuman</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm transition-all">
           <button 
             onClick={() => { setActiveSubTab('spt'); resetForm(); }}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'spt' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             Surat Perintah Tugas
           </button>
           <button 
             onClick={() => { setActiveSubTab('announcements'); resetForm(); }}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'announcements' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             Pengumuman
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Riwayat {activeSubTab === 'spt' ? 'Penugasan' : 'Pengumuman'}</h3>
                  <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                     <Plus className="h-3.5 w-3.5" /> Buat Baru
                  </button>
               </div>
               <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
                  {(activeSubTab === 'spt' ? spts : announcements).map((item) => (
                    <div key={item.id} className="p-6 hover:bg-slate-50 transition-all group">
                       <div className="flex items-start justify-between">
                          <div className="flex gap-5">
                             <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${activeSubTab === 'spt' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                {activeSubTab === 'spt' ? <FileText className="h-7 w-7" /> : <Bell className="h-7 w-7" />}
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                                   {item.documentUrl && (
                                     <a href={item.documentUrl} target="_blank" className="p-1 px-2 rounded-lg bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Paperclip className="h-3 w-3" /> Berkas
                                     </a>
                                   )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3 max-w-xl">{item.description}</p>
                                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                      <User className="h-3.5 w-3.5 text-slate-300" /> 
                                      <span className="uppercase">{item.isAllEmployees ? 'Semua Pegawai' : (users.find(u => u.id === item.userId)?.name || 'Pegawai Tertentu')}</span>
                                   </div>
                                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                      <Calendar className="h-3.5 w-3.5 text-slate-300" /> 
                                      <span className="uppercase">
                                         {activeSubTab === 'spt' ? `${item.startDate} — ${item.endDate}` : item.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                      </span>
                                   </div>
                                   {activeSubTab === 'spt' && item.locationList && (
                                     <div className="flex items-center gap-2 text-[9px] font-bold text-blue-500">
                                        <MapPin className="h-3.5 w-3.5 text-blue-300" /> 
                                        <div className="flex flex-wrap gap-1">
                                           {item.locationList.map((loc: string, idx: number) => (
                                             <span key={idx} className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">{loc}</span>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"><Edit3 className="h-4 w-4" /></button>
                             <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="h-4 w-4" /></button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {(activeSubTab === 'spt' ? spts : announcements).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                       <FileText className="h-12 w-12 text-slate-100 mb-4" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Belum ada riwayat tercatat</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Panel */}
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <ShieldCheck className="h-5 w-5 text-blue-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Intelligent Routing</h3>
                  </div>
                  <div className="space-y-6">
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Status Geofence SPT</p>
                        <div className="flex items-center justify-between">
                           <span className="text-xl font-black text-white">AKTIF</span>
                           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                     </div>
                     <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-[10px] text-blue-300 leading-relaxed font-medium uppercase tracking-tight">
                        Sistem mendeteksi penugasan SPT secara otomatis. Pegawai yang berada di lokasi SPT tidak akan dianggap "Di Luar Area" meskipun jauh dari unit kerja asalnya.
                     </div>
                  </div>
               </div>
               <FileText className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-5 w-5 text-purple-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Push Notifications</h4>
               </div>
               <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight">
                  Setiap SPT atau Pengumuman yang dipublikasikan akan langsung muncul di dashboard aplikasi pegawai secara real-time.
               </p>
            </div>
         </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden"
             >
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-2xl ${activeSubTab === 'spt' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                            {activeSubTab === 'spt' ? <FileText className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                         </div>
                         <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900"> {activeSubTab === 'spt' ? 'Buat SPT Digital' : 'Publikasi Pengumuman'}</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lengkapi detail informasi di bawah ini</p>
                         </div>
                      </div>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                         <Plus className="h-8 w-8 rotate-45" />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Judul / Perihal</label>
                            <input 
                              required
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                              placeholder={activeSubTab === 'spt' ? "Contoh: Penugasan Ke Dinas Kebersihan" : "Judul Pengumuman"}
                              value={formData.title}
                              onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Deskripsi Lengkap</label>
                            <textarea 
                              required
                              className="w-full h-44 rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold resize-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                              placeholder="Tuliskan detail instruksi atau pengumuman di sini..."
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="space-y-6">
                         {/* Targeting */}
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Penerima / Target</label>
                            <div className="flex gap-2 mb-3">
                               <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, isAllEmployees: true, userId: ''})}
                                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.isAllEmployees ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                               >
                                  Semua
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, isAllEmployees: false})}
                                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${!formData.isAllEmployees ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                               >
                                  Spesifik
                               </button>
                            </div>
                            {!formData.isAllEmployees && (
                              <select 
                                required
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold outline-none"
                                value={formData.userId}
                                onChange={e => setFormData({...formData, userId: e.target.value})}
                              >
                                <option value="">Pilih Pegawai...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.nipp})</option>)}
                              </select>
                            )}
                         </div>

                         {activeSubTab === 'spt' ? (
                           <>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tujuan (Pisahkan dengan koma)</label>
                                 <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <input 
                                      required
                                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-6 text-xs font-bold outline-none"
                                      placeholder="Pasar Petisah, Dinas Perkim, ..."
                                      value={formData.locations}
                                      onChange={e => setFormData({...formData, locations: e.target.value})}
                                    />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tgl Mulai</label>
                                    <input 
                                       type="date"
                                       required
                                       className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold outline-none"
                                       value={formData.startDate}
                                       onChange={e => setFormData({...formData, startDate: e.target.value})}
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tgl Selesai</label>
                                    <input 
                                       type="date"
                                       required
                                       className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold outline-none"
                                       value={formData.endDate}
                                       onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    />
                                 </div>
                              </div>
                           </>
                         ) : (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tgl Kedaluwarsa (Opsional)</label>
                              <input 
                                 type="date"
                                 className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold outline-none"
                                 value={formData.endDate}
                                 onChange={e => setFormData({...formData, endDate: e.target.value})}
                              />
                           </div>
                         )}

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Link Dokumen (Opsional)</label>
                            <div className="relative">
                               <Paperclip className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                               <input 
                                 className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-6 text-xs font-bold outline-none"
                                 placeholder="https://drive.google.com/..."
                                 value={formData.documentUrl}
                                 onChange={e => setFormData({...formData, documentUrl: e.target.value})}
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   <button className={`w-full rounded-[1.5rem] py-5 text-xs font-black uppercase text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${activeSubTab === 'spt' ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-purple-600 shadow-purple-200 hover:bg-purple-700'}`}>
                      <Send className="h-5 w-5" /> Publikasikan Penugasan
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

