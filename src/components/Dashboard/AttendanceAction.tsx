import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle2, RefreshCcw, Navigation, AlertCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addDoc, collection, getDocs, getDoc, doc, serverTimestamp } from 'firebase/firestore';

// Cek apakah titik (lat, lng) berada di dalam polygon menggunakan ray-casting
function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Cek apakah titik berada dalam radius (meter) dari pusat
function isPointInRadius(lat: number, lng: number, centerLat: number, centerLng: number, radiusM: number): boolean {
  const R = 6371000;
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLng = ((lng - centerLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((centerLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance <= radiusM;
}

export function AttendanceAction({ profile }: { profile: any }) {
  const [step, setStep] = useState<'start' | 'verification' | 'success'>('start');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInside, setIsInside] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLocation({ lat: userLat, lng: userLng });

        try {
          // Ambil semua lokasi dari Firestore dan cek geofence
          const snap = await getDocs(collection(db, 'locations'));
          let found = false;
          let foundName = '';

          // Tentukan lokasi yang diizinkan untuk pegawai ini
          const allowedNames = profile.attendanceLocations?.length > 0 
            ? profile.attendanceLocations 
            : [profile.tempatTugas];

          for (const docSnap of snap.docs) {
            const loc = docSnap.data();

            // Hanya periksa jika lokasi ini diizinkan untuk pegawai
            if (!allowedNames.includes(loc.name)) continue;

            // Cek polygon dulu (lebih akurat)
            if (loc.points && loc.points.length >= 3) {
              const parsedPoints = loc.points.map((p: any) => ({
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lng)
              }));
              if (isPointInPolygon(userLat, userLng, parsedPoints)) {
                found = true;
                foundName = loc.name;
                break;
              }
            }

            // Fallback ke radius jika tidak ada polygon
            if (!found && loc.latitude && loc.longitude && loc.radius) {
              if (isPointInRadius(userLat, userLng, parseFloat(loc.latitude), parseFloat(loc.longitude), parseFloat(loc.radius))) {
                found = true;
                foundName = loc.name;
                break;
              }
            }
          }

          setIsInside(found);
          setLocationName(foundName);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'locations');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Izin GPS ditolak. Silakan izinkan akses lokasi di pengaturan browser Anda.');
        } else if (err.code === 2) {
          setGeoError('Sinyal GPS tidak ditemukan. Pastikan GPS/Lokasi HP Anda menyala.');
        } else if (err.code === 3) {
          setGeoError('Waktu permintaan GPS habis (Timeout). Coba cari area terbuka.');
        } else {
          setGeoError(`GPS Error: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleProcess = async () => {
    setLoading(true);
    // Simulate Face Recognition delay
    setTimeout(async () => {
      try {
        let finalStatus = 'HADIR'; // Default
        
        // 1. Ambil detail shift karyawan (jika ada)
        if (profile.shiftId) {
          try {
            const shiftDoc = await getDoc(doc(db, 'shifts', profile.shiftId));
            if (shiftDoc.exists()) {
              const shiftData = shiftDoc.data();
              const startTime = shiftData.startTime || '08:00';
              const tolerance = parseInt(shiftData.lateTolerance || '15');
              
              // Hitung waktu saat ini dalam menit (sejak tengah malam)
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              
              // Hitung batas waktu masuk dalam menit
              const [startHour, startMin] = startTime.split(':').map(Number);
              const allowedMinutes = (startHour * 60) + startMin + tolerance;
              
              if (currentMinutes > allowedMinutes) {
                finalStatus = 'LATE';
              }
            }
          } catch (shiftErr) {
            console.error("Gagal mengambil data shift:", shiftErr);
          }
        } else {
          // Jika tidak ada shiftId, gunakan default 08:15 (08:00 + 15 menit)
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const defaultAllowedMinutes = (8 * 60) + 15; // 08:15
          if (currentMinutes > defaultAllowedMinutes) {
            finalStatus = 'LATE';
          }
        }

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
          status: finalStatus
        });
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setStep('success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'attendance');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  // Start camera when entering verification step
  useEffect(() => {
    if (step === 'verification') {
      startCamera();
    }
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Izin kamera ditolak. Aktifkan di pengaturan browser.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan.');
      } else {
        setCameraError('Gagal mengakses kamera.');
      }
    }
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
              <div className={`flex items-center gap-3.5 rounded-xl p-4 border transition-all ${
                geoLoading
                  ? 'bg-slate-50 border-slate-200'
                  : isInside
                  ? 'bg-green-50/50 border-green-100'
                  : 'bg-red-50/50 border-red-100'
              }`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 text-white ${
                  geoLoading ? 'bg-slate-400' : isInside ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {geoLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Navigation className="h-4 w-4" />
                    </motion.div>
                  ) : isInside ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${
                    geoLoading ? 'text-slate-500' : isInside ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {geoLoading
                      ? 'Mendeteksi Lokasi...'
                      : isInside
                      ? `Di Dalam Area${locationName ? ` — ${locationName}` : ''}`
                      : 'Di Luar Area Kerja'}
                  </h4>
                  <p className={`text-[10px] font-medium mt-0.5 truncate ${
                    geoLoading ? 'text-slate-400' : isInside ? 'text-green-700/70' : 'text-red-700/70'
                  }`}>
                    {location
                      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                      : geoLoading
                      ? 'Meminta izin GPS...'
                      : geoError || 'GPS tidak tersedia'}
                  </p>
                </div>
              </div>

              <button
                disabled={!isInside || loading || geoLoading}
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
            className="flex flex-col items-center text-center space-y-6"
          >
            {/* Video Camera Stream */}
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay scan frame */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 left-8 h-12 w-12 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute top-8 right-8 h-12 w-12 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute bottom-8 left-8 h-12 w-12 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute bottom-8 right-8 h-12 w-12 border-b-4 border-r-4 border-blue-500" />
                
                {/* Scanning line animation */}
                <motion.div
                  animate={{ y: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"
                />
              </div>

              {/* Camera error overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-6">
                  <div className="text-center space-y-3">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                    <p className="text-sm text-white font-semibold">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="text-xs text-blue-400 hover:underline font-bold uppercase tracking-wide"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Memverifikasi Wajah</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium max-w-[200px] mx-auto leading-relaxed">
                Posisikan wajah Anda tepat di tengah layar
              </p>
            </div>
            
            <button 
              onClick={handleProcess}
              disabled={!!cameraError}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Camera className="h-4 w-4" /> Capture & Absen
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
