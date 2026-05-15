import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, Edit3, Timer, 
  Settings, Save, X, Calendar, AlertCircle,
  CheckCircle2, Coffee, Moon, Sun
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function ShiftManagement() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    lateTolerance: '15',
    type: 'REGULAR'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'shifts'), (snap) => {
      setShifts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'shifts'));
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await updateDoc(doc(db, 'shifts', editingShift.id), formData);
      } else {
        await addDoc(collection(db, 'shifts'), formData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shifts');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', startTime: '08:00', endTime: '16:00', lateTolerance: '15', type: 'REGULAR' });
    setEditingShift(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus shift ini?')) {
      try {
        await deleteDoc(doc(db, 'shifts', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'shifts');
      }
    }
  };

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">8. Manajemen Shift</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Pengaturan Jam Kerja & Toleransi Keterlambatan</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
        >
           <Plus className="h-4 w-4" /> Tambah Shift
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Shift List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {shifts.map((s) => (
                 <div key={s.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                    <div className="relative z-10">
                       <div className="flex justify-between items-start mb-8">
                          <div className={`p-3 rounded-2xl ${s.type === 'NIGHT' ? 'bg-slate-900 text-white' : 'bg-amber-50 text-amber-600'}`}>
                             {s.type === 'NIGHT' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => { setEditingShift(s); setFormData(s); setIsModalOpen(true); }}
                               className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600"
                             >
                                <Edit3 className="h-4 w-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(s.id)}
                               className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600"
                             >
                                <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                       </div>
                       
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{s.name}</h3>
                       
                       <div className="mt-8 grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Mulai - Selesai</p>
                             <p className="text-xl font-black text-slate-900 tracking-tighter">{s.startTime} - {s.endTime}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Toleransi</p>
                             <p className="text-xl font-black text-blue-600 tracking-tighter">{s.lateTolerance} Menit</p>
                          </div>
                       </div>

                       <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[9px] font-black uppercase tracking-widest">
                             <Clock className="h-3 w-3" /> {s.type}
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {s.id.slice(0, 8)}</span>
                       </div>
                    </div>
                 </div>
               ))}

               {shifts.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum Ada Shift Terdaftar</p>
                 </div>
               )}
            </div>
         </div>

         {/* Sidebar Config info */}
         <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <Settings className="h-5 w-5 text-blue-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Default Global</h3>
                  </div>
                  <div className="space-y-6">
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Toleransi Terlambat Global</p>
                        <p className="text-2xl font-black text-white leading-none">15 Menit</p>
                     </div>
                     <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-600/20 text-[10px] text-blue-300 leading-relaxed font-medium uppercase">
                        Sistem akan memotong gaji otomatis jika pegawai login melewati batas toleransi shift masing-masing.
                     </div>
                  </div>
               </div>
               <Timer className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
         </div>
      </div>

      {/* Shift Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
             >
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{editingShift ? 'Edit Shift' : 'Tambah Shift'}</h3>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                         <X className="h-7 w-7" />
                      </button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Shift</label>
                         <input 
                           required
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                           placeholder="Contoh: Shift Pagi (Pasar Petisah)"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Masuk</label>
                           <input 
                             type="time"
                             required
                             className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                             value={formData.startTime}
                             onChange={e => setFormData({...formData, startTime: e.target.value})}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Pulang</label>
                           <input 
                             type="time"
                             required
                             className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                             value={formData.endTime}
                             onChange={e => setFormData({...formData, endTime: e.target.value})}
                           />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Toleransi Terlambat (Menit)</label>
                         <input 
                           type="number"
                           required
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                           value={formData.lateTolerance}
                           onChange={e => setFormData({...formData, lateTolerance: e.target.value})}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Shift</label>
                         <div className="grid grid-cols-2 gap-3">
                            {['REGULAR', 'NIGHT', 'WEEKEND', 'SPECIFIC'].map(type => (
                               <button 
                                 key={type}
                                 type="button"
                                 onClick={() => setFormData({...formData, type})}
                                 className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                               >
                                  {type}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <button className="w-full rounded-[1.5rem] bg-slate-900 py-5 text-xs font-black uppercase text-white shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                      <Save className="h-5 w-5" /> Simpan Shift
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
