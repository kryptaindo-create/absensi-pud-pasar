import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, ArrowRight, Camera, CheckCircle2, ChevronLeft, Calendar, Mail, Lock, User, Chrome } from 'lucide-react';

export function Register({ onSwitch }: { onSwitch: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });
  const [faces, setFaces] = useState<{ front?: string; left?: string; right?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    // If user is already authenticated (e.g. redirected here after Google login in App.tsx)
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

  const handleNext = () => {
    if (step === 1 && !isGoogleUser && form.password !== form.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await signInWithGoogle();
      setForm({
        ...form,
        name: res.user.displayName || '',
        email: res.user.email || '',
        password: Math.random().toString(36).slice(-10), // Random hidden password
      });
      setIsGoogleUser(true);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Gagal registrasi Google');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      let uid = '';
      if (!isGoogleUser) {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        uid = res.user.uid;
      } else {
        uid = auth.currentUser?.uid || '';
      }

      if (!uid) throw new Error('User ID tidak ditemukan');

      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        name: form.name,
        email: form.email,
        dob: form.dob,
        role: 'Employee',
        status: 'Pending',
        faceEnrollment: faces,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
      let msg = err.message || 'Gagal mendaftar';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Metode Email/Password belum diaktifkan. Gunakan Google Signup atau aktifkan di Firebase Console.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleEnrollment = (pos: 'front' | 'left' | 'right') => {
    // Simulate camera capture
    setFaces({ ...faces, [pos]: 'captured_placeholder_url' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <motion.div
        layout
        className="w-full max-w-lg theme-card bg-white p-10"
      >
        <div className="mb-10 flex items-center justify-between">
          <button 
            onClick={step > 1 ? () => {
              if (isGoogleUser && step === 2) {
                // If google user wants to go back from step 2, they might want to switch account?
                // For now just allow going back to step 1 which will be "Google Account Linked"
                setStep(1);
              } else {
                setStep(step - 1);
              }
            } : onSwitch} 
            className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1.5">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 w-6 rounded-full transition-all ${step === s ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registrasi Pegawai</h1>
                <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">Lengkapi data diri Anda</p>
              </div>

              {isGoogleUser ? (
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-blue-200">
                      <Chrome className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase">Terhubung dengan Google</p>
                      <p className="text-[10px] font-bold text-blue-400 truncate max-w-[200px]">{form.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsGoogleUser(false); auth.signOut(); }}
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Gunakan Email Lain
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm mb-4"
                  >
                    <Chrome className="h-4 w-4 text-blue-500" />
                    <span>Daftar dengan Google</span>
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Atau Manual</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap (Sesuai KTP)</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-300"
                        placeholder="Contoh: Budi Santoso"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Perusahaan/Pribadi</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-300"
                        placeholder="budi@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
              </div>

              {!isGoogleUser && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-xs font-bold text-red-500 text-center uppercase tracking-wide">{error}</p>}

              <button
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
              >
                <span>Face Enrollment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Face Enrollment</h1>
                <p className="mt-2 text-sm font-medium text-slate-500 tracking-wide">Ambil foto wajah dari 3 sudut berbeda</p>
              </div>

              <div className="grid grid-cols-3 gap-4 px-2">
                {(['front', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handleEnrollment(pos)}
                    className={`relative flex flex-col items-center justify-center aspect-[3/4] rounded-xl border-2 border-dashed transition-all ${
                      faces[pos] ? 'border-green-500 bg-green-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {faces[pos] ? (
                      <>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                           <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="mt-3 text-[9px] font-bold uppercase text-green-700 tracking-[0.1em]">Selesai</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-slate-400" />
                        <span className="mt-3 text-[9px] font-bold uppercase text-slate-400 tracking-[0.1em]">
                          {pos === 'front' ? 'Depan' : pos === 'left' ? 'Kiri' : 'Kanan'}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-100/50">
                <p className="text-[11px] text-blue-700 leading-relaxed font-medium text-center">
                  Pastikan pencahayaan terang dan wajah terlihat jelas tanpa masker.
                </p>
              </div>

              {error && <p className="text-xs font-bold text-red-500 text-center uppercase tracking-wide">{error}</p>}

              <button
                disabled={loading || !faces.front || !faces.left || !faces.right}
                onClick={handleRegister}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                {loading ? 'MODERASI...' : 'DAFTARKAN AKUN'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
