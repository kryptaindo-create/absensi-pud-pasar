import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { 
  Users, UserCheck, UserX, MapPin, Activity, TrendingUp, 
  Clock, FileText, Map, Briefcase, Award, Building2,
  Calendar, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export function AdminOverview() {
  const stats = [
    { label: 'Total Pegawai', value: '1,248', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Masuk Hari Ini', value: '1,102', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Izin / Sakit', value: '42', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Cuti Tahunan', value: '18', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Alpa / Mangkir', value: '15', icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Belum Pulang', value: '71', icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Di Luar Area', value: '86', icon: Map, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'SPT Luar', value: '12', icon: Briefcase, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const attendanceData = [
    { name: 'Sen', mas: 1102, izn: 42, cut: 18, alp: 15 },
    { name: 'Sel', mas: 1080, izn: 50, cut: 20, alp: 10 },
    { name: 'Rab', mas: 1120, izn: 35, cut: 15, alp: 20 },
    { name: 'Kam', mas: 1050, izn: 60, cut: 22, alp: 30 },
    { name: 'Jum', mas: 1110, izn: 40, cut: 18, alp: 12 },
  ];

  const rankingEmployees = [
    { name: 'Ahmad Subarjo', unit: 'Unit Petisah', score: 99.8 },
    { name: 'Siti Aminah', unit: 'Pusat', score: 99.5 },
    { name: 'Budi Hartono', unit: 'Unit Central', score: 99.2 },
    { name: 'Rini Sastrowijoyo', unit: 'Unit Aksara', score: 98.9 },
    { name: 'Dedi Kurniawan', unit: 'Cabang 1', score: 98.5 },
  ];

  const rankingUnits = [
    { name: 'Unit Petisah', discipline: '98.5%' },
    { name: 'Unit Central', discipline: '97.2%' },
    { name: 'Kantor Pusat', discipline: '96.8%' },
    { name: 'Unit Aksara', discipline: '95.5%' },
    { name: 'Cabang 2', discipline: '94.8%' },
  ];

  return (
    <div className="space-y-8">
       {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">1. Dashboard Utama</h2>
           <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Pusat Kendali Monitoring Real-Time</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
           <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">Harian</button>
           <button className="px-4 py-2 rounded-lg text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50">Bulanan</button>
           <button className="px-4 py-2 rounded-lg text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50">Custom</button>
        </div>
      </div>

      {/* Grid Status Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {stats.map((s, i) => (
           <motion.div 
             key={s.label}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.05 }}
             className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-2xl ${s.bg} ${s.color}`}>
                   <s.icon className="h-4 w-4" />
                 </div>
                 <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> 2.1%
                 </span>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] opacity-80">{s.label}</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{s.value}</h4>
              <div className="mt-3 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                 <div className={`h-full bg-current ${s.color} opacity-20`} style={{ width: '70%' }}></div>
              </div>
           </motion.div>
         ))}
      </div>

      {/* Charts & Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart */}
         <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Grafik Kehadiran Mingguan</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Pergerakan statisik kehadiran seluruh unit</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-600" /> <span className="text-[9px] font-bold uppercase text-slate-500">Hadir</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-400" /> <span className="text-[9px] font-bold uppercase text-slate-500">Alpa</span></div>
               </div>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} barGap={8}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                       dy={10}
                     />
                     <YAxis hide />
                     <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     />
                     <Bar dataKey="mas" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
                     <Bar dataKey="alp" fill="#f87171" radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Ranking Section */}
         <div className="space-y-6">
            {/* Top Employees */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                  <Award className="h-4 w-4 text-blue-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">5 Rank Karyawan Terdisiplin</h3>
               </div>
               <div className="space-y-4">
                  {rankingEmployees.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {i + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 leading-none truncate">{emp.name}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase">{emp.unit}</p>
                       </div>
                       <div className="text-[10px] font-black text-blue-600">
                          {emp.score}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Top Units */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">5 Rank Unit Terdisiplin</h3>
               </div>
               <div className="space-y-4">
                  {rankingUnits.map((unit, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">
                          {i + 1}
                       </div>
                       <div className="flex-1">
                          <p className="text-[11px] font-bold text-slate-900 leading-none">{unit.name}</p>
                       </div>
                       <div className="text-[10px] font-black text-green-600">
                          {unit.discipline}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

       {/* Geofence Info Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-blue-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm group-hover:scale-110 transition-transform">
                <MapPin className="h-48 w-48" />
             </div>
             <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-100 mb-6">Monitoring Area Kantor</h3>
                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <p className="text-4xl font-black">94%</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mt-1">Pegawai Dalam Kantor</p>
                      <p className="text-[9px] font-medium text-blue-200 mt-2">1,162 Pegawai tepat berada di area geofence unit masing-masing.</p>
                   </div>
                   <div className="border-l border-blue-500 pl-8">
                      <p className="text-4xl font-black">86</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mt-1">Pegawai Di Luar Area</p>
                      <p className="text-[9px] font-medium text-blue-200 mt-2">Termasuk kurir, penyetor uang, dan penugasan lapangan (SPT).</p>
                   </div>
                </div>
                <button className="mt-8 px-6 py-2.5 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all">
                   Lacak Detail Peta
                </button>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status SPT Hari Ini</h3>
                   <span className="px-3 py-1 bg-blue-600 rounded-full text-[9px] font-black uppercase">Live Update</span>
                </div>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-blue-400" />
                         </div>
                         <div>
                            <p className="text-2xl font-black">12</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Penugasan SPT Aktif</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-slate-300">SPT-2024-0512</p>
                         <p className="text-[9px] font-medium text-slate-500 mt-1">S.D 15 MEI 2024</p>
                      </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-[10px] text-slate-400">
                      "Semua pegawai dengan status SPT diperbolehkan absen di lokasi penugasan khusus sesuai koordinat yang telah ditentukan admin."
                   </div>
                </div>
             </div>
             <button className="mt-8 text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2">
                Kelola Surat Perintah Tugas <TrendingUp className="h-4 w-4" />
             </button>
          </div>
       </div>
    </div>
  );
}
