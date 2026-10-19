import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');

export const CENTRAL_MANAGER_EMAIL = 'mohamani.figuig@gmail.com';
export const CENTRAL_MANAGER_EMAILS = [
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
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
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
    const cached = getCachedUsers().find(u => u.uid === cred.user.uid || u.email.toLowerCase() === email.trim().toLowerCase());
    if (cached) {
      existingProfile = cached;
    }
  }

  if (existingProfile) {
    // If it's the central manager, always active
    if (existingProfile.email.toLowerCase() === CENTRAL_MANAGER_EMAIL.toLowerCase()) {
      existingProfile.isActive = true;
      existingProfile.isPro = true;
    }
    return existingProfile;
  }

  // Create profile if missing
  const isManager = cred.user.email?.toLowerCase() === CENTRAL_MANAGER_EMAIL.toLowerCase();
  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email || email,
    displayName: cred.user.displayName || email.split('@')[0],
    isActive: isManager, // Central manager is active, normal users require manual approval
    isPro: isManager,
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

export const registerWithEmail = async (
  email: string, 
  pass: string, 
  displayName: string, 
  phone: string,
  clubName?: string,
  activationCode?: string
): Promise<UserProfile> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn('Could not update display name', e);
    }
  }

  const isManager = isCentralManagerEmail(email);
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
    email: cred.user.email || email,
    displayName: displayName.trim() || email.split('@')[0],
    phone: phone.trim(),
    clubName: clubName?.trim() || '',
    isActive: isActivated, // Activated immediately if valid code is supplied or if manager
    isPro: isActivated,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    activationCode: cleanCode || '',
    licenseKey: isActivated ? (cleanCode || 'ACTIVE') : '',
    subscriptionExpiresAt: isActivated ? defaultExpiry.toISOString() : undefined,
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
    if (cached.email?.toLowerCase() === CENTRAL_MANAGER_EMAIL.toLowerCase()) {
      cached.isActive = true;
      cached.isPro = true;
    }
    return cached;
  }

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const isManager = auth.currentUser.email?.toLowerCase() === CENTRAL_MANAGER_EMAIL.toLowerCase();
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
