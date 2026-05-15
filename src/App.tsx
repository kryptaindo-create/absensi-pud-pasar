/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { LoadingScreen } from './components/ui/LoadingScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check if we have a demo session
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      const parsed = JSON.parse(demoUser);
      setUser(parsed as User);
      setProfile({
        name: parsed.displayName || 'Developer Admin',
        role: parsed.role || 'MasterAdmin',
        nipp: 'DEV-001',
        status: 'Active',
        email: parsed.email || 'dev@pudpasar.com'
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          } else {
            // User exists in Auth but not in Firestore - likely a fresh Google login
            setProfile(null);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  // If user is authenticated but no profile exists, they need to register their data
  if (user && !profile) {
    return <Register onSwitch={() => auth.signOut()} />;
  }

  if (!user) {
    return view === 'login' ? (
      <Login onSwitch={() => setView('register')} />
    ) : (
      <Register onSwitch={() => setView('login')} />
    );
  }

  if (profile?.status === 'Pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Akun Menunggu Persetujuan</h2>
          <p className="mt-4 text-gray-600">
            Terima kasih telah mendaftar. Akun Anda sedang diverifikasi oleh Bagian Kepegawaian. Silakan cek kembali nanti.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('demo_user');
              auth.signOut();
              window.location.reload();
            }}
            className="mt-6 w-full rounded-xl bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = ['SuperMaster', 'MasterAdmin', 'Admin'].includes(profile?.role);

  return isAdmin ? <AdminDashboard profile={profile} /> : <Dashboard profile={profile} />;
}

