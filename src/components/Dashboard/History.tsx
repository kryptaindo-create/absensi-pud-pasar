import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';

export function History({ profile }: { profile: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    async function fetchHistory() {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'attendance'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
        const snap = await getDocs(q);
        setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'attendance');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredRecords = records.filter(r => {
    let matchesStatus = true;
    if (statusFilter === 'LATE') {
      matchesStatus = r.isLate === true;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = r.status === statusFilter;
    }
    const matchesStart = !dateRange.start || r.date >= dateRange.start;
    const matchesEnd = !dateRange.end || r.date <= dateRange.end;
    return matchesStatus && matchesStart && matchesEnd;
  });

  if (loading) return <div className="p-8 text-center text-sm font-medium text-gray-500 animate-pulse">Memuat riwayat...</div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-gray-900">Riwayat Absensi</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`text-xs font-bold uppercase tracking-widest transition-colors ${showFilters ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {showFilters ? 'Sembunyikan Filter' : 'Filter'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dari</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                  className="w-full rounded-xl border border-gray-50 bg-gray-50 px-3 py-2 text-[10px] font-bold focus:bg-white transition-all outline-none"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sampai</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                  className="w-full rounded-xl border border-gray-50 bg-gray-50 px-3 py-2 text-[10px] font-bold focus:bg-white transition-all outline-none"
                />
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
             {['ALL', 'HADIR', 'LATE', 'IZIN', 'SAKIT', 'ALPA'].map(s => (
               <button
                 key={s}
                 onClick={() => setStatusFilter(s)}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-sm font-medium text-gray-400">Data tidak ditemukan</p>
        </div>
      ) : (
        filteredRecords.map((record) => (
          <div key={record.id} className="group relative overflow-hidden rounded-3xl bg-white p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-gray-50 text-gray-900 leading-none group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{new Date(record.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className="text-xl font-black">{new Date(record.date).getDate()}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {record.status === 'HADIR' ? (record.isLate ? 'Hadir Terlambat' : 'Hadir Tepat Waktu') : record.status}
                  </h4>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      MASUK: {record.checkIn?.time ? (record.checkIn.time.toDate ? record.checkIn.time.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date(record.checkIn.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })) : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile?.tempatTugas || 'AREA UNIT'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
