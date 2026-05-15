import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Calendar, ClipboardList, Wallet, User, LogOut, Bell } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { Overview } from './Overview';
import { AttendanceAction } from './AttendanceAction';
import { History } from './History';
import { Payslip } from './Payslip';

export function Dashboard({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'attendance', label: 'Absen', icon: Calendar },
    { id: 'history', label: 'Riwayat', icon: ClipboardList },
    { id: 'payroll', label: 'Gaji', icon: Wallet },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=f8fafc&color=334155`} 
              alt="Avatar" 
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 leading-none">{profile.name}</h2>
            <p className="mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {profile.jabatan || 'Pegawai'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative rounded-lg p-2 hover:bg-slate-100 transition-colors">
            <Bell className="h-4 w-4 text-slate-500" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 border-2 border-white" />
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('demo_user');
              auth.signOut();
              window.location.reload();
            }}
            className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Overview profile={profile} />
            </motion.div>
          )}
          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AttendanceAction profile={profile} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <History profile={profile} />
            </motion.div>
          )}
          {activeTab === 'payroll' && (
            <motion.div key="payroll" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Payslip profile={profile} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ProfileView profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-200 bg-white/90 backdrop-blur-lg px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-1 transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Icon className={`h-5 w-5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="nav-pill" className="absolute -top-2 flex justify-center w-full">
                 <div className="h-0.5 w-8 rounded-full bg-blue-600" />
              </motion.div>
            )}
          </button>
        )})}
      </nav>
    </div>
  );
}

function ProfileView({ profile }: { profile: any }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="theme-card p-6 bg-white">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Informasi Akun</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-medium text-slate-500">NIPP</span>
            <span className="text-sm font-bold text-slate-900">{profile.nipp || 'Belum diatur'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-medium text-slate-500">Jabatan</span>
            <span className="text-sm font-bold text-slate-900">{profile.jabatan || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-medium text-slate-500">Golongan</span>
            <span className="text-sm font-bold text-slate-900">{profile.golongan || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-medium text-slate-500">ID Perangkat</span>
            <span className="text-xs font-mono text-slate-400 truncate ml-4">{profile.deviceId || 'B6-F1-09-XX'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-slate-500">Kontrak Berakhir</span>
            <span className="text-sm font-bold text-blue-600">
              {profile.contractExpiry ? new Date(profile.contractExpiry).toLocaleDateString('id-ID') : 'Selesai'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-red-50/50 p-6 border border-red-100/60">
        <h4 className="text-red-900 text-sm font-bold mb-2 uppercase tracking-wide">Pusat Bantuan</h4>
        <p className="text-sm text-red-700/80 leading-relaxed">
          Jika ada kesalahan data atau ingin mengubah perangkat, silakan hubungi Bagian Kepegawaian Sekretariat.
        </p>
      </div>
    </div>
  );
}
