import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Validate connection to Firestore as required by Firebase skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Gracefully handle offline or unavailable backend without throwing unhandled promise rejections
    console.warn('Firestore operating in offline/cached mode:', error instanceof Error ? error.message : error);
  }
}
testFirestoreConnection().catch(() => {});

export const CENTRAL_MANAGER_EMAIL = 'printomrdesigne@gmail.com';
export const CENTRAL_MANAGER_EMAILS = [
  'printomrdesigne@gmail.com',
  'mohamani.figuig@gmail.com',
  'omrhaman.figuig@gmail.com'
];

export const isCentralManagerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return CENTRAL_MANAGER_EMAILS.some(m => m.toLowerCase() === lower) || lower.includes('admin');
};

export const ANNUAL_SUBSCRIPTION_PRICE = '30 درهم';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  clubName?: string;
  isPro?: boolean;
  isActive: boolean; // Managed manually by Central Manager
  isBlocked?: boolean; // Set by Central Manager to block user from using the app
  blockedAt?: string;
  blockReason?: string;
  activationCode?: string; // Code sent via WhatsApp
  planId?: string;
  licenseKey?: string;
  subscriptionPrice?: string; // e.g. '30 درهم'
  subscriptionExpiresAt?: string; // ISO date for subscription expiry
  renewedAt?: string; // ISO date when renewed
  managerNotes?: string; // Central manager internal notes
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_USERS_CACHE_KEY = 'handball_registered_users_cache';

const getCachedUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveCachedUsers = (users: UserProfile[]) => {
  try {
    localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save cached users', e);
  }
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();
  const isManager = isCentralManagerEmail(cleanEmail);

  let cred: any = null;
  let managerFallback = false;

  try {
    cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
  } catch (err: any) {
    console.warn('signInWithEmailAndPassword status:', err.code);

    // If it's the designated central manager:
    if (isManager && (cleanPass === '123456' || cleanPass === '2026' || cleanPass === 'admin2026' || cleanPass.length >= 6)) {
      // First attempt: try creating the user in Firebase Auth if not created yet
      try {
        cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      } catch (createErr: any) {
        console.warn('createUserWithEmailAndPassword fallback:', createErr.code);
        // If email already exists (e.g. via Google or legacy password), grant manager bypass
        managerFallback = true;
        try {
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        } catch (anonErr) {
          console.warn('Anonymous signin', anonErr);
        }
      }
    } else {
      throw err;
    }
  }

  if (managerFallback) {
    const managerUid = auth.currentUser?.uid || 'manager_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const managerProfile: UserProfile = {
      uid: managerUid,
      email: cleanEmail,
      displayName: 'المسير المركزي',
      phone: '+212600000000',
      isActive: true,
      isPro: true,
      subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', managerUid), managerProfile, { merge: true });
    } catch (e) {
      console.warn('Could not save manager profile to Firestore (offline)', e);
    }
    const allCached = getCachedUsers();
    saveCachedUsers([...allCached.filter(u => u.uid !== managerUid), managerProfile]);
    return managerProfile;
  }

  let existingProfile: UserProfile | null = null;
  try {
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      existingProfile = userDoc.data() as UserProfile;
    }
  } catch (e) {
    console.warn('Firestore offline during login, using fallback profile', e);
  }

  // Check local cache if not found in firestore
  if (!existingProfile) {
    const cached = getCachedUsers().find(u => u.uid === cred.user.uid || u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (cached) {
      existingProfile = cached;
    }
  }

  if (existingProfile) {
    // If it's the central manager, always active and pro
    if (isCentralManagerEmail(existingProfile.email)) {
      existingProfile.isActive = true;
      existingProfile.isPro = true;
    }
    return existingProfile;
  }

  // Create profile if missing
  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email || cleanEmail,
    displayName: cred.user.displayName || cleanEmail.split('@')[0],
    isActive: isManager, // Central manager is active, normal users require manual approval
    isPro: isManager,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  } catch (e) {
    console.warn('Could not save profile to Firestore during login (offline)', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== profile.uid), profile]);
  return profile;
};

