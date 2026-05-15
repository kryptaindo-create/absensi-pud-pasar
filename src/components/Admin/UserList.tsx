import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Search, Filter, Plus, ShieldCheck, UserCheck, AlertTriangle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserEditor } from './UserEditor';

export function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // If we're in demo mode (no real auth user), we can't fetch from Firestore with current rules
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubL = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'locations'));

    return () => {
      unsub();
      unsubL();
    };
  }, []);

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nipp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.golongan || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesUnit = unitFilter === 'ALL' || u.tempatTugas === unitFilter;

    return matchesSearch && matchesStatus && matchesUnit;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Data Karyawan</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Daftar profil seluruh pegawai unit PUD PASAR</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Tambah Pegawai
          </button>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama, NIPP atau email..."
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Non-Aktif</option>
            <option value="Pending">Tertunda</option>
          </select>

          <select 
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all shadow-sm cursor-pointer lg:max-w-[200px]"
          >
            <option value="ALL">Semua Unit</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Approval/Pending Section */}
      <PendingUsers users={users.filter(u => u.status === 'Pending')} onApprove={(id) => handleStatusUpdate(id, 'Active')} />

      {/* Main Table */}
      <div className="overflow-x-auto theme-card bg-white border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Pegawai</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">NIPP / Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Jabatan & Unit</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Gol.</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100/50 text-blue-600 font-bold">
                       {user.name ? user.name[0] : '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 leading-none">{user.name}</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">{user.email || 'No Email'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.nipp || 'BELUM ADA NIPP'}</span>
                      <span className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        user.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        user.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <p className="text-xs font-bold text-slate-700">{user.jabatan || 'Belum Diatur'}</p>
                   <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wide">{user.tempatTugas || '-'}</p>
                </td>
                <td className="px-6 py-4">
                   <span className="text-xs font-black text-slate-900">{user.golongan || '-'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm transition-all"
                        title="Edit Profil Lengkap"
                      >
                         <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white shadow-sm transition-all">
                         <Trash2 className="h-3.5 w-3.5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingUser && (
          <UserEditor 
            user={editingUser} 
            onClose={() => setEditingUser(null)} 
          />
        )}
        {isAdding && (
          <UserEditor 
            user={{ name: '', email: '', role: 'Employee', status: 'Active', createdAt: new Date().toISOString() }} 
            onClose={() => setIsAdding(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PendingUsers({ users, onApprove }: { users: any[], onApprove: (id: string) => void }) {
  if (users.length === 0) return null;

  return (
    <div className="rounded-xl bg-amber-50/50 p-6 border border-amber-200/50">
       <div className="flex items-center gap-2.5 mb-5">
          <div className="h-7 w-7 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
             <AlertTriangle className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-900">Konfirmasi Pendaftaran Baru</h3>
       </div>
       <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {users.map((user) => (
            <motion.div 
              key={user.id}
              layout
              className="min-w-[300px] theme-card p-5 bg-white"
            >
               <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 shrink-0">
                     <span className="text-xs font-bold text-amber-700">{user.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate text-slate-900 leading-none">{user.name}</p>
                     <p className="text-[10px] font-medium text-slate-400 truncate uppercase mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="mt-5 flex gap-2">
                  <button 
                    onClick={() => onApprove(user.id)}
                    className="flex-1 rounded-lg bg-amber-500 py-2 text-[11px] font-bold text-white hover:bg-amber-600 transition-all"
                  >
                    SETUJUI
                  </button>
                  <button className="flex-1 rounded-lg bg-white border border-slate-200 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    TOLAK
                  </button>
               </div>
            </motion.div>
          ))}
       </div>
    </div>
  );
}
