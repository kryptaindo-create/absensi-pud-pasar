import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Lock, Mail, Fingerprint, ScanEye, Terminal, Chrome } from 'lucide-react';
import { FaceLogin } from './FaceLogin';

export function Login({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFaceLogin, setShowFaceLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      let msg = 'Email atau password salah.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Metode Login Email/Password belum diaktifkan. Gunakan Google Login di bawah atau aktifkan di Firebase Console.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
      setLoading(false);
    }
  };

  const handleFaceSuccess = async (targetEmail: string) => {
    // ... logic ...
  };

  const handleDevLogin = () => {
    const mockUser = {
      uid: 'dev-super-001',
      email: 'super@pudpasar.com',
      displayName: 'Super Master Admin',
      role: 'SuperMaster'
    };
    localStorage.setItem('demo_user', JSON.stringify(mockUser));
    window.location.reload();
  };

  const handleDemoEmployeeLogin = () => {
    const mockUser = {
      uid: 'demo-employee-001',
      email: 'karyawan@pudpasar.com',
      displayName: 'Demo Karyawan',
      role: 'Employee'
    };
    localStorage.setItem('demo_user', JSON.stringify(mockUser));
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md theme-card bg-white p-10"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/10 mb-6">
            <Fingerprint className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Absensi PUD Pasar</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">Sistem Personalia Mobile</p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Pegawai</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-300"
                placeholder="nama@pudpasar.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-500 text-center uppercase tracking-wide">{error}</p>}

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-6 gap-3">
              <button
                disabled={loading}
                type="submit"
                className="col-span-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Memuat...' : (
                  <>
                    <span>Masuk</span>
                    <LogIn className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFaceLogin(true)}
                className="col-span-1 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90"
                title="Face ID Login"
              >
                <ScanEye className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleDevLogin}
                className="col-span-1 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 transition-all active:scale-90 shadow-lg shadow-black/20"
                title="Developer Bypass"
              >
                <Terminal className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-white border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              <Chrome className="h-4 w-4 text-blue-500" />
              <span>Lanjut dengan Google</span>
            </button>

            <button
              type="button"
              onClick={handleDemoEmployeeLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-green-600 border border-green-600 py-3 text-xs font-bold text-white hover:bg-green-700 transition-all active:scale-95 shadow-sm"
              title="Demo Login Karyawan"
            >
              <UserPlus className="h-4 w-4" />
              <span>Demo Login Karyawan</span>
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
          <button
            onClick={onSwitch}
            className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Daftar Akun Baru</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFaceLogin && (
          <FaceLogin 
            onClose={() => setShowFaceLogin(false)}
            onSuccess={handleFaceSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