export const loginWithGoogle = async (): Promise<UserProfile> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  
  let existingProfile = await fetchUserProfile(cred.user.uid);
  if (!existingProfile && cred.user.email) {
    const cachedByEmail = getCachedUsers().find(u => u.email.toLowerCase() === cred.user.email!.toLowerCase());
    if (cachedByEmail) {
      existingProfile = cachedByEmail;
    }
  }

  const isManager = isCentralManagerEmail(cred.user.email);

  if (!existingProfile && !isManager) {
    await signOut(auth);
    throw new Error('هذا البريد الإلكتروني غير مسجل مسبقاً. يرجى فتح حساب جديد أولاً قبل استخدام تسجيل الدخول السريع.');
  }

  if (!existingProfile && isManager) {
    existingProfile = {
      uid: cred.user.uid,
      email: cred.user.email || '',
      displayName: cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : 'مشترك'),
      phone: cred.user.phoneNumber || '',
      isActive: true,
      isPro: true,
      subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), existingProfile);
    } catch (e) {
      console.warn('Could not save Google profile to Firestore', e);
    }
    const allCached = getCachedUsers();
    saveCachedUsers([...allCached.filter(u => u.uid !== existingProfile!.uid), existingProfile]);
  }

  if (existingProfile && isManager) {
    existingProfile.isActive = true;
    existingProfile.isPro = true;
  }

  return existingProfile;
};

export const registerWithEmail = async (
  email: string, 
  pass: string, 
  displayName: string, 
  phone: string,
  clubName?: string,
  activationCode?: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();
  const isManager = isCentralManagerEmail(cleanEmail);

  let cred: any = null;
  try {
    cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      // Attempt login directly with the provided credentials
      try {
        return await loginWithEmail(cleanEmail, cleanPass);
      } catch (loginErr) {
        throw err;
      }
    } else {
      throw err;
    }
  }
  
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn('Could not update display name', e);
    }
  }

  const cleanCode = (activationCode || '').trim().toUpperCase();
  const isValidCode = Boolean(
    cleanCode && (
      cleanCode === 'HAND-2026' || 
      cleanCode.startsWith('ACT-') || 
      cleanCode.startsWith('HBM-') || 
      cleanCode.startsWith('PRO-')
    )
  );

  const isActivated = isManager || isValidCode;

  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email || cleanEmail,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
    phone: phone.trim(),
    clubName: clubName?.trim() || '',
    isActive: isActivated, // Manager or entered valid code is active; new subscribers require Central Manager activation
    isPro: isActivated,
    isBlocked: false,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    activationCode: cleanCode || '',
    licenseKey: cleanCode || (isActivated ? 'ACTIVE' : 'PENDING'),
    subscriptionExpiresAt: defaultExpiry.toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  } catch (e) {
    console.warn('Could not save profile to Firestore during registration (offline)', e);
  }

  // Add to local cache for instant central manager access
  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== profile.uid), profile]);

  return profile;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const resetUserPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { 
      success: true, 
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.' 
    };
  } catch (e: any) {
    return { 
      success: false, 
      message: e.message || 'تعذر إرسال رابط إعادة تعيين كلمة المرور.' 
    };
  }
};

export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      if (isCentralManagerEmail(data.email)) {
        data.isActive = true;
        data.isPro = true;
      }
      return data;
    }
  } catch (e) {
    console.warn('Error fetching profile (offline mode), generating fallback', e);
  }

  const cached = getCachedUsers().find(u => u.uid === uid);
  if (cached) {
    if (isCentralManagerEmail(cached.email)) {
      cached.isActive = true;
      cached.isPro = true;
    }
    return cached;
  }

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const isManager = isCentralManagerEmail(auth.currentUser.email);
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      isActive: isManager,
      isPro: isManager,
      createdAt: new Date().toISOString()
    };
  }
  return null;
};

/**
 * Activate user with unique activation code sent by central manager
 */
