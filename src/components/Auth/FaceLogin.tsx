import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface FaceLoginProps {
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function FaceLogin({ onClose, onSuccess }: FaceLoginProps) {
  const [step, setStep] = useState<'id' | 'scan' | 'verify' | 'success' | 'error'>('id');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError('Gagal mengakses kamera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('Pegawai tidak ditemukan');
        return;
      }

      setStep('scan');
      await startCamera();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  };

  const handleScan = () => {
    setStep('verify');
    // Simulated face matching logic
    setTimeout(() => {
      setStep('success');
      stopCamera();
      setTimeout(() => {
        onSuccess(email);
      }, 1500);
    }, 3000);
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={() => { stopCamera(); onClose(); }} 
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Biometric Login</h2>
          <p className="mt-1.5 text-xs font-medium text-slate-500 uppercase tracking-widest">Verifikasi Wajah Pegawai</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'id' && (
            <motion.form
              key="id"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleIdentify}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="nama@pudpasar.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-[10px] font-bold text-red-500 uppercase text-center">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                Mulai Pemindaian
              </button>
            </motion.form>
          )}

          {(step === 'scan' || step === 'verify') && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="relative aspect-square rounded-[40px] overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover grayscale brightness-110"
                />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                   <div className="w-full h-full border-2 border-blue-500/50 rounded-full animate-pulse relative">
                      <motion.div 
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute h-0.5 w-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                      />
                   </div>
                </div>

                {step === 'verify' && (
                  <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full border border-blue-100 shadow-xl">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Matching Face...</p>
                    </div>
                  </div>
                )}
              </div>

              {step === 'scan' && (
                <button
                  onClick={handleScan}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Camera className="h-4 w-4" />
                  Tangkap Wajah
                </button>
              )}
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Akses Diberikan</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Wajah terverifikasi, mengalihkan...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
