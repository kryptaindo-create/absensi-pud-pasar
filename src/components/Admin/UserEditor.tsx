import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2, User, Briefcase, Heart, ShieldAlert, FileText, MapPin } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, updateDoc, collection, addDoc, onSnapshot } from 'firebase/firestore';

interface UserEditorProps {
  user: any;
  onClose: () => void;
}

export function UserEditor({ user, onClose }: UserEditorProps) {
  const [formData, setFormData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const isNew = !user.id;
  const isDemoMode = !auth.currentUser;

  useEffect(() => {
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snap) => {
      const locs = snap.docs.map(doc => doc.data().name).filter(Boolean);
      setAvailableLocations(locs.length > 0 ? locs : ['Pusat', 'Unit Petisah', 'Unit Central', 'Unit Aksara', 'Cabang 1', 'Cabang 2', 'Cabang 3']);
    });
    const unsubShifts = onSnapshot(collection(db, 'shifts'), (snap) => {
      setAvailableShifts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubLocs();
      unsubShifts();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew && !formData.name) {
      alert('Nama wajib diisi');
      return;
    }

    if (!auth.currentUser) {
      alert('Mode demo tidak dapat menyimpan data. Silakan login dengan akun Firebase yang valid.');
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        await addDoc(collection(db, 'users'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: formData.status || 'Active'
        });
      } else {
        const { id, ...updateData } = formData;
        await updateDoc(doc(db, 'users', id), {
          ...updateData,
          updatedAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err) {
      alert('Gagal menyimpan data. Pastikan Anda login dengan akun yang memiliki izin Firebase.');
      handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, isNew ? 'users' : `users/${user.id}`);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field: string, defaultValue: any) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] || []), defaultValue]
    });
  };

  const removeItem = (field: string, index: number) => {
    const list = [...(formData[field] || [])];
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  const updateItem = (field: string, index: number, key: string, value: any) => {
    const list = [...(formData[field] || [])];
    list[index] = { ...list[index], [key]: value };
    setFormData({ ...formData, [field]: list });
  };

  const addChild = () => {
    setFormData({
      ...formData,
      children: [...(formData.children || []), { name: '', pob: '', dob: '' }]
    });
  };

  const computeAge = (dob: string | undefined) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{isNew ? 'Tambah Pegawai Baru' : 'Edit Detail Pegawai'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {isNew ? 'Masukkan Informasi Dasar Pegawai' : `${user.name} • ${user.nipp || 'TANPA NIPP'}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-12">
          {isDemoMode && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Anda sedang menggunakan demo mode. Simpan data hanya dapat dilakukan setelah login Firebase dengan akun yang memiliki izin.
            </div>
          )}
          {/* Section: Identitas */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
               <User className="h-4 w-4 text-blue-600" />
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Identitas Diri</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                 <input 
                   required
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                   value={formData.name || ''}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Contoh: Budi Santoso"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                 <input 
                   type="email"
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                   value={formData.email || ''}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   placeholder="budi@example.com"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempat Lahir</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                   value={formData.pob || ''}
                   onChange={(e) => setFormData({...formData, pob: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                 <input 
                   type="date"
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.dob || ''}
                   onChange={(e) => setFormData({...formData, dob: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.gender || ''}
                   onChange={(e) => setFormData({...formData, gender: e.target.value})}
                 >
                   <option value="">Pilih</option>
                   <option value="Laki-laki">Laki-laki</option>
                   <option value="Perempuan">Perempuan</option>
                 </select>
               </div>
               <div className="col-span-1 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.address || ''}
                   onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agama</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.religion || ''}
                   onChange={(e) => setFormData({...formData, religion: e.target.value})}
                 />
               </div>
            </div>
          </section>

          {/* Section: Pekerjaan */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
               <Briefcase className="h-4 w-4 text-blue-600" />
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Kepegawaian</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Akun</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                   value={formData.role || 'Employee'}
                   onChange={(e) => setFormData({...formData, role: e.target.value})}
                 >
                   <option value="Employee">Pegawai (Standard)</option>
                   <option value="Admin">Admin Unit</option>
                   <option value="MasterAdmin">Master Admin</option>
                   <option value="SuperMaster">Super Master</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIPP</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.nipp || ''}
                   onChange={(e) => setFormData({...formData, nipp: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Gaji</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.nomorGaji || ''}
                   onChange={(e) => setFormData({...formData, nomorGaji: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Golongan</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.golongan || ''}
                   onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                 >
                   <option value="">Pilih Golongan</option>
                   {['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'].map(g => (
                     <option key={g} value={g}>{g}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.jabatan || ''}
                   onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                 >
                   <option value="">Pilih Jabatan</option>
                   {[
                     'Staff', 'Operator', 'Pengutip', 'Kepala Pasar', 'Wakil Kepala Pasar', 
                     'Kaur Pendapatan', 'Kasubag', 'Kabag', 'Kepala SPI', 'Staff Direksi', 
                     'Penyetor Uang', 'Kepala Cabang 1', 'Kepala Cabang 2', 'Kepala Cabang 3'
                   ].map(j => (
                     <option key={j} value={j}>{j}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Pegawai</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.statusPegawai || ''}
                   onChange={(e) => setFormData({...formData, statusPegawai: e.target.value})}
                 >
                   <option value="">Pilih</option>
                   <option value="PHL">PHL</option>
                   <option value="HONOR">HONOR</option>
                   <option value="CAPEG (Calon Pegawai)">CAPEG (Calon Pegawai)</option>
                   <option value="Pegawai Tetap">Pegawai Tetap</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Marital</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.maritalStatus || ''}
                     onChange={(e) => {
                       const value = e.target.value;
                       setFormData({
                         ...formData,
                         maritalStatus: value,
                         spouseName: value === 'Menikah' ? formData.spouseName : '',
                         spouseDob: value === 'Menikah' ? formData.spouseDob : '',
                         children: value === 'Menikah' ? formData.children : []
                       });
                     }}
                 >
                   <option value="">Pilih Status</option>
                   <option value="Lajang">Lajang</option>
                   <option value="Menikah">Menikah</option>
                   <option value="Duda/Janda">Duda/Janda</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Masuk</label>
                 <input 
                   type="date"
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.tanggalMasuk || ''}
                   onChange={(e) => setFormData({...formData, tanggalMasuk: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. SK Pengangkatan</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.nomorSk || ''}
                   onChange={(e) => setFormData({...formData, nomorSk: e.target.value})}
                   placeholder="Contoh: 123/SK/2026"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl SK Pengangkatan</label>
                 <input 
                   type="date"
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.tanggalSk || ''}
                   onChange={(e) => setFormData({...formData, tanggalSk: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Cuti</label>
                 <input 
                   type="number"
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.sisaCuti || 0}
                   onChange={(e) => setFormData({...formData, sisaCuti: parseInt(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempat Tugas</label>
                 <input 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.tempatTugas || ''}
                   onChange={(e) => setFormData({...formData, tempatTugas: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Kerja</label>
                 <select 
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                   value={formData.shiftId || ''}
                   onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
                 >
                   <option value="">Default (Sesuai Unit)</option>
                   {availableShifts.map(s => (
                     <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                   ))}
                 </select>
               </div>
            </div>
          </section>

          {/* Section: Keluarga */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
               <div className="flex items-center gap-3">
                 <Heart className="h-4 w-4 text-red-500" />
                 <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Data Keluarga</h4>
               </div>
               {formData.maritalStatus === 'Menikah' && (
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Pasangan</label>
                       <input 
                         className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                         value={formData.spouseName || ''}
                         onChange={(e) => setFormData({...formData, spouseName: e.target.value})}
                         placeholder="Nama istri / suami"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir Pasangan</label>
                       <input 
                         type="date"
                         className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                         value={formData.spouseDob || ''}
                         onChange={(e) => setFormData({...formData, spouseDob: e.target.value})}
                       />
                     </div>
                   </div>

                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                     Jumlah Tanggungan Anak (&lt;= 21 tahun): {((formData.children || [])
                       .map((child: any) => computeAge(child.dob))
                       .filter((age: number | null) => age !== null && age <= 21)
                       .length)}
                   </div>

                   <div className="flex items-center justify-between">
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Anak</div>
                     <button
                       type="button"
                       onClick={addChild}
                       className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                     >
                       <Plus className="h-3 w-3" /> Tambah Anak
                     </button>
                   </div>

                   <div className="space-y-4">
                     {(formData.children || []).map((child: any, idx: number) => {
                       const age = computeAge(child.dob);
                       const isEligible = age !== null && age <= 21;
                       return (
                         <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-2xl bg-white border border-slate-200">
                           <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Anak ke-{idx + 1}</label>
                             <input
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                               value={child.name || ''}
                               onChange={(e) => updateItem('children', idx, 'name', e.target.value)}
                               placeholder="Nama lengkap"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tempat Lahir</label>
                             <input
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                               value={child.pob || ''}
                               onChange={(e) => updateItem('children', idx, 'pob', e.target.value)}
                               placeholder="Tempat lahir"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                             <input
                               type="date"
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold"
                               value={child.dob || ''}
                               onChange={(e) => updateItem('children', idx, 'dob', e.target.value)}
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Umur</label>
                             <div className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-600">
                               {age === null ? '-' : `${age} tahun`}
                             </div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tunjangan</label>
                             <div className={`rounded-xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest ${isEligible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                               {isEligible ? 'Menerima' : 'Tidak masuk'}
                             </div>
                           </div>
                           <button
                             type="button"
                             onClick={() => removeItem('children', idx)}
                             className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                             title="Hapus anak"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                       );
                     })}
                     {(formData.children || []).length === 0 && (
                       <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500">
                         Tambahkan data anak untuk menghitung jumlah tanggungan secara otomatis.
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {formData.maritalStatus !== 'Menikah' && (
                 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500">
                   Pilih status <strong>Menikah</strong> untuk menambahkan data pasangan dan anak.
                 </div>
               )}
             </div>
          </section>

          {/* Section: SK & Disiplin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <section className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                   <div className="flex items-center gap-3">
                     <FileText className="h-4 w-4 text-slate-600" />
                     <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Riwayat SK</h4>
                   </div>
                   <button 
                     type="button"
                     onClick={() => addItem('skPengangkatan', { number: '', date: '' })}
                     className="text-[9px] font-bold text-blue-600 uppercase tracking-wider"
                   >
                     + Tambah SK
                   </button>
                </div>
                <div className="space-y-3">
                   {formData.skPengangkatan?.map((sk: any, i: number) => (
                     <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <input 
                          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-[10px] font-semibold"
                          value={sk.number}
                          placeholder="Nomor SK"
                          onChange={(e) => updateItem('skPengangkatan', i, 'number', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <input 
                            type="date"
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-[10px] font-semibold"
                            value={sk.date}
                            onChange={(e) => updateItem('skPengangkatan', i, 'date', e.target.value)}
                          />
                          <button onClick={() => removeItem('skPengangkatan', i)} className="p-1.5 text-slate-300 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             <section className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                   <div className="flex items-center gap-3">
                     <ShieldAlert className="h-4 w-4 text-amber-500" />
                     <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Peringatan/SP</h4>
                   </div>
                   <div className="flex gap-4">
                     <button type="button" onClick={() => addItem('warnings', { level: 1, cause: '', date: '' })} className="text-[8px] font-bold text-amber-600 uppercase">+ Peringatan</button>
                     <button type="button" onClick={() => addItem('sp', { level: 1, cause: '', date: '' })} className="text-[8px] font-bold text-red-600 uppercase">+ SP</button>
                   </div>
                </div>
                <div className="space-y-3">
                   {/* Warnings */}
                   {formData.warnings?.map((w: any, i: number) => (
                     <div key={`w-${i}`} className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <select className="bg-transparent text-[10px] font-bold text-amber-700 outline-none" value={w.level} onChange={(e) => updateItem('warnings', i, 'level', parseInt(e.target.value))}>
                            <option value="1">Peringatan 1</option>
                            <option value="2">Peringatan 2</option>
                            <option value="3">Peringatan 3</option>
                          </select>
                          <button onClick={() => removeItem('warnings', i)} className="text-amber-300 hover:text-amber-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <textarea className="w-full rounded-lg border border-amber-200 bg-white p-2 text-[10px]" placeholder="Sebab Peringatan" value={w.cause} onChange={(e) => updateItem('warnings', i, 'cause', e.target.value)} />
                     </div>
                   ))}
                   {/* SPs */}
                   {formData.sp?.map((s: any, i: number) => (
                     <div key={`s-${i}`} className="p-3 rounded-xl bg-red-50 border border-red-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <select className="bg-transparent text-[10px] font-bold text-red-700 outline-none" value={s.level} onChange={(e) => updateItem('sp', i, 'level', parseInt(e.target.value))}>
                            <option value="1">SP 1</option>
                            <option value="2">SP 2</option>
                            <option value="3">SP 3</option>
                          </select>
                          <button onClick={() => removeItem('sp', i)} className="text-red-300 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <textarea className="w-full rounded-lg border border-red-200 bg-white p-2 text-[10px]" placeholder="Sebab SP" value={s.cause} onChange={(e) => updateItem('sp', i, 'cause', e.target.value)} />
                     </div>
                   ))}
                </div>
             </section>
          </div>

          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
               <MapPin className="h-4 w-4 text-blue-600" />
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Lokasi Absensi</h4>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-[10px] text-slate-500 text-center">
               Untuk mengedit lokasi absensi, tambahkan unit pasar atau cabang ke dalam daftar lokasi yang diizinkan untuk NIPP ini.
               <div className="mt-4 flex flex-wrap gap-2 justify-center not-italic">
                  {availableLocations.map(loc => {
                    const isSelected = (formData.attendanceLocations || []).includes(loc);
                    return (
                      <button 
                        key={loc}
                        type="button"
                        onClick={() => {
                          const current = formData.attendanceLocations || [];
                          if (isSelected) setFormData({...formData, attendanceLocations: current.filter((l: string) => l !== loc)});
                          else setFormData({...formData, attendanceLocations: [...current, loc]});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 shadow-sm'}`}
                      >
                        {loc}
                      </button>
                    )
                  })}
               </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
             <button 
               type="button"
               disabled={loading}
               onClick={onClose}
               className="px-8 py-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
             >
               Batal
             </button>
             <button 
               type="submit"
               disabled={loading || isDemoMode}
               className="px-10 py-3 rounded-xl bg-blue-600 text-[11px] font-bold text-white uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:cursor-not-allowed disabled:bg-slate-400 flex items-center gap-2"
             >
               <Save className="h-3.5 w-3.5" />
               {loading ? 'Menyimpan...' : 'Simpan Data'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