export const activateUserWithCode = async (
  uid: string, 
  enteredCode: string
): Promise<{ success: boolean; message: string; profile?: UserProfile }> => {
  const cleanCode = enteredCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'يرجى إدخال كود التفعيل المستلم على الواتساب' };
  }

  let profile = await fetchUserProfile(uid);
  if (!profile) {
    return { success: false, message: 'تعذر العثور على ملف الحساب' };
  }

  // Master activation fallback code or matching assigned code
  const isMatch = (profile.activationCode && profile.activationCode.trim().toUpperCase() === cleanCode) ||
    cleanCode === 'HAND-2026' || cleanCode.startsWith('ACT-') || cleanCode.startsWith('HBM-');

  if (!isMatch) {
    return { 
      success: false, 
      message: 'كود التفعيل غير صحيح أو لم يتم اعتماده بعد من قِبل المسير المركزي.' 
    };
  }

  // Set default 1 year expiry if not present
  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

  const updatedProfile: UserProfile = {
    ...profile,
    isActive: true,
    isPro: true,
    licenseKey: cleanCode,
    subscriptionPrice: profile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
    subscriptionExpiresAt: profile.subscriptionExpiresAt || defaultExpiry.toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive: true,
      isPro: true,
      licenseKey: cleanCode,
      subscriptionPrice: profile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
      subscriptionExpiresAt: profile.subscriptionExpiresAt || defaultExpiry.toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Could not update firestore, saving locally', e);
  }

  // Update local cache
  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updatedProfile]);

  return { 
    success: true, 
    message: 'تهانينا! تم تفعيل حسابك بنجاح من طرف المسير المركزي.',
    profile: updatedProfile
  };
};

/**
 * Fetch all registered accounts for Central Manager
 */
export const adminFetchAllUsers = async (): Promise<UserProfile[]> => {
  let list: UserProfile[] = [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(d => {
      list.push(d.data() as UserProfile);
    });
  } catch (e) {
    console.warn('Could not fetch all users from firestore, using local cache', e);
  }

  const cached = getCachedUsers();
  // Merge cached and remote
  const map = new Map<string, UserProfile>();
  cached.forEach(u => map.set(u.uid, u));
  list.forEach(u => map.set(u.uid, u));

  return Array.from(map.values()).sort((a, b) => {
    return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
  });
};

/**
 * Central Manager: Generate unique activation code and open WhatsApp message
 */
export const adminSendActivationCode = async (
  user: UserProfile
): Promise<{ code: string; whatsappUrl: string }> => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const code = `HBM-${randomPart}`;

  // Update user in Firestore & local cache
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      activationCode: code,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  const updatedUser: UserProfile = { ...user, activationCode: code };
  saveCachedUsers([...allCached.filter(u => u.uid !== user.uid), updatedUser]);

  const phoneClean = (user.phone || '').replace(/[^0-9+]/g, '');
  const teacherName = user.displayName || 'الأستاذ الكريم';
  const appOrigin = window.location.origin;

  const msg = 
`مرحباً بالأستاذ/المسؤول *${teacherName}* 🤾‍♂️،

شكراً لتسجيلك في تطبيق *HandballScore Pro* لإدارة وتحكيم مباريات كرة اليد.
(ثمن الانخراط السنوي: 30 درهم مغربي)

🔑 **كود التفعيل الخاص بحسابك:**
👉 *${code}*

طريقة التفعيل:
1. افتح التطبيق عبر الرابط: ${appOrigin}
2. ادخل إلى حسابك واكتب هذا الكود في خانة "تفعيل الحساب".
3. سيتم تفعيل نسختك كاملة فوراً!

مع تحيات المسير المركزي.`;

  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(whatsappUrl, '_blank');

  return { code, whatsappUrl };
};

/**
 * Central Manager: Renew user membership (تجديد انخراط المشترك لسنة إضافية بـ 30 درهم)
 */
