import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, ArrowRight, Camera, CheckCircle2, ChevronLeft,
  Calendar, Mail, Lock, User, Chrome, Eye, EyeOff, AlertCircle
} from 'lucide-react';

function getRegisterErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/operation-not-allowed':
      return 'Registrasi email/password belum diaktifkan. Hubungi administrator.';
    case 'auth/network-request-failed':
      return 'Koneksi gagal. Periksa jaringan internet Anda.';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

export function Register({ onSwitch }: { onSwitch: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [faces, setFaces] = useState<{ front?: string; left?: string; right?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const isGoogle = auth.currentUser.providerData.some(p => p.providerId === 'google.com');
      if (isGoogle) {
        setIsGoogleUser(true);
        setForm(f => ({
          ...f,
          name: auth.currentUser?.displayName || '',
          email: auth.currentUser?.email || '',
        }));
      }
    }
  }, []);

  const validateStep1 = (): string => {
    if (!isGoogleUser) {
      if (!form.name.trim()) return 'Nama lengkap wajib diisi.';
      if (!form.email.trim()) return 'Email wajib diisi.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Format email tidak valid.';
      if (!form.password) return 'Password wajib diisi.';
      if (form.password.length < 6) return 'Password minimal 6 karakter.';
      if (form.password !== form.confirmPassword) return 'Konfirmasi password tidak cocok.';
    }
    if (!form.dob) return 'Tanggal lahir wajib diisi.';
    return '';
  };

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await signInWithGoogle();
      setForm(f => ({
        ...f,
        name: res.user.displayName || '',
        email: res.user.email || '',
        password: Math.random().toString(36).slice(-12),
      }));
      setIsGoogleUser(true);
    } catch (err: any) {
      setError(getRegisterErrorMessage(err.code) || 'Gagal mendaftar dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!faces.front || !faces.left || !faces.right) {
      setError('Lengkapi semua foto wajah (depan, kiri, kanan).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let uid = '';
      if (!isGoogleUser) {
        const res = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        uid = res.user.uid;
      } else {
        uid = auth.currentUser?.uid || '';
      }

      if (!uid) throw new Error('User ID tidak ditemukan.');

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: form.name.trim(),
        email: form.email.trim(),
        dob: form.dob,
        role: 'Employee',
        status: 'Pending',
        faceEnrollment: faces,
        createdAt: new Date().toISOString(),
      });
      // App.tsx akan otomatis redirect ke halaman "Menunggu Persetujuan"
    } catch (err: any) {
      const msg = getRegisterErrorMessage(err.code) || err.message || 'Gagal mendaftar.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleEnrollment = (pos: 'front' | 'left' | 'right') => {
    setFaces({ ...faces, [pos]: 'captured_placeholder_url' });
  };

  const faceLabels = { front: 'Depan', left: 'Kiri', right: 'Kanan' };
  const allFacesCaptured = faces.front && faces.left && faces.right;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <motion.div layout className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-10">

        {/* Step indicator & back button */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={step > 1 ? () => { setStep(1); setError(''); } : onSwitch}
            className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-blue-600' : step > s ? 'w-4 bg-blue-300' : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="w-9" /> {/* spacer */}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Data Diri ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Akun</h1>
                <p className="mt-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">Langkah 1 dari 2 — Data Diri</p>
              </div>

              {isGoogleUser ? (
                /* Google user — tampilkan info akun */
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center border border-blue-200 shrink-0">
                    <Chrome className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-blue-900 uppercase tracking-tight">{form.name || 'Akun Google'}</p>
                    <p className="text-[10px] font-bold text-blue-400 truncate">{form.email}</p>
                  </div>
                  <button
                    onClick={() => { setIsGoogleUser(false); auth.signOut(); }}
                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline shrink-0"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Google signup button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
                  >
                    <Chrome className="h-4 w-4 text-blue-500" />
                    <span>Daftar dengan Google</span>
                  </button>

                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-100" />
                    <span className="mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">atau manual</span>
                    <div className="flex-grow border-t border-slate-100" />
                  </div>

                  {/* Nama */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                        placeholder="Sesuai KTP"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                        placeholder="nama@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-9 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                          placeholder="Min. 6 karakter"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form.confirmPassword}
                          onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setError(''); }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-9 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                          placeholder="Ulangi password"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal Lahir */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => { setForm({ ...form, dob: e.target.value }); setError(''); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
              >
                <span>Lanjut — Foto Wajah</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Face Enrollment ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Face Enrollment</h1>
                <p className="mt-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">Langkah 2 dari 2 — Foto Wajah</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['front', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleEnrollment(pos)}
                    className={`relative flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed transition-all ${
                      faces[pos]
                        ? 'border-green-400 bg-green-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {faces[pos] ? (
                      <>
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="mt-2 text-[9px] font-bold uppercase text-green-700 tracking-widest">Selesai</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-slate-400" />
                        <span className="mt-2 text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                          {faceLabels[pos]}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-700 font-medium text-center leading-relaxed">
                  Pastikan pencahayaan terang dan wajah terlihat jelas tanpa masker atau kacamata hitam.
                </p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2">
                {(['front', 'left', 'right'] as const).map((pos) => (
                  <div
                    key={pos}
                    className={`h-1.5 w-8 rounded-full transition-all ${faces[pos] ? 'bg-green-500' : 'bg-slate-200'}`}
                  />
                ))}
                <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {Object.values(faces).filter(Boolean).length}/3
                </span>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                disabled={loading || !allFacesCaptured}
                onClick={handleRegister}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Daftarkan Akun</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
