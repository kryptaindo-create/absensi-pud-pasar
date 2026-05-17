import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="h-12 w-12 rounded-lg bg-blue-600 shadow-lg"
      />
      <p className="mt-4 animate-pulse text-sm font-medium text-gray-500 tracking-wide">
        MEMUAT SISTEM ABSENSI...
      </p>
    </div>
  );
}
