import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, FileText, Wallet, Settings, ShieldCheck, 
  Menu, X, LayoutDashboard, Database, ClipboardCheck, History,
  MapPin, Clock, ShieldAlert, CheckSquare, ListTodo, Navigation,
  Bell, Lock, Activity
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { UserList } from './UserList';
import { AttendanceMonitoring } from './AttendanceMonitoring';
import { HRISManagement } from './HRIS';
import { PayrollManagement } from './PayrollAdmin';
import { AuditLogView } from './AuditLog';
import { ApprovalQueue } from './ApprovalQueue';
import { AdminOverview } from './AdminOverview';
import { SptManagement } from './SptManagement';
import { FraudAnalysis } from './FraudAnalysis';
import { LocationManagement } from './LocationManagement';
import { AccessManagement } from './AccessManagement';
import { LiveTracking } from './LiveTracking';
import { ShiftManagement } from './ShiftManagement';
import { UnitStats } from './UnitStats';

export function AdminDashboard({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: '1. Dashboard Utama', icon: LayoutDashboard },
    { id: 'users', label: '2. Data Karyawan', icon: Users },
    { id: 'attendance_data', label: '3. Data Absensi', icon: ClipboardCheck },
    { id: 'unit_stats', label: '4. Statistik Unit', icon: Activity },
    { id: 'spt', label: '5. SPT & Informasi', icon: FileText },
    { id: 'fraud', label: '6. Analisis Fraud', icon: ShieldAlert },
    { id: 'approvals', label: '7. Antrian Persetujuan', icon: CheckSquare },
    { id: 'shifts', label: '8. Manajemen Shift', icon: Clock },
    { id: 'locations', label: '9. Lokasi Kerja', icon: MapPin },
    { id: 'tracking', label: '10. Lacak Lokasi', icon: Navigation },
    { id: 'payroll', label: '11. Payroll Gaji', icon: Wallet },
    { id: 'access', label: '12. Manajemen Akses', icon: Lock, hidden: profile.role !== 'SuperMaster' },
    { id: 'audit', label: '13. Audit Log', icon: History, hidden: profile.role !== 'SuperMaster' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                P
             </div>
             <div>
               <h1 className="text-[11px] font-black tracking-widest text-slate-900 uppercase leading-none">PUD PASAR</h1>
               <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">HRMS SYSTEM</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {menuItems.filter(m => !m.hidden).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200">
              <div className="h-9 w-9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=f1f5f9&color=1e293b`} 
                  className="h-full w-full object-cover"
                  alt="Admin"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{profile.name}</p>
                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{profile.role}</p>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('demo_user');
                  auth.signOut();
                  window.location.reload();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Keluar"
              >
                <X className="h-4 w-4" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Mobile Header (Floating) */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="h-14 w-14 rounded-full bg-blue-600 shadow-2xl flex items-center justify-center text-white active:scale-95 transition-transform"
          >
             <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="mx-auto max-w-7xl p-4 lg:p-10 pb-24">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.2 }}
             >
                {activeTab === 'overview' && <AdminOverview />}
                {activeTab === 'users' && <UserList />}
                {activeTab === 'attendance_data' && <AttendanceMonitoring />}
                {activeTab === 'unit_stats' && <UnitStats />}
                {activeTab === 'spt' && <SptManagement />}
                {activeTab === 'fraud' && <FraudAnalysis />}
                {activeTab === 'approvals' && <ApprovalQueue profile={profile} />}
                {activeTab === 'shifts' && <ShiftManagement />}
                {activeTab === 'locations' && <LocationManagement />}
                {activeTab === 'tracking' && <LiveTracking />}
                {activeTab === 'payroll' && <PayrollManagement />}
                {activeTab === 'access' && <AccessManagement />}
                {activeTab === 'audit' && <AuditLogView />}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="lg:hidden fixed inset-y-0 right-0 z-[70] w-80 bg-white shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                 <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Navigasi Admin</h2>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 rounded-xl">
                   <X className="h-5 w-5 text-slate-600" />
                 </button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {menuItems.filter(m => !m.hidden).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                      activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 bg-slate-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
              
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button 
                  onClick={() => {
                    localStorage.removeItem('demo_user');
                    auth.signOut();
                    window.location.reload();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <X className="h-4 w-4" />
                  Keluar dari Akun Admin
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
