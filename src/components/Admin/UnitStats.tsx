import { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, Users, MapPin, 
  Calendar, Filter, Download, Info, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight, PieChart as ChartIcon
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { motion } from 'framer-motion';

export function UnitStats() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState('ALL');

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const unsubA = onSnapshot(collection(db, 'attendance'), (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'attendance'));

    const unsubU = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    const unsubL = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'locations'));

    return () => { unsubA(); unsubU(); unsubL(); };
  }, []);

  // Calculate stats by unit
  const unitStats = locations.map(loc => {
    const unitUsers = users.filter(u => u.tempatTugas === loc.name);
    const unitAttendance = attendance.filter(a => unitUsers.some(u => u.id === a.userId));
    const presentCount = unitAttendance.filter(a => a.status === 'HADIR').length;
    
    return {
      name: loc.name,
      total: unitUsers.length || 0,
      present: presentCount,
      absent: (unitUsers.length || 0) - presentCount,
      percentage: unitUsers.length ? Math.round((presentCount / unitUsers.length) * 100) : 0
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const displayStats = selectedUnit === 'ALL' 
    ? unitStats 
    : unitStats.filter(u => u.name === selectedUnit);

  const filteredUsers = selectedUnit === 'ALL'
    ? users
    : users.filter(u => u.tempatTugas === selectedUnit);

  const filteredAttendance = selectedUnit === 'ALL'
    ? attendance
    : attendance.filter(a => filteredUsers.some(u => u.id === a.userId));

  const COLORS = ['#2563eb', '#ef4444', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">4. Statistik Unit Kerja</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Analisis Kedisiplinan & Produktivitas per Unit</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <select 
             value={selectedUnit}
             onChange={(e) => setSelectedUnit(e.target.value)}
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
           >
              <option value="ALL">Semua Unit</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
           </select>
           <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Calendar className="h-4 w-4" /> Mei 2024
           </button>
           <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Download className="h-4 w-4" /> Cetak PDF
           </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Chart Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Kedisiplinan per Unit (%)</h3>
                  <BarChart2 className="h-4 w-4 text-slate-300" />
               </div>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={displayStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                           cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* List Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Rank Unit Paling Disiplin</h3>
               </div>
               <div className="divide-y divide-slate-50">
                  {displayStats.map((u, i) => (
                    <div key={u.name} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                       <div className="flex items-center gap-6">
                          <span className="text-xl font-black text-slate-200 group-hover:text-blue-600 transition-colors">0{i + 1}</span>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.total} Pegawai Terdaftar</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="text-right">
                             <p className="text-[14px] font-black text-slate-900">{u.percentage}%</p>
                             <div className="mt-1 h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${u.percentage}%` }} />
                             </div>
                          </div>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${u.percentage > 80 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                             {u.percentage > 80 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar stats */}
         <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
                    Statistik {selectedUnit === 'ALL' ? 'Kehadiran Global' : `Unit ${selectedUnit}`}
                  </h3>
                  <div className="h-[200px] w-full mb-10">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={[
                                { name: 'Hadir', value: filteredAttendance.filter(a => a.status === 'HADIR').length },
                                { name: 'Alpa', value: filteredUsers.length - filteredAttendance.filter(a => a.status === 'HADIR').length },
                              ]}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                           >
                              {COLORS.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute top-[138px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <p className="text-xl font-black">
                           {Math.round((filteredAttendance.filter(a => a.status === 'HADIR').length / (filteredUsers.length || 1)) * 100)}%
                        </p>
                        <p className="text-[8px] font-black uppercase text-slate-500">{selectedUnit === 'ALL' ? 'Global' : 'Unit'}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-slate-500 flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-blue-600" /> Hadir
                        </span>
                        <span>{filteredAttendance.filter(a => a.status === 'HADIR').length} Pegawai</span>
                     </div>
                     <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-slate-500 flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-red-600" /> Belum Absen
                        </span>
                        <span>{filteredUsers.length - filteredAttendance.filter(a => a.status === 'HADIR').length} Pegawai</span>
                     </div>
                  </div>
               </div>
               <Activity className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>

            <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
               <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-indigo-900 leading-relaxed uppercase tracking-tight">
                  Unit <span className="font-black">PASAR PUSAT</span> mengalami penurunan kedisiplinan sebesar 4% dibandingkan minggu lalu.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
