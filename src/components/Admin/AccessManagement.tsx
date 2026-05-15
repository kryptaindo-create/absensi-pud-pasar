import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Lock, User, CheckCircle2, XCircle, 
  Trash2, Plus, Search, ShieldCheck, ShieldAlert,
  ChevronRight, ArrowRight, UserPlus
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function AccessManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only get users with administrative potential
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));
    return unsub;
  }, []);

  const updateRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role, roleUpdatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) {
      alert('Pilih user dan role terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser), { 
        role: selectedRole,
        roleUpdatedAt: new Date().toISOString(),
        promotedToAdminAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setSelectedUser('');
      setSelectedRole('ADMIN');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_MASTER': return { label: 'Super Master Admin', color: 'bg-red-600 text-white shadow-red-200' };
      case 'MASTER_ADMIN': return { label: 'Master Admin', color: 'bg-slate-900 text-white shadow-slate-200' };
      case 'ADMIN': return { label: 'Admin Unit', color: 'bg-blue-600 text-white shadow-blue-200' };
      default: return { label: 'Pegawai', color: 'bg-slate-100 text-slate-400' };
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.nipp?.includes(searchTerm)) &&
    (u.role !== 'EMPLOYEE' || searchTerm.length > 2) // Shown all admins, search for employees
  );

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">12. Manajemen Akses</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Pengaturan Hak Akses & Role Administrator</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
           >
             <UserPlus className="h-4 w-4" /> Tambah Admin Baru
           </button>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari user untuk dijadikan admin..."
                className="rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Admin List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Daftar Administrator Sistem</h3>
               </div>
               <div className="divide-y divide-slate-50">
                  {filteredUsers.map((u, i) => (
                    <div key={u.id} className="p-6 hover:bg-slate-50 transition-all group">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-300 text-sm shadow-sm">
                                {u.name?.[0]}
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                                   <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg ${getRoleBadge(u.role).color}`}>
                                      {getRoleBadge(u.role).label}
                                   </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{u.email} • {u.nipp}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <select 
                               className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                               value={u.role}
                               onChange={(e) => updateRole(u.id, e.target.value)}
                             >
                                <option value="EMPLOYEE">Revoke Akses (Pegawai)</option>
                                <option value="ADMIN">Admin Unit</option>
                                <option value="MASTER_ADMIN">Master Admin</option>
                                <option value="SUPER_MASTER">Super Master</option>
                             </select>
                          </div>
                       </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="p-20 text-center">
                       <ShieldAlert className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tidak Ada User Ditemukan</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Permission Info */}
         <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <Shield className="h-5 w-5 text-red-500" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Hirarki Izin (Permissions)</h3>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-red-500 tracking-widest">
                           <span>Super Master</span>
                           <span>ALL ACCESS</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-400 leading-tight">
                           Full CRUD, delete audit logs, override approval, manage roles, payroll global.
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-300 tracking-widest">
                           <span>Master Admin</span>
                           <span>MGMT ACCESS</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-400 leading-tight">
                           View all units, confirm attendance, create SPT/Info, check fraud, payroll edit.
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-400 tracking-widest">
                           <span>Admin Unit</span>
                           <span>LIMITED ACCESS</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-400 leading-tight">
                           View restricted unit, confirm specific attendance, view assigned SPT.
                        </div>
                     </div>
                  </div>
               </div>
               <Key className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Keamanan Tambahan</h4>
               </div>
               <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight">
                  Perubahan Role Admin dicatat sepenuhnya dalam Audit Log dan hanya bisa dilakukan oleh Super Master atau Master Admin.
               </p>
            </div>
         </div>
      </div>

      {/* Modal Tambah Admin */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="h-5 w-5" />
                    <h3 className="text-lg font-black uppercase tracking-tight">Tambah Admin Baru</h3>
                  </div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-2">Promosi pengguna menjadi admin</p>
                </div>

                {/* Modal Content */}
                <form onSubmit={handleAddAdmin} className="p-8 space-y-6">
                  {/* Select User */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Pilih Pengguna
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    >
                      <option value="">-- Pilih User --</option>
                      {users
                        .filter(u => u.role === 'EMPLOYEE')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.nipp})
                          </option>
                        ))}
                    </select>
                    {selectedUser && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-xs font-bold text-blue-900">
                          {users.find(u => u.id === selectedUser)?.name}
                        </p>
                        <p className="text-[10px] text-blue-700 font-bold mt-1">
                          {users.find(u => u.id === selectedUser)?.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Select Role */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Tentukan Role
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 transition-all" style={{ borderColor: selectedRole === 'ADMIN' ? '#2563eb' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="role"
                          value="ADMIN"
                          checked={selectedRole === 'ADMIN'}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">Admin Unit</p>
                          <p className="text-[9px] text-slate-500 font-bold">Akses terbatas ke unit tertentu</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 transition-all" style={{ borderColor: selectedRole === 'MASTER_ADMIN' ? '#2563eb' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="role"
                          value="MASTER_ADMIN"
                          checked={selectedRole === 'MASTER_ADMIN'}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">Master Admin</p>
                          <p className="text-[9px] text-slate-500 font-bold">Akses manajemen penuh</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 transition-all" style={{ borderColor: selectedRole === 'SUPER_MASTER' ? '#dc2626' : '#e2e8f0' }}>
                        <input
                          type="radio"
                          name="role"
                          value="SUPER_MASTER"
                          checked={selectedRole === 'SUPER_MASTER'}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">Super Master</p>
                          <p className="text-[9px] text-slate-500 font-bold">Akses tertinggi - semua permission</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-[9px] font-bold text-amber-900 uppercase tracking-widest leading-relaxed">
                      ⚠️ Perubahan role akan dicatat dalam Audit Log. Pastikan Anda memilih pengguna yang tepat.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedUser || isSubmitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Promosikan Admin
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
