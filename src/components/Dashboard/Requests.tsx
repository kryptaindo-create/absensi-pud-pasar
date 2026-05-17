import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Send, Calendar, Info, Camera } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function RequestsEmployee({ profile }: { profile: any }) {
  const [form, setForm] = useState({
    type: 'Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        userId: profile.uid,
        ...form,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'requests');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in scale-in-95">
        <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 ring-8 ring-blue-50">
          <Send className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Pengajuan Terkirim</h3>
        <p className="mt-2 text-sm text-gray-500 font-medium px-8 leading-relaxed">
          Permintaan Anda telah masuk ke sistem dan menunggu verifikasi dari Admin Kepegawaian.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-8 rounded-2xl bg-gray-900 px-8 py-3 text-sm font-bold text-white tracking-widest hover:bg-black transition-all"
        >
          BUAT PENGAJUAN BARU
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Layanan Mandiri</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium">Ajukan cuti, sakit, atau izin secara digital</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[40px] bg-white p-8 shadow-xl shadow-blue-50 border border-gray-100">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jenis Pengajuan</label>
          <select 
            className="mt-2 w-full rounded-2xl border-none bg-gray-50 py-4 px-5 text-sm font-bold text-gray-900 outline-none ring-2 ring-gray-100 focus:ring-blue-600 transition-all appearance-none"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="Leave">Cuti Tahunan</option>
            <option value="Sick">Sakit (Sertakan Surat Dokter)</option>
            <option value="EarlyLeave">Izin Pulang Cepat</option>
            <option value="Promotion">Kenaikan Golongan</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Mulai</label>
            <input 
              type="date"
              required
              className="mt-2 w-full rounded-2xl border-none bg-gray-50 py-4 px-5 text-sm font-bold text-gray-900 outline-none ring-2 ring-gray-100 focus:ring-blue-600 transition-all shadow-inner"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Sampai</label>
            <input 
              type="date"
              required
              className="mt-2 w-full rounded-2xl border-none bg-gray-50 py-4 px-5 text-sm font-bold text-gray-900 outline-none ring-2 ring-gray-100 focus:ring-blue-600 transition-all shadow-inner"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Alasan / Pesan</label>
          <textarea 
            rows={3}
            required
            placeholder="Tuliskan alasan pengajuan Anda..."
            className="mt-2 w-full rounded-2xl border-none bg-gray-50 py-4 px-5 text-sm font-medium text-gray-900 outline-none ring-2 ring-gray-100 focus:ring-blue-600 transition-all placeholder:text-gray-400"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        {form.type === 'Sick' && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
            <Camera className="mx-auto h-10 w-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
            <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600">Unggah Surat Dokter</p>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          {loading ? 'Mengirim...' : 'KIRIM PENGAJUAN'}
          <Send className="h-5 w-5" />
        </button>
      </form>

      <div className="flex gap-4 rounded-3xl bg-amber-50 p-6 border border-amber-100">
        <Info className="h-6 w-6 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          Pengajuan cuti wajib diajukan paling lambat <span className="font-bold underline">H-7</span> sebelum tanggal keberangkatan.
        </p>
      </div>
    </div>
  );
}
