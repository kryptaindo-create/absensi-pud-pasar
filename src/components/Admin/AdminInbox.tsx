import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Send, AlertTriangle, Info, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminInbox({ profile }: { profile: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Form State
  const [targetUser, setTargetUser] = useState('ALL');
  const [messageType, setMessageType] = useState('INFO');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch users for dropdown
    const uq = query(collection(db, 'users'), orderBy('name'));
    const unsubU = onSnapshot(uq, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch sent messages history
    const mq = query(collection(db, 'inbox'), orderBy('timestamp', 'desc'));
    const unsubM = onSnapshot(mq, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubU(); unsubM(); };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return alert('Judul dan isi pesan wajib diisi!');
    
    // Keamanan: SP hanya boleh dikirim oleh SuperMaster
    if (messageType === 'WARNING' && profile.role !== 'SuperMaster') {
      return alert('Hanya Super Master yang diizinkan untuk mengirim Surat Peringatan (SP).');
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inbox'), {
        userId: targetUser,
        type: messageType,
        title: title,
        message: body,
        senderId: profile.name,
        timestamp: serverTimestamp(),
        isRead: false
      });
      alert('Pesan berhasil dikirim!');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error(error);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kirim Pesan & SP</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Kirim Pengumuman atau Surat Peringatan ke Aplikasi Karyawan
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Form Area */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" /> Tulis Pesan Baru
          </h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tujuan (Karyawan)</label>
              <select 
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="ALL">📢 BROADCAST (Semua Karyawan)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Pesan</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setMessageType('INFO')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${messageType === 'INFO' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Info className="w-4 h-4" /> Informasi
                </button>
                <button 
                  type="button"
                  onClick={() => setMessageType('WARNING')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-bold transition-all ${messageType === 'WARNING' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <AlertTriangle className="w-4 h-4" /> Teguran (SP)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Judul Pesan</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Evaluasi Bulanan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Isi Pesan</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tuliskan isi pesan secara detail..."
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${isSubmitting ? 'bg-slate-400' : messageType === 'WARNING' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Pesan Sekarang'}
            </button>
          </form>
        </div>

        {/* History Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" /> Riwayat Pesan Terkirim
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 font-medium">Belum ada riwayat pesan.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  key={msg.id} 
                  className={`p-4 rounded-xl border ${msg.type === 'WARNING' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} flex gap-4`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${msg.type === 'WARNING' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {msg.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">{msg.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'Baru saja'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{msg.message}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                        <Users className="w-3 h-3" /> {msg.userId === 'ALL' ? 'BROADCAST' : 'Personal'}
                      </span>
                      <span>Oleh: {msg.senderId}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