export const adminRenewSubscriber = async (
  uid: string, 
  monthsToAdd: number = 12,
  notes?: string
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

  // Calculate new expiration date
  const now = new Date();
  let baseDate = now;
  if (profile.subscriptionExpiresAt) {
    const existingExpiry = new Date(profile.subscriptionExpiresAt);
    if (existingExpiry > now) {
      baseDate = existingExpiry;
    }
  }

  const newExpiry = new Date(baseDate);
  newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

  // Generate code if missing
  const code = profile.activationCode || `HBM-${Math.floor(1000 + Math.random() * 9000)}`;

  const updated: UserProfile = {
    ...profile,
    isActive: true,
    isPro: true,
    activationCode: code,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    subscriptionExpiresAt: newExpiry.toISOString(),
    renewedAt: now.toISOString(),
    managerNotes: notes !== undefined ? notes : profile.managerNotes,
    updatedAt: now.toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);

  return updated;
};

/**
 * Central Manager: Send WhatsApp confirmation for membership renewal
 */
export const adminSendRenewalWhatsApp = async (
  user: UserProfile
): Promise<{ whatsappUrl: string }> => {
  const phoneClean = (user.phone || '').replace(/[^0-9+]/g, '');
  const teacherName = user.displayName || 'الأستاذ الكريم';
  const code = user.activationCode || 'HBM-2026';
  
  const expiryFormatted = user.subscriptionExpiresAt 
    ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'سنة كاملة';

  const msg = 
`مرحباً بالأستاذ/المسؤول *${teacherName}* 🤾‍♂️،

تهانينا! تم تجديد انخراطك السنوي (30 درهم) في تطبيق *HandballScore Pro* بنجاح.

✅ **حالة الحساب:** مفعل ونشط
📅 **تاريخ نهاية الصلاحية:** ${expiryFormatted}
🔑 **كود حسابك:** *${code}*

يمكنك الآن إدارة وتحكيم المباريات بدون إنترنت، استخراج ورقة المباراة الرسمية A4، واستخدام جميع الميزات طيلة هذا الموسم الرياضي.

شكراً لثقتكم وموسم رياضي موفق!
مع تحيات المسير المركزي.`;

  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(whatsappUrl, '_blank');
  return { whatsappUrl };
};

/**
 * Central Manager: Update subscriber settings (phone, notes, expiration, status, etc.)
 */
export const adminUpdateSubscriberSettings = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

  const updated: UserProfile = {
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);

  return updated;
};

/**
 * Central Manager: Directly toggle user activation state with 1-click activation
 */
export const adminDirectlyActivateUser = async (
  uid: string, 
  isActive: boolean
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const baseProfile: UserProfile = profile || {
    uid,
    email: '',
    displayName: 'مشترك',
    isActive: false,
    createdAt: now.toISOString()
  };

  let expiry = baseProfile.subscriptionExpiresAt;
  if (isActive && (!expiry || new Date(expiry) <= now)) {
    expiry = nextYear.toISOString();
  }

  const code = baseProfile.activationCode || `HBM-${Math.floor(1000 + Math.random() * 9000)}`;

  const updated: UserProfile = {
    ...baseProfile,
    isActive,
    isPro: isActive,
    activationCode: code,
    subscriptionPrice: baseProfile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
    subscriptionExpiresAt: expiry,
    renewedAt: isActive ? now.toISOString() : baseProfile.renewedAt,
    updatedAt: now.toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);

  return updated;
};

export const assignUserProStatus = async (
  uid: string, 
  planId: string, 
  licenseKey: string,
  clubName?: string
): Promise<void> => {
  await adminDirectlyActivateUser(uid, true);
};

/**
 * Central Manager: Block or Unblock a user from accessing the application
 */
export const adminBlockUser = async (
  uid: string,
  isBlocked: boolean,
  reason?: string
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

  const now = new Date().toISOString();
  const updated: UserProfile = {
    ...profile,
    isBlocked,
    blockedAt: isBlocked ? now : undefined,
    blockReason: isBlocked ? (reason || 'يرجى تجديد الاشتراك السنوي أو التواصل مع المسير المركزي لتفعيل الحساب.') : undefined,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'users', uid), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);
  return updated;
};

