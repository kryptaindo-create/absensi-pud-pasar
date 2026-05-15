export function checkSecurity() {
  const isEmulator = /Emulator|Android SDK|Genymotion/i.test(navigator.userAgent);
  const isDebug = (window as any).devtools?.isOpen; // naive check
  
  return {
    isRooted: false, // Cannot check in browser
    isEmulator,
    isDebug,
    isMockLocation: false, // Handled by complex logic usually, we simulate:
    trustScore: isEmulator ? 0.2 : 0.9
  };
}

export function useMotionWatchdog(onAlert: () => void) {
  let lastMove = Date.now();
  
  const handleScroll = () => { lastMove = Date.now(); };
  const handleMouseMove = () => { lastMove = Date.now(); };

  // In a real mobile app we'd use Accelerometer
  // Here we simulate activity check
  const interval = setInterval(() => {
    if (Date.now() - lastMove > 3600000) { // 1 hour
      onAlert();
    }
  }, 60000);

  return () => {
    clearInterval(interval);
  };
}
