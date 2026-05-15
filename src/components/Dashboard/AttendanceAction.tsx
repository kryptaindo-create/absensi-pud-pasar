import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, CheckCircle2, ShieldCheck, RefreshCcw, Navigation } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function AttendanceAction({ profile }: { profile: any }) {
  const [step, setStep] = useState<'start' | 'verification' | 'success'>('start');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInside, setIsInside] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // Simulating Geofencing check
        setIsInside(Math.random() > 0.3);
      });
    }
  }, []);

  const handleProcess = async () => {
    setLoading(true);
    // Simulate Face Recognition delay
    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'attendance'), {
          userId: profile.uid,
          date: new Date().toISOString().split('T')[0],
          checkIn: {
            time: serverTimestamp(),
            lat: location?.lat || 0,
            lng: location?.lng || 0,
            verified: true,
            type: 'Regular'
          },
          status: 'Present'
        });
        setStep('success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'attendance');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center py-6">
      <AnimatePresence mode="wait">
        {step === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-8"
          >
            <div className="text-center group">
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Absensi Hari Ini</h2>
              <p className="mt-2 text-xs text-slate-500 font-medium uppercase tracking-widest leading-relaxed px-4">
                Pastikan Anda berada di area geofence unit pasar
              </p>
            </div>

            <div className="aspect-square w-full rounded-2xl bg-white theme-card p-4 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-50/30" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg animate-pulse">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Siap Mendeteksi Wajah</p>
              </div>
              
              {/* Scan Frame Accents */}
              <div className="absolute top-12 left-12 h-6 w-6 border-t-2 border-l-2 border-blue-600/40" />
              <div className="absolute top-12 right-12 h-6 w-6 border-t-2 border-r-2 border-blue-600/40" />
              <div className="absolute bottom-12 left-12 h-6 w-6 border-b-2 border-l-2 border-blue-600/40" />
              <div className="absolute bottom-12 right-12 h-6 w-6 border-b-2 border-r-2 border-blue-600/40" />
            </div>

            <div className="space-y-4">
              <div className={`flex items-center gap-3.5 rounded-xl p-4 border transition-all ${isInside ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isInside ? 'bg-green-500' : 'bg-red-500'} text-white shrink-0`}>
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${isInside ? 'text-green-900' : 'text-red-900'}`}>
                    {isInside ? 'Di Dalam Area' : 'Di Luar Area'}
                  </h4>
                  <p className={`text-[10px] font-medium mt-0.5 truncate ${isInside ? 'text-green-700/70' : 'text-red-700/70'}`}>
                    {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Mendeteksi...'}
                  </p>
                </div>
              </div>

              <button
                disabled={!isInside || loading}
                onClick={() => setStep('verification')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-[0.1em]"
              >
                Masuk Kerja
                <Navigation className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'verification' && (
          <motion.div
            key="verif"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-[60vh] flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-24 w-24 rounded-full border-[3px] border-slate-100 border-t-blue-600"
              />
              <Camera className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Memverifikasi Wajah</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium max-w-[200px] mx-auto leading-relaxed">
                Posisikan wajah Anda tepat di tengah layar
              </p>
            </div>
            
            <button 
              onClick={handleProcess}
              className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-5 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest"
            >
              <RefreshCcw className="h-3 w-3" /> Simulasi Capture
            </button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-[60vh] flex-col items-center justify-center text-center space-y-6 px-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Absen Berhasil!</h2>
              <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed max-w-[240px]">
                Data kehadiran tercatat pada pukul <span className="font-bold text-blue-600">{new Date().toLocaleTimeString('id-ID')}</span>.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-slate-900 px-8 py-3 text-[11px] font-bold text-white transition-all hover:bg-black uppercase tracking-widest"
            >
              Selesai
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
