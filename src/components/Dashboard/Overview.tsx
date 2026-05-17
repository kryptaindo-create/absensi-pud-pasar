import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, AlertCircle, Clock, MapPin, User, Calendar, CreditCard, Heart, Briefcase, GraduationCap, ShieldAlert, FileText, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function Overview({ profile }: { profile: any }) {
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'locations'), (snap) => {
      const locs = snap.docs.map(doc => doc.data().name).filter(Boolean);
      setAvailableLocations(locs.length > 0 ? locs : ['Pusat', 'Unit Petisah', 'Unit Central', 'Unit Aksara', 'Cabang 1', 'Cabang 2', 'Cabang 3']);
    });
    return unsub;
  }, []);

  const calculateAge = (dateString?: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToExpiry = getDaysRemaining(profile.contract?.end);
  const showContractNotice = (profile.statusPegawai === 'HONOR' || profile.statusPegawai === 'PHL') && daysToExpiry !== null && daysToExpiry <= 90;

  const getAllowedLocations = () => {
    if (profile.attendanceLocations?.length > 0) return profile.attendanceLocations;
    
    const roleBased = [
      'Kepala Cabang 1', 'Kepala Cabang 2', 'Kepala Cabang 3',
      'Kabag', 'Kasubag', 'Staff Direksi', 'Admin', 'Kepala SPI'
    ];
    
    if (roleBased.includes(profile.jabatan)) {
      return availableLocations.length > 0 ? availableLocations : ['Pusat', 'Unit Petisah', 'Unit Central', 'Unit Aksara', 'Cabang 1', 'Cabang 2', 'Cabang 3'];
    }
    
    return [profile.tempatTugas || 'Unit Pusat'];
  };

  const data = [
    { name: 'Sen', value: 100 },
    { name: 'Sel', value: 85 },
    { name: 'Rab', value: 95 },
    { name: 'Kam', value: 70 },
    { name: 'Jum', value: 100 },
  ];

  const stats = [
    { label: 'Hadir', value: '12', icon: CheckCircle2, color: 'bg-green-500', text: 'text-green-600' },
    { label: 'Alpa', value: '0', icon: AlertCircle, color: 'bg-red-500', text: 'text-red-600' },
    { label: 'Sisa Cuti', value: profile.sisaCuti || '8', icon: Clock, color: 'bg-blue-500', text: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Card */}
      <div className="theme-card bg-blue-600 p-6 text-white overflow-hidden relative border-none">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">Profil Pegawai</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center font-bold text-2xl">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-xs font-medium text-blue-100">{profile.jabatan} • {profile.nipp || 'NIP Belum Ada'}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold backdrop-blur-md w-fit border border-white/10 uppercase tracking-wider">
            <MapPin className="h-3 w-3" />
            Tugas: {profile.tempatTugas || 'Unit Pusat'}
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      {/* Contract Notice */}
      {showContractNotice && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-card bg-amber-50 border-amber-200 p-4 flex gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
             <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Pemberitahuan Perpanjangan Kontrak</h4>
            <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
              Masa kontrak Anda akan berakhir dalam <span className="font-bold underline">{daysToExpiry} hari</span> ({profile.contract?.end}). 
              Segera hubungi bagian kepegawaian untuk pengurusan perpanjangan SK.
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="theme-card p-4 text-center bg-white">
            <div className={`mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${s.color} bg-opacity-10 shrink-0`}>
              <s.icon className={`h-4 w-4 ${s.text}`} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Information Tabs/Bento */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Informasi Detail Akun</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identity Info */}
          <div className="theme-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Identitas Diri</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: 'Tempat Lahir', value: profile.pob || '-' },
                { label: 'Tgl Lahir', value: profile.dob || '-' },
                { label: 'Umur', value: `${calculateAge(profile.dob)} Tahun` },
                { label: 'Jenis Kelamin', value: profile.gender || '-' },
                { label: 'Agama', value: profile.religion || '-' },
                { label: 'Status Nikah', value: profile.statusPerkawinan || '-' },
              ].map(item => (
                <div key={item.label}>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                   <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-relaxed">{profile.address || '-'}</p>
            </div>
          </div>

          {/* Employment Info */}
          <div className="theme-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Pekerjaan & Pangkat</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: 'Golongan', value: profile.golongan || '-' },
                { label: 'Jabatan', value: profile.jabatan || '-' },
                { label: 'Status Pegawai', value: profile.statusPegawai || '-' },
                { label: 'Mulai Kerja', value: profile.tanggalMasuk || '-' },
                { label: 'No. Gaji', value: profile.nomorGaji || '-' },
                { label: 'NIPP', value: profile.nipp || '-' },
              ].map(item => (
                <div key={item.label}>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                   <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Locations Info */}
          <div className="theme-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Izin Lokasi Absensi</h4>
            </div>
            <div className="space-y-3">
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed text-left">
                  Berdasarkan jabatan <span className="font-bold text-slate-900">{profile.jabatan}</span>, 
                  berikut adalah daftar unit lokasi yang diizinkan untuk melakukan absensi:
               </p>
               <div className="flex flex-wrap gap-2">
                  {getAllowedLocations().map((loc: string) => (
                    <span key={loc} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase tracking-wide">
                      {loc}
                    </span>
                  ))}
               </div>
               <div className="pt-2 border-t border-slate-50">
                  <p className="text-[9px] text-slate-400 italic text-left">
                     *Hubungi admin HRIS untuk penyesuaian geofence lokasi unit kerja Anda.
                  </p>
               </div>
            </div>
          </div>

          {/* Family Info */}
          <div className="theme-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Keluarga & Tunjangan</h4>
            </div>
            <div className="space-y-3">
              {profile.family?.length > 0 ? (
                profile.family.map((f: any, i: number) => {
                  const age = calculateAge(f.dob);
                  const isEligibleForAllowance = f.relation === 'Anak' ? age < 21 : true;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-900">{f.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-medium">{f.relation} • {age} Tahun</p>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${isEligibleForAllowance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isEligibleForAllowance ? 'Dapat Tunjangan' : 'Tunjangan Berhenti'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">Data keluarga belum diisi</p>
                </div>
              )}
            </div>
          </div>

          {/* Disciplinary & Documents */}
          <div className="theme-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Peringatan & SP</h4>
            </div>
            <div className="space-y-2">
               {(profile.warnings?.length > 0 || profile.sp?.length > 0) ? (
                 <>
                   {profile.warnings?.map((w: any) => (
                     <div key={`w-${w.level}`} className="p-3 rounded-lg border border-amber-100 bg-amber-50">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Peringatan {w.level}</span>
                          <span className="text-[8px] font-bold text-amber-600">{w.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-900 mt-1">Penyebab: {w.cause}</p>
                     </div>
                   ))}
                   {profile.sp?.map((s: any) => (
                     <div key={`s-${s.level}`} className="p-3 rounded-lg border border-red-100 bg-red-50">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">SP {s.level}</span>
                          <span className="text-[8px] font-bold text-red-600">{s.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-red-900 mt-1">Penyebab: {s.cause}</p>
                     </div>
                   ))}
                 </>
               ) : (
                 <div className="text-center py-4 bg-green-50 rounded-xl border border-dashed border-green-200">
                   <p className="text-[10px] font-medium text-green-600 uppercase tracking-[0.15em]">Tidak ada riwayat pelanggaran</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* SK Records (Full Width for dynamic content) */}
        <div className="theme-card p-6 bg-white">
           <div className="flex items-center gap-3 mb-6">
              <FileText className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight text-center">Riwayat SK Pengangkatan</h4>
           </div>
           <div className="space-y-3">
              {profile.skPengangkatan?.length > 0 ? (
                profile.skPengangkatan.map((sk: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                          <FileText className="h-4.5 w-4.5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{sk.number}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Tanggal SK: {sk.date}</p>
                       </div>
                    </div>
                    {i === (profile.skPengangkatan.length - 1) && (
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-[8px] font-black text-white uppercase tracking-[0.15em] shadow-sm shadow-blue-200">Terbaru</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Belum ada riwayat SK</p>
                </div>
              )}
           </div>
        </div>
      </div>
      
      {/* Attendance Context Info */}
      <div className="theme-card p-5 bg-slate-900 text-white overflow-hidden relative border-none">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight capitalize">Kebijakan Absensi</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Sebagai <span className="text-blue-400 font-bold">{profile.jabatan}</span>, Anda diizinkan melakukan absensi di: 
              <span className="text-slate-200 block mt-1 font-semibold">{profile.attendanceLocations?.join(', ') || 'Lokasi Terdaftar di SK'}</span>
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/4 bg-blue-600/10 blur-2xl"></div>
      </div>
    </div>
  );
}
