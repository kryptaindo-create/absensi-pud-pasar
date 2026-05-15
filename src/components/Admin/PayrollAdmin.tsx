import { useState, useEffect } from 'react';
import { 
  Calculator, TrendingDown, DollarSign, Download, Settings, 
  ChevronRight, Search, Plus, User, FileText, Ban, CheckCircle2,
  AlertCircle, Wallet, Briefcase, Heart, PieChart as ChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

export function PayrollManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return unsub;
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.nipp?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">11. Payroll Gaji</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Pengelolaan Gaji & Tunjangan Pegawai</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari NIPP/Nama..."
                className="rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 w-64"
              />
           </div>
           <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-[10px] font-black uppercase text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all tracking-widest">
             <Calculator className="h-4 w-4" /> Hitung Masal
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Side: Summary & Table */}
         <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">Total Distribusi Gaji</p>
                    <h3 className="mt-4 text-4xl font-black tracking-tight">{formatIDR(942500000)}</h3>
                    <div className="mt-8 flex items-center gap-2 text-[9px] font-black text-blue-400 bg-blue-400/10 w-fit px-3 py-1 rounded-lg border border-blue-400/20 uppercase">
                       Periode 25 Mei 2024
                    </div>
                  </div>
                  <DollarSign className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
               </div>

               <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Potongan Disiplin</p>
                    <h3 className="mt-4 text-4xl font-black text-red-600 tracking-tight">{formatIDR(4250000)}</h3>
                    <div className="mt-8 flex items-center gap-2 text-[9px] font-black text-red-500 bg-red-50 w-fit px-3 py-1 rounded-lg border border-red-100 uppercase">
                       <TrendingDown className="h-3 w-3 mr-1" /> Rekap harian otomatis
                    </div>
                  </div>
                  <Ban className="absolute -right-8 -bottom-8 h-40 w-40 text-slate-50 rotate-12 group-hover:scale-110 transition-transform" />
               </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Daftar Gaji Real-Time</h3>
                  <div className="flex gap-2">
                     <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"><Download className="h-4 w-4" /></button>
                     <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"><Settings className="h-4 w-4" /></button>
                  </div>
               </div>
               <div className="divide-y divide-slate-50">
                  {filteredUsers.map((u, i) => (
                    <div 
                      key={u.id} 
                      onClick={() => setSelectedPayroll(u)}
                      className={`flex items-center justify-between p-6 hover:bg-slate-50 transition-all cursor-pointer group ${selectedPayroll?.id === u.id ? 'bg-blue-50/50' : ''}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center font-black text-slate-300 text-sm shadow-sm group-hover:scale-105 transition-transform uppercase">
                             {u.name?.[0]}
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">NIPP {u.nipp || '-'}</span>
                                <span className="text-blue-500">{u.jabatan || 'STAFF'}</span>
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8 text-right">
                          <div className="hidden sm:block">
                             <p className="text-[13px] font-black text-slate-900 tracking-tight">{formatIDR(u.baseSalary || 4500000)}</p>
                             <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mt-1">SINKRON</p>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <ChevronRight className="h-5 w-5" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right Side: Configuration & Details */}
         <div className="space-y-8">
            <AnimatePresence mode="wait">
               {selectedPayroll ? (
                  <motion.div 
                     key="details"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden sticky top-8"
                  >
                     <div className="p-8 bg-slate-900 text-white">
                        <div className="flex items-center justify-between mb-8">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Rincian Payroll</span>
                           <button onClick={() => setSelectedPayroll(null)} className="text-slate-500 hover:text-white"><Plus className="h-5 w-5 rotate-45" /></button>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight">{selectedPayroll.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Jabatan: {selectedPayroll.jabatan}</p>
                        
                        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                           <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Take Home Pay</div>
                           <div className="text-2xl font-black text-blue-400">{formatIDR((selectedPayroll.baseSalary || 4500000) + 1250000 - 150000)}</div>
                        </div>
                     </div>

                     <div className="p-8 space-y-6">
                        {/* Allowances */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Penambah (Tunjangan)</h5>
                           </div>
                           {[
                             { label: 'Gaji Pokok', value: selectedPayroll.baseSalary || 4500000 },
                             { label: 'Tunjangan Transport', value: 500000 },
                             { label: 'Tunjangan Makan', value: 750000 },
                           ].map(item => (
                             <div key={item.label} className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                                <span className="font-black text-slate-900">{formatIDR(item.value)}</span>
                             </div>
                           ))}
                        </div>

                        {/* Deductions */}
                        <div className="space-y-4 pt-4">
                           <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Pengurang (Potongan)</h5>
                           </div>
                           {[
                             { label: 'BPJS Kesehatan', value: 100000 },
                             { label: 'PPN / Pajak', value: 50000 },
                             { label: 'Potongan Telat', value: 0 },
                           ].map(item => (
                             <div key={item.label} className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                                <span className="font-black text-red-600">-{formatIDR(item.value)}</span>
                             </div>
                           ))}
                        </div>

                        <button className="w-full mt-8 rounded-2xl bg-slate-900 py-3.5 text-[10px] font-black uppercase text-white tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                           <CheckCircle2 className="h-4 w-4" /> Approve Payroll
                        </button>
                        <button className="w-full rounded-2xl border border-slate-200 py-3.5 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-slate-50 transition-all">
                           Unduh Slip Gaji (PDF)
                        </button>
                     </div>
                  </motion.div>
               ) : (
                  <motion.div 
                     key="config"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-8"
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                           <Settings className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Konfigurasi Gaji</h3>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Formula & Aturan Global</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Potongan Alpa</p>
                           <p className="text-xl font-black text-slate-900 leading-none">Rp75.000 / Hari</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Maks. Tunj. Makan</p>
                           <p className="text-xl font-black text-slate-900 leading-none">Rp800.000 / Bulan</p>
                        </div>
                     </div>

                     <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 overflow-hidden relative group">
                        <div className="relative z-10">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Gaji Bulan Ini</h4>
                           <p className="text-4xl font-black tracking-tighter">Rp942.5jt</p>
                           <p className="text-[9px] font-bold text-blue-100 mt-2 uppercase tracking-widest">Semua unit pasar & pusat</p>
                        </div>
                        <ChartIcon className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform" />
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
