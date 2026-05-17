const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function untuk membuat akun pegawai baru
 * Hanya bisa dipanggil oleh admin (SuperMaster, MasterAdmin, Admin)
 */
exports.createEmployee = functions.https.onCall(async (data, context) => {
  // 1. Validasi: harus login
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Harus login untuk mengakses fungsi ini.');
  }

  // 2. Validasi: harus admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Profil user tidak ditemukan.');
  }

  const callerRole = callerDoc.data().role;
  if (!['SuperMaster', 'MasterAdmin', 'Admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Hanya admin yang dapat membuat akun pegawai.');
  }

  // 3. Validasi input
  const { email, password, name, role, nipp, jabatan, golongan, tempatTugas } = data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, password, dan nama wajib diisi.');
  }

  if (password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password minimal 6 karakter.');
  }

  try {
    // 4. Buat akun Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // 5. Buat dokumen Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      role: role || 'Employee',
      status: 'Active',
      nipp: nipp || '',
      jabatan: jabatan || '',
      golongan: golongan || '',
      tempatTugas: tempatTugas || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
    });

    // 6. Log audit
    await admin.firestore().collection('audit_logs').add({
      action: 'CREATE_EMPLOYEE',
      performedBy: callerUid,
      performedByEmail: context.auth.token.email,
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { name, role: role || 'Employee', nipp },
    });

    return {
      success: true,
      uid: userRecord.uid,
      email,
      message: `Akun ${name} berhasil dibuat.`,
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Email sudah terdaftar.');
    }
    
    throw new functions.https.HttpsError('internal', `Gagal membuat akun: ${error.message}`);
  }
});

/**
 * Cloud Function untuk reset password pegawai
 * Hanya bisa dipanggil oleh admin
 */
exports.resetEmployeePassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Harus login.');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || !['SuperMaster', 'MasterAdmin', 'Admin'].includes(callerDoc.data().role)) {
    throw new functions.https.HttpsError('permission-denied', 'Hanya admin yang dapat reset password.');
  }

  const { uid, newPassword } = data;

  if (!uid || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'UID dan password baru wajib diisi.');
  }

  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password minimal 6 karakter.');
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });

    await admin.firestore().collection('audit_logs').add({
      action: 'RESET_PASSWORD',
      performedBy: callerUid,
      performedByEmail: context.auth.token.email,
      targetUserId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Password berhasil direset.' };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError('internal', `Gagal reset password: ${error.message}`);
  }
});
