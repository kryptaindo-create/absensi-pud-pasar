import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  MapPin, AlertCircle, CheckCircle2, Navigation, Clock, Calendar,
  Search, Filter, ChevronLeft, ChevronRight, FileText, Download,
  UserX, UserCheck, Timer, Coffee, Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AttendanceMonitoring() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [locations, setLocations] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'attendance'), 
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end),
      orderBy('date', 'desc')
    );
    
    const unsubA = onSnapshot(q, (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    const unsubU = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubL = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'locations');
    });

    return () => { unsubA(); unsubU(); unsubL(); };
  }, [dateRange]);

  const filteredData = attendance.filter(a => {
    const user = users.find(u => u.id === a.userId);
    const matchesSearch = user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user?.nipp?.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'LATE') {
      matchesStatus = a.status === 'HADIR' && a.isLate === true;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = a.status === statusFilter;
    }

    const matchesLocation = locationFilter === 'ALL' || user?.tempatTugas === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HADIR': return 'bg-green-50 text-green-600 border-green-100';
      case 'ALPA': return 'bg-red-50 text-red-600 border-red-100';
      case 'IZIN': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'SAKIT': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CUTI': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HADIR': return UserCheck;
      case 'ALPA': return UserX;
      case 'IZIN': return Coffee;
      case 'SAKIT': return Thermometer;
      case 'CUTI': return Calendar;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8">
       {/* Header with Filters */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">3. Data Absensi Karyawan</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Manajemen Monitoring & Rekapitulasi</p>
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                 <Download className="h-4 w-4" /> Export Laporan
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Date Range */}
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Tanggal</label>
              <input 
                 type="date" 
                 value={dateRange.start}
                 onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">S.D Tanggal</label>
              <input 
                 type="date" 
                 value={dateRange.end}
                 onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
              />
           </div>
           {/* Location Filter */}
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Kerja</label>
              <select 
                 value={locationFilter}
                 onChange={(e) => setLocationFilter(e.target.value)}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
              >
                 <option value="ALL">Semua Unit</option>
                 {locations.map(loc => (
                   <option key={loc.id} value={loc.name}>{loc.name}</option>
                 ))}
              </select>
           </div>
           {/* Search */}
           <div className="space-y-2 lg:col-span-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Karyawan / NIPP</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama atau NIPP..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                 />
              </div>
           </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
           {['ALL', 'HADIR', 'LATE', 'IZIN', 'SAKIT', 'CUTI', 'ALPA'].map(status => (
             <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                 statusFilter === status 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                 : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
               }`}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         {[
           { label: 'Hadir', value: attendance.filter(a => a.status === 'HADIR').length, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
           { label: 'Izin', value: attendance.filter(a => a.status === 'IZIN').length, icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Sakit', value: attendance.filter(a => a.status === 'SAKIT').length, icon: Thermometer, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Cuti', value: attendance.filter(a => a.status === 'CUTI').length, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
           { label: 'Alpa', value: attendance.filter(a => a.status === 'ALPA').length, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
         ].map(s => (
           <div key={s.label} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-2.5 rounded-2xl ${s.bg} ${s.color}`}>
                 <s.icon className="h-4 w-4" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">{s.label}</p>
                 <h4 className="text-xl font-black text-slate-900 mt-0.5">{s.value}</h4>
              </div>
           </div>
         ))}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                   <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Pegawai</th>
                   <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tgl & Unit</th>
                   <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Waktu Masuk</th>
                   <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status & Verifikasi</th>
                   <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Koordinat</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredData.map((a, i) => {
                    const user = users.find(u => u.id === a.userId);
                    const StatusIcon = getStatusIcon(a.status);
                    return (
                      <motion.tr 
                        key={a.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/50 transition-all group"
                      >
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-300 shadow-sm group-hover:scale-110 transition-transform">
                                  {user?.name?.[0].toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.name}</p>
                                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">{user?.nipp || 'NIP: -'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <p className="text-[10px] font-black text-slate-700 tracking-wider">{a.date}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[120px]">{user?.tempatTugas || '-'}</p>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                               <Clock className="h-3 w-3 text-blue-500" />
                               <span className="text-[11px] font-black text-slate-900 tracking-wider">
                                  {a.checkIn?.time ? 
                                    (a.checkIn.time instanceof Timestamp ? 
                                      a.checkIn.time.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 
                                      new Date(a.checkIn.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                    ) : '--:--:--'
                                  }
                               </span>
                               {a.status === 'HADIR' && (
                                 <span className={`text-[8px] font-bold px-1 rounded uppercase tracking-widest ${a.isLate ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'}`}>
                                    {a.isLate ? 'Terlambat' : 'Tepat Waktu'}
                                 </span>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-5 space-y-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.1em] ${getStatusColor(a.status)}`}>
                               <StatusIcon className="h-3 w-3" />
                               {a.status}
                            </div>
                            <div className="flex gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Verifikasi Wajah" />
                               <div className="h-1.5 w-1.5 rounded-full bg-slate-200" title="Geofence" />
                            </div>
                         </td>
                         <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 group/coord cursor-pointer">
                               <div className="text-right">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Lat: 3.5952</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Lng: 98.6722</p>
                                </div>
                               <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/coord:bg-blue-600 group-hover/coord:text-white transition-all">
                                  <MapPin className="h-4 w-4" />
                               </div>
                            </div>
                         </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                       <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Tidak Ditemukan</p>
                    </td>
                  </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
