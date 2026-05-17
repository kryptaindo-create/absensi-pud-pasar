import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'framer-motion';

interface FaceEnrollmentProps {
  profile?: any;
  onClose?: () => void;
  onEnroll?: (descriptor: number[]) => void;
  isMandatory?: boolean;
}

export function FaceEnrollment({ profile, onClose, onEnroll, isMandatory }: FaceEnrollmentProps) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load models from CDN
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Gagal memuat model AI:", err);
        setError("Gagal memuat mesin AI. Pastikan koneksi internet stabil.");
      }
    };
    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Set up canvas dimensions to match video
    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    // Run detection loop
    const detectFace = async () => {
      if (!videoRef.current || !isModelLoaded || faceDescriptor || isDetecting) return;
      
      setIsDetecting(true);
      try {
        const detection = await faceapi.detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Draw detection box
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
          }
          
          setFaceDescriptor(detection.descriptor);
          stopCamera(); // Stop camera once we have a good capture
        }
      } catch (err) {
        console.error("Deteksi error:", err);
      }
      setIsDetecting(false);

      if (!faceDescriptor && streamRef.current) {
        requestAnimationFrame(detectFace);
      }
    };

    detectFace();
  };

  const handleSaveFace = async () => {
    if (!faceDescriptor) return;
    
    try {
      // Convert Float32Array to standard Array for Firestore
      const descriptorArray = Array.from(faceDescriptor) as number[];
      
      if (onEnroll) {
        // Jika ada callback, kirim data ke parent (contoh: Register.tsx)
        onEnroll(descriptorArray);
        setSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else if (profile) {
        // Jika profile ada (contoh: dari Dashboard), simpan langsung ke Firestore
        await updateDoc(doc(db, 'users', profile.uid || profile.id), {
          faceDescriptor: descriptorArray
        });
        setSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Gagal menyimpan data wajah:", err);
      setError("Gagal menyimpan data biometrik ke database.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden flex flex-col h-[90vh] md:h-auto"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pendaftaran Wajah</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Kunci Keamanan Biometrik</p>
          </div>
          {!isMandatory && onClose && (
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 relative bg-black flex flex-col justify-center overflow-hidden min-h-[300px]">
          {error ? (
            <div className="p-8 text-center text-white">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="font-bold">{error}</p>
            </div>
          ) : success ? (
            <div className="p-8 text-center text-white">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-2">Pendaftaran Berhasil!</h3>
              <p className="text-sm opacity-80">Wajah Anda telah dikunci di sistem.</p>
            </div>
          ) : (
            <div className="relative h-full w-full flex items-center justify-center">
              {!isModelLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Memuat Mesin AI...</p>
                  <p className="text-[9px] mt-2 opacity-60">Membutuhkan koneksi internet stabil (±5MB)</p>
                </div>
              )}
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                onPlay={handleVideoPlay}
                className={`w-full h-full object-cover ${faceDescriptor ? 'opacity-50 grayscale' : ''}`}
              />
              <canvas 
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover z-10"
              />

              {/* Target Guide */}
              {!faceDescriptor && isModelLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                   <div className="w-64 h-64 border-4 border-dashed border-white/50 rounded-full relative">
                      <div className="absolute inset-x-0 bottom-[-40px] text-center text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
                        Posisikan Wajah Di Tengah
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white z-10">
          {faceDescriptor ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-green-900">Wajah berhasil dipindai dengan akurasi tinggi. Siap untuk disimpan ke database.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setFaceDescriptor(null);
                    if (canvasRef.current) {
                      const ctx = canvasRef.current.getContext('2d');
                      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                    startCamera();
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Ulangi
                </button>
                <button 
                  onClick={handleSaveFace}
                  className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                >
                  Simpan Wajah
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
              Sistem akan mendeteksi wajah Anda secara otomatis
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
