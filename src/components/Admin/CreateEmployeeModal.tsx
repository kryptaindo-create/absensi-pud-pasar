import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEmployeeModal({ onClose, onSuccess }: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Employee',
    nipp: '',
    jabatan: '',
    golongan: '',
    tempatTugas: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sementara: buat dokumen Firestore saja (tanpa Firebase Auth)
      // Nanti pegawai bisa register sendiri dengan email yang sama
      
      const { password, ...profileData } = formData;
      
      // Generate temporary UID
      const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await addDoc(collection(db, 'users'), {
        ...profileData,
        uid: tempUid,
        status: 'Pending', // Akan berubah jadi Active setelah pegawai register
        tempPassword: password, // Simpan password sementara (akan dihapus setelah register)
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid,
        isTemporary: true, // Flag bahwa ini akun sementara
      });

      alert(`✓ Data pegawai berhasil disimpan!\n\nNama: ${formData.name}\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nKirim kredensial ini ke pegawai untuk registrasi.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setError(err.message || 'Gagal menyimpan data pegawai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tambah Pegawai Baru</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Buat akun Firebase Auth + Profil Firestore
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap *</label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email *</label>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="budi@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password *</label>
              <input
                required
                type="text"
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
              <p className="text-[9px] text-slate-400 uppercase tracking-wide">Password ini akan diberikan ke pegawai</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Akun *</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Employee">Pegawai (Standard)</option>
                <option value="Admin">Admin Unit</option>
                <option value="MasterAdmin">Master Admin</option>
                <option value="SuperMaster">Super Master</option>
              </select>
            </div>
          </div>

          {/* Kepegawaian */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] mb-4">Data Kepegawaian (Opsional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIPP</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold"
                  value={formData.nipp}
                  onChange={(e) => setFormData({ ...formData, nipp: e.target.value })}
                  placeholder="Contoh: 123456"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Staff"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Golongan</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold"
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                >
                  <option value="">Pilih Golongan</option>
                  {['I', 'II', 'III', 'IV'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempat Tugas</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold"
                  value={formData.tempatTugas}
                  onChange={(e) => setFormData({ ...formData, tempatTugas: e.target.value })}
                  placeholder="Contoh: Kantor Pusat"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuat Akun...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Buat Akun Pegawai
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
