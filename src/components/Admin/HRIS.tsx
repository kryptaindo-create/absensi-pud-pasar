import { useState } from 'react';
import { 
  Database, ShieldAlert, Award, FileText, 
  Search, Plus, ChevronRight, FileCode, Clock,
  Calendar, Hash, User, X, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HRISManagement() {
  const [activeSubTab, setActiveSubTab] = useState('data');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSK, setNewSK] = useState({
    name: '',
    sk: '',
    type: 'Kenaikan Golongan',
    date: new Date().toISOString().split('T')[0]
  });

  const skHistory = [
    { name: 'Suhartono', sk: 'SK/2026/042', type: 'Kenaikan Golongan (C1)', date: '12 Mei 2026', category: 'PROMOTION' },
    { name: 'Diana Putri', sk: 'SK/2026/039', type: 'Pemindahan Unit Kerja', date: '08 Mei 2026', category: 'TRANSFER' },
    { name: 'Eko Wahyudi', sk: 'SP-1/2026/002', type: 'Surat Peringatan 1', date: '05 Mei 2026', warning: true, category: 'WARNING' },
    { name: 'Ahmad Faisal', sk: 'SK/2026/035', type: 'Penyesuaian Gaji Pokok', date: '01 Mei 2026', category: 'ADJUSTMENT' },
    { name: 'Siti Aminah', sk: 'SK/2026/031', type: 'Pengangkatan Karyawan Tetap', date: '25 April 2026', category: 'PROMOTION' },
  ];

  const tabs = [
    { id: 'data', label: 'Data Master', icon: Database },
    { id: 'sk_sp', label: 'SK & SP', icon: ShieldAlert },
    { id: 'contracts', label: 'Kontrak PHL', icon: FileText },
    { id: 'promotion', label: 'Golongan', icon: Award },
  ];

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Admin HRIS</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Sistem Informasi Sumber Daya Manusia</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 transition-all uppercase tracking-widest"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Data SK
        </button>
      </div>

      {/* Internal Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0 border-b border-slate-200">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveSubTab(tab.id)}
             className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 relative ${
               activeSubTab === tab.id 
               ? 'text-blue-600' 
               : 'text-slate-400 hover:text-slate-600 border-transparent'
             }`}
           >
             <tab.icon className="h-3.5 w-3.5" />
             {tab.label}
             {activeSubTab === tab.id && (
                <motion.div layoutId="subtab-pill" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
             )}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="theme-card p-6 bg-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Riwayat SK Pegawai</h3>
                <Search className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div className="space-y-4">
                 {skHistory.map((item, i) => (
                   <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group gap-6">
                      <div className="flex items-center gap-4">
                         <div className={`h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${item.warning ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            <FileCode className="h-6 w-6" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                               <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${item.warning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {item.type}
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-12">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                               <Hash className="h-3 w-3" /> Nomor SK
                            </p>
                            <p className="text-[10px] font-bold text-slate-700 font-mono tracking-wider">{item.sk}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                               <Calendar className="h-3 w-3" /> Tanggal SK
                            </p>
                            <p className="text-[10px] font-bold text-slate-700">{item.date}</p>
                         </div>
                         <div className="hidden sm:block">
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           {/* Contract Notification Card */}
           <div className="theme-card bg-amber-500 p-6 text-white border-none shadow-amber-500/10">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-50">Habis Kontrak PHL</h3>
                 <Clock className="h-4 w-4 text-amber-200" />
              </div>
              <div className="space-y-4">
                 {[1, 2].map(i => (
                   <div key={i} className="flex items-center gap-3 bg-white/10 rounded-lg p-3.5 border border-white/5">
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs uppercase">R</div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold leading-none truncate">Rian Hidayat</p>
                         <p className="text-[10px] font-medium text-amber-100 uppercase tracking-widest mt-1.5 leading-none">24 Hari Lagi</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="mt-6 w-full rounded-lg bg-white py-2.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:bg-amber-50 transition-all">
                Kelola Kontrak
              </button>
           </div>

           {/* Grades Distribution */}
           <div className="theme-card p-6 bg-white">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-6">Distribusi Golongan</h3>
              <div className="space-y-5">
                 {[
                   { label: 'PHL (A)', val: 42, color: 'bg-blue-600' },
                   { label: 'Honorer (B)', val: 28, color: 'bg-slate-800' },
                   { label: 'Tetap (C)', val: 18, color: 'bg-slate-400' },
                   { label: 'Pejabat (D)', val: 12, color: 'bg-slate-200' },
                 ].map((g) => (
                   <div key={g.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{g.label}</span>
                        <span className="text-[10px] font-bold text-slate-900">{g.val}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${g.val}%` }}
                           className={`h-full ${g.color}`} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

       {/* Add SK Modal */}
       <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 space-y-6">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-blue-600 text-white">
                            <FileCode className="h-6 w-6" />
                         </div>
                         <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 text-left">Input Data SK</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Registrasi Surat Keputusan Pegawai</p>
                         </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                         <X className="h-8 w-8" />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Pilih Pegawai</label>
                         <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <select 
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                              value={newSK.name}
                              onChange={e => setNewSK({...newSK, name: e.target.value})}
                            >
                               <option value="">Pilih Pegawai...</option>
                               <option value="Suhartono">Suhartono</option>
                               <option value="Diana Putri">Diana Putri</option>
                            </select>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nomor SK</label>
                         <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <input 
                              type="text"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                              placeholder="Contoh: SK/2024/001"
                              value={newSK.sk}
                              onChange={e => setNewSK({...newSK, sk: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Jenis Pembaruan</label>
                         <select 
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                           value={newSK.type}
                           onChange={e => setNewSK({...newSK, type: e.target.value})}
                         >
                            <option value="Kenaikan Golongan">Kenaikan Golongan</option>
                            <option value="Pemindahan Unit Kerja">Pemindahan Unit Kerja</option>
                            <option value="Penyesuaian Gaji">Penyesuaian Gaji</option>
                            <option value="Surat Peringatan">Surat Peringatan</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tanggal SK</label>
                         <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <input 
                              type="date"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                              value={newSK.date}
                              onChange={e => setNewSK({...newSK, date: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => setIsModalOpen(false)}
                     className="w-full rounded-2xl bg-blue-600 py-4 text-[10px] font-black uppercase text-white shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                   >
                      <Send className="h-4 w-4" /> Simpan Data SK
                   </button>
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