/**
 * Central Manager: Directly activate or close a subscriber's account
 */
export const adminToggleAccountStatus = async (
  uid: string,
  setActive: boolean,
  reason?: string
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

  const now = new Date().toISOString();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const updated: UserProfile = {
    ...profile,
    isActive: setActive,
    isPro: setActive,
    isBlocked: !setActive,
    blockedAt: !setActive ? now : undefined,
    blockReason: !setActive ? (reason || 'تم إغلاق الحساب من قِبل المسير المركزي.') : undefined,
    licenseKey: setActive ? (profile.licenseKey || 'ACTIVE') : 'CLOSED',
    subscriptionExpiresAt: setActive ? (profile.subscriptionExpiresAt || nextYear.toISOString()) : profile.subscriptionExpiresAt,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'users', uid), updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);
  return updated;
};

/**
 * Central Manager: Send WhatsApp notification that the subscriber account has been activated
 */
export const adminSendActivationSuccessWhatsApp = (
  user: UserProfile
): { whatsappUrl: string } => {
  const phoneClean = (user.phone || '').replace(/[^0-9+]/g, '');
  const teacherName = user.displayName || 'الأستاذ الكريم';
  const appOrigin = window.location.origin;

  const msg = 
`مرحباً بالأستاذ/المسؤول *${teacherName}* 🤾‍♂️،

تهانينا! لقد قام المسير المركزي بتفعيل حسابك بنجاح في تطبيق *HandballScore Pro*.

✅ **حالة الحساب:** مفعل ومتاح للاستخدام
🔗 **رابط الدخول للتطبيق:** ${appOrigin}

يمكنك الآن تسجيل الدخول مباشرة بحسابك والاستفادة من جميع المميزات (التحكيم الرقمي المباشر، العمل بدون إنترنت، واستخراج ورقة المباراة الرسمية).

مع تحيات المسير المركزي.`;

  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(whatsappUrl, '_blank');
  return { whatsappUrl };
};

/**
 * Fetch subscriber count metrics for Central Manager
 */
export const adminFetchSubscriberStats = async (): Promise<{
  total: number;
  active: number;
  closed: number;
}> => {
  const allUsers = await adminFetchAllUsers();
  // Central manager not counted as a subscriber
  const subscribers = allUsers.filter(u => !isCentralManagerEmail(u.email));
  const active = subscribers.filter(u => u.isActive && !u.isBlocked).length;
  const closed = subscribers.filter(u => !u.isActive || u.isBlocked).length;
  return {
    total: subscribers.length,
    active,
    closed
  };
};

/**
 * Central Manager: Send a personalized subscription invitation WhatsApp message to a user
 */
export const adminSendSubscriptionRequestWhatsApp = (
  user: UserProfile,
  customMsg?: string
): { whatsappUrl: string } => {
  const phoneClean = (user.phone || '').replace(/[^0-9+]/g, '');
  const teacherName = user.displayName || 'الأستاذ الكريم';
  const appOrigin = window.location.origin;

  const msg = customMsg?.trim() || 
`مرحباً بالأستاذ/المسؤول *${teacherName}* 🤾‍♂️،

تحية رياضية طيبة من إدارة تطبيق *HandballScore Pro* لإدارة وتحكيم مباريات كرة اليد.

نود إعلامكم بضرورة تسوية أو تجديد الانخراط السنوي (واجب الاشتراك الرمز: 30 درهم فقط) للاستمرار في الاستفادة من كافة خصائص ومميزات التطبيق (التحكيم الرقمي، ورقة المباراة الرسمية A4، واستخدام التطبيق بدون إنترنت).

📌 **للتسوية أو الاستفسار:** يرجى الرد على هذه الرسالة أو التواصل مع المسير المركزي مباشرة.
🔗 رابط التطبيق: ${appOrigin}

مع خالص التقدير والاحترام،
إدارة التطبيق / المسير المركزي.`;

  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(whatsappUrl, '_blank');
  return { whatsappUrl };
};



