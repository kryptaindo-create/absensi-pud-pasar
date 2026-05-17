import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { CheckCircle, AlertCircle, Clock, MapPin, User, Calendar, CreditCard, Heart, Briefcase, GraduationCap, ShieldAlert, FileText, Info, BarChart2, AlertTriangle, FileText as FileClockIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export function Overview({ profile }: { profile: any }) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const userId = profile.id || profile.uid;
    if (!userId) return;

    // Fetch Attendance
    const qAtt = query(collection(db, 'attendance'), where('userId', '==', userId));
    const unsubAtt = onSnapshot(qAtt, (snap) => {
      setAttendances(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Submissions
    const qSub = query(collection(db, 'submissions'), where('userId', '==', userId));
    const unsubSub = onSnapshot(qSub, (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAtt();
      unsubSub();
    };
  }, [profile.id, profile.uid]);

  // DATE LOGIC: Periode 16 bulan lalu s/d 15 bulan ini
  const now = new Date();
  let startPeriod = new Date(now.getFullYear(), now.getMonth(), 16);
  let endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 15, 23, 59, 59);

  if (now.getDate() <= 15) {
    startPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 16);
    endPeriod = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
  }

  const isWithinPeriod = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    return d >= startPeriod && d <= endPeriod;
  };

  // CALCULATIONS
  // 1. Total masuk all-time
  const allTimeMasuk = new Set(attendances.filter(a => !!a.checkIn || a.type === 'Masuk').map(a => a.date)).size;

  // 2. Monthly Attendances (16 to 15)
  const monthlyAtts = attendances.filter(a => isWithinPeriod(a.date));
  const monthlyMasukList = monthlyAtts.filter(a => !!a.checkIn || a.type === 'Masuk');
  
  // Total masuk sebulan
  const totalMasukBulanIni = new Set(monthlyMasukList.map(a => a.date)).size;

  // Total terlambat sebulan
  const totalTerlambatBulanIni = monthlyMasukList.filter(a => a.status === 'LATE' || a.status === 'Terlambat').length;

  // Lupa Absen Pulang Sebulan
  let lupaPulangBulanIni = 0;
  monthlyMasukList.forEach(m => {
    // Jika masuk, tapi tidak ada record pulang di tanggal yang sama, dan tanggalnya bukan hari ini (atau hari ini tapi udah lewat jam)
    const isToday = new Date().toISOString().split('T')[0] === m.date;
    const hasCheckOut = m.checkOut || attendances.find(a => a.type === 'Pulang' && a.date === m.date);
    if (!hasCheckOut && !isToday) {
      lupaPulangBulanIni++;
    }
  });

  // Monthly Submissions (Izin / Cuti)
  const monthlySubs = submissions.filter(s => {
    if (s.status !== 'APPROVED') return false;
    if (s.startDate && isWithinPeriod(s.startDate)) return true;
    if (s.timestamp && typeof s.timestamp.toDate === 'function') {
      try {
        return isWithinPeriod(s.timestamp.toDate().toISOString());
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const totalIzinSakitBulanIni = monthlySubs.filter(s => s.type === 'SAKIT' || s.type === 'IZIN').length;
  const totalCutiBulanIni = monthlySubs.filter(s => s.type === 'CUTI').length;

  // Hitung Alpa (Asumsi 22 hari kerja sebulan, kurangi hadir + izin + cuti)
  // Untuk simpelnya, kita hitung hari kerja dari startPeriod ke today (jika today < endPeriod)
  let workingDaysPast = 0;
  let cursor = new Date(startPeriod);
  const endCursor = now < endPeriod ? now : endPeriod;
  while (cursor <= endCursor) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) { // Bukan Sabtu/Minggu
      workingDaysPast++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  
  let totalAlpaBulanIni = workingDaysPast - (totalMasukBulanIni + totalIzinSakitBulanIni + totalCutiBulanIni);
  if (totalAlpaBulanIni < 0) totalAlpaBulanIni = 0;

  // GRAPH DATA
  const graphData = [
    { name: 'Tepat Waktu', value: totalMasukBulanIni - totalTerlambatBulanIni, color: '#10b981' },
    { name: 'Terlambat', value: totalTerlambatBulanIni, color: '#f59e0b' },
    { name: 'Izin/Sakit', value: totalIzinSakitBulanIni, color: '#3b82f6' },
    { name: 'Alpa', value: totalAlpaBulanIni, color: '#ef4444' }
  ];

  const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="theme-card bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white overflow-hidden relative border-none shadow-xl">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Dashboard Karyawan</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center font-bold text-2xl">
              {profile.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-xs font-medium text-blue-100 mt-1">{profile.jabatan || 'Pegawai'} • {profile.nipp || 'NIP Belum Ada'}</p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold backdrop-blur-md w-fit border border-white/10 uppercase tracking-wider">
              <MapPin className="h-3 w-3" />
              {profile.tempatTugas || 'Unit Pusat'}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold backdrop-blur-md w-fit border border-white/10 uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              Sisa Cuti: {profile.sisaCuti || 0} Hari
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {/* Periode Info */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Statistik Kehadiran</h3>
        <p className="text-xs font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
          Periode: {formatDate(startPeriod)} - {formatDate(endPeriod)}
        </p>
      </div>

      {/* Stats Grid - ALL TIME */}
      <div className="grid grid-cols-2 gap-4">
        <div className="theme-card bg-white p-5 border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hadir (All-Time)</p>
          <h4 className="text-2xl font-black text-slate-800">{allTimeMasuk} <span className="text-xs text-slate-500 font-bold">Hari</span></h4>
        </div>
        <div className="theme-card bg-white p-5 border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hadir (Bulan Ini)</p>
          <h4 className="text-2xl font-black text-slate-800">{totalMasukBulanIni} <span className="text-xs text-slate-500 font-bold">Hari</span></h4>
        </div>
      </div>

      {/* Stats Grid - MONTHLY DETAILED */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="theme-card bg-white p-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <Clock className="w-4 h-4 text-amber-500 mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight h-6">Terlambat</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{totalTerlambatBulanIni} <span className="text-[10px] font-bold text-slate-400">Kali</span></h4>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-amber-50 rounded-full"></div>
        </div>

        <div className="theme-card bg-white p-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <AlertTriangle className="w-4 h-4 text-red-500 mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight h-6">Tidak Absen Pulang</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{lupaPulangBulanIni} <span className="text-[10px] font-bold text-slate-400">Kali</span></h4>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-red-50 rounded-full"></div>
        </div>

        <div className="theme-card bg-white p-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <FileClockIcon className="w-4 h-4 text-blue-500 mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight h-6">Izin/Sakit</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{totalIzinSakitBulanIni} <span className="text-[10px] font-bold text-slate-400">Hari</span></h4>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-50 rounded-full"></div>
        </div>

        <div className="theme-card bg-white p-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-500 mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight h-6">Alpa (Tanpa Ket)</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{totalAlpaBulanIni} <span className="text-[10px] font-bold text-slate-400">Hari</span></h4>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-rose-50 rounded-full"></div>
        </div>
        
        <div className="theme-card bg-white p-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <Calendar className="w-4 h-4 text-indigo-500 mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight h-6">Total Cuti</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">{totalCutiBulanIni} <span className="text-[10px] font-bold text-slate-400">Hari</span></h4>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-50 rounded-full"></div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="theme-card bg-white p-6 border-slate-100 shadow-sm mt-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Grafik Performa Bulan Ini</h3>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {graphData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
