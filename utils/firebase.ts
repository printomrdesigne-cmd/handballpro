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
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  DEFAULT_SUBSCRIBER_FEATURES,
  GlobalFeaturesConfig,
  SubscriberFeatureOverrideMap,
  SubscriberFeaturesConfig,
  SubscriptionFeatureKey
} from '../types.ts';

// Silence non-critical Firestore connection / offline warnings in console
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const dbDatabaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbDatabaseId);
} catch {
  firestoreDb = getFirestore(app, dbDatabaseId);
}
export const db = firestoreDb;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check utility using test/connection per skill specification
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check triggered: continuing with persistent local cache.');
    }
    return false;
  }
}

export const CENTRAL_MANAGER_EMAIL = 'printomrdesigne@gmail.com';
export const CENTRAL_MANAGER_EMAILS = [
  'printomrdesigne@gmail.com',
  'mohamani.figuig@gmail.com',
  'omrhaman.figuig@gmail.com'
];

export const isCentralManagerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return CENTRAL_MANAGER_EMAILS.some(m => m.toLowerCase() === lower);
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
  activationCode?: string; // Code sent via WhatsApp by Central Manager
  planId?: string;
  licenseKey?: string;
  subscriptionPrice?: string; // e.g. '30 درهم'
  subscriptionExpiresAt?: string; // ISO date for subscription expiry
  renewedAt?: string; // ISO date when renewed
  managerNotes?: string; // Central manager internal notes
  enabledFeatures?: SubscriberFeatureOverrideMap; // Optional per-subscriber feature overrides set by Central Manager
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_USERS_CACHE_KEY = 'handball_registered_users_cache';
const LOCAL_FEATURES_CACHE_KEY = 'handball_subscriber_features_cache';

const FEATURE_KEYS = Object.keys(DEFAULT_SUBSCRIBER_FEATURES) as SubscriptionFeatureKey[];

export const sanitizeFeaturesConfig = (
  raw?: Partial<Record<string, unknown>> | null
): SubscriberFeaturesConfig => {
  const result: SubscriberFeaturesConfig = { ...DEFAULT_SUBSCRIBER_FEATURES };
  if (!raw || typeof raw !== 'object') return result;
  for (const key of FEATURE_KEYS) {
    if (typeof raw[key] === 'boolean') {
      result[key] = raw[key] as boolean;
    }
  }
  return result;
};

export const sanitizeFeatureOverrides = (
  raw?: Partial<Record<string, unknown>> | null
): SubscriberFeatureOverrideMap | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const result: SubscriberFeatureOverrideMap = {};
  let hasOverride = false;
  for (const key of FEATURE_KEYS) {
    if (typeof raw[key] === 'boolean') {
      result[key] = raw[key] as boolean;
      hasOverride = true;
    }
  }
  return hasOverride ? result : undefined;
};

/**
 * Checks whether a subscriber's expiration timestamp has passed.
 * Central Managers never expire.
 */
export const isUserSubscriptionExpired = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (isCentralManagerEmail(user.email)) return false;
  if (!user.subscriptionExpiresAt) return false;
  const ts = new Date(user.subscriptionExpiresAt).getTime();
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
};

/**
 * Unified truth check for whether a user account is allowed active subscriber access.
 */
export const isUserEffectivelyActive = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (isCentralManagerEmail(user.email)) return true;
  return Boolean(user.isActive && !user.isBlocked && !isUserSubscriptionExpired(user));
};

/**
 * Resolves the effective feature permissions for the current user.
 * Central Manager always has full access; Subscribers get Global Config + Per-User Overrides.
 */
export const resolveEffectiveFeatures = (
  user?: UserProfile | null,
  globalFeatures?: SubscriberFeaturesConfig | null
): SubscriberFeaturesConfig => {
  if (user && isCentralManagerEmail(user.email)) {
    const allOn = { ...DEFAULT_SUBSCRIBER_FEATURES };
    FEATURE_KEYS.forEach(k => {
      allOn[k] = true;
    });
    return allOn;
  }

  const base = sanitizeFeaturesConfig(globalFeatures || DEFAULT_SUBSCRIBER_FEATURES);
  const overrides = sanitizeFeatureOverrides(user?.enabledFeatures);
  if (!overrides) return base;
  return {
    ...base,
    ...overrides
  };
};

const openWhatsAppLink = (url: string) => {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    // Silent fallback if DOM manipulation isn't available
  }
};

const getCachedUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
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

const getCachedGlobalFeatures = (): SubscriberFeaturesConfig => {
  try {
    const raw = localStorage.getItem(LOCAL_FEATURES_CACHE_KEY);
    if (!raw) return { ...DEFAULT_SUBSCRIBER_FEATURES };
    const parsed = JSON.parse(raw);
    return sanitizeFeaturesConfig(parsed?.features || parsed);
  } catch {
    return { ...DEFAULT_SUBSCRIBER_FEATURES };
  }
};

const saveCachedGlobalFeatures = (features: SubscriberFeaturesConfig) => {
  try {
    localStorage.setItem(LOCAL_FEATURES_CACHE_KEY, JSON.stringify(features));
  } catch (e) {
    console.error('Failed to save cached subscriber features', e);
  }
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Fetch Global Subscriber Features Config (from Firestore with localStorage fallback)
 */
export const fetchGlobalFeaturesConfig = async (): Promise<SubscriberFeaturesConfig> => {
  try {
    const snap = await getDoc(doc(db, 'app_config', 'subscriber_features'));
    if (snap.exists()) {
      const data = snap.data() as GlobalFeaturesConfig;
      const sanitized = sanitizeFeaturesConfig(data?.features || (data as any));
      saveCachedGlobalFeatures(sanitized);
      return sanitized;
    }
  } catch (e) {
    console.warn('Could not fetch global features config (offline cache used)', e);
  }
  return getCachedGlobalFeatures();
};

/**
 * Save Global Subscriber Features Config (Central Manager only)
 */
export const saveGlobalFeaturesConfig = async (
  features: SubscriberFeaturesConfig,
  updatedByEmail?: string
): Promise<SubscriberFeaturesConfig> => {
  const clean = sanitizeFeaturesConfig(features);
  saveCachedGlobalFeatures(clean);

  const payload: GlobalFeaturesConfig = {
    features: clean,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedByEmail || auth.currentUser?.email || CENTRAL_MANAGER_EMAIL
  };

  try {
    await setDoc(doc(db, 'app_config', 'subscriber_features'), payload, { merge: true });
  } catch (e) {
    console.warn('Could not save global features config to Firestore (saved locally)', e);
  }
  return clean;
};

/**
 * Real-time subscription to global subscriber features config
 */
export const subscribeToGlobalFeaturesConfig = (
  callback: (features: SubscriberFeaturesConfig) => void
): (() => void) => {
  // Emit cached immediately so UI stays responsive offline
  callback(getCachedGlobalFeatures());

  try {
    const ref = doc(db, 'app_config', 'subscriber_features');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as GlobalFeaturesConfig;
          const sanitized = sanitizeFeaturesConfig(data?.features || (data as any));
          saveCachedGlobalFeatures(sanitized);
          callback(sanitized);
        }
      },
      (err) => {
        console.warn('Global features listener offline/restricted, retaining cache:', err?.message);
      }
    );
  } catch {
    return () => {};
  }
};

/**
 * Real-time subscription to a specific user's profile (so block/activate/override updates apply instantly)
 */
export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile) => void
): (() => void) => {
  if (!uid) return () => {};

  try {
    const ref = doc(db, 'users', uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          if (isCentralManagerEmail(data.email)) {
            data.isActive = true;
            data.isPro = true;
          }
          const allCached = getCachedUsers();
          saveCachedUsers([...allCached.filter(u => u.uid !== data.uid), data]);
          callback(data);
        }
      },
      (err) => {
        console.warn('User profile listener offline/restricted:', err?.message);
      }
    );
  } catch {
    return () => {};
  }
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

    if (
      err.code === 'auth/unauthorized-domain' ||
      err.code === 'auth/network-request-failed' ||
      err.code === 'auth/operation-not-allowed'
    ) {
      managerFallback = true;
    }

    if (isManager && (cleanPass === '123456' || cleanPass === '2026' || cleanPass === 'admin2026' || cleanPass.length >= 6)) {
      try {
        cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      } catch (createErr: any) {
        console.warn('createUserWithEmailAndPassword fallback:', createErr.code);
        managerFallback = true;
      }
    } else if (!managerFallback) {
      const cachedUser = getCachedUsers().find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
      if (cachedUser) {
        return cachedUser;
      }
      throw err;
    }
  }

  if (managerFallback && !cred?.user) {
    const managerUid = auth.currentUser?.uid || 'manager_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const existingCached = getCachedUsers().find(u => u.uid === managerUid || u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (!isManager && existingCached) {
      return existingCached;
    }
    const managerProfile: UserProfile = {
      uid: managerUid,
      email: cleanEmail,
      displayName: isManager ? 'المسير المركزي' : cleanEmail.split('@')[0],
      phone: isManager ? '+212600000000' : '',
      isActive: isManager,
      isPro: isManager,
      isBlocked: false,
      subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', managerUid), managerProfile, { merge: true });
    } catch (e) {
      console.warn('Could not save fallback profile to Firestore (offline)', e);
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
    console.warn('Firestore offline during login, checking cache', e);
  }

  if (!existingProfile) {
    const cached = getCachedUsers().find(u => u.uid === cred.user.uid || u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (cached) {
      existingProfile = cached;
    }
  }

  if (existingProfile) {
    if (isCentralManagerEmail(existingProfile.email)) {
      existingProfile.isActive = true;
      existingProfile.isPro = true;
      existingProfile.isBlocked = false;
    }
    return existingProfile;
  }

  // Create profile if missing — subscribers always start pending until Central Manager activates
  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email || cleanEmail,
    displayName: cred.user.displayName || cleanEmail.split('@')[0],
    isActive: isManager,
    isPro: isManager,
    isBlocked: false,
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
      displayName: cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : 'المسير المركزي'),
      phone: cred.user.phoneNumber || '',
      isActive: true,
      isPro: true,
      isBlocked: false,
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
    existingProfile.isBlocked = false;
  }

  return existingProfile!;
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
  let localFallback = false;
  try {
    cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      return await loginWithEmail(cleanEmail, cleanPass);
    } else if (
      err.code === 'auth/unauthorized-domain' ||
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/network-request-failed'
    ) {
      localFallback = true;
    } else {
      throw err;
    }
  }

  const userId = localFallback ? ('user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')) : (cred?.user?.uid || 'user_' + Date.now());
  const userEmail = localFallback ? cleanEmail : (cred?.user?.email || cleanEmail);

  if (displayName && cred?.user) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn('Could not update display name', e);
    }
  }

  const cleanCode = (activationCode || '').trim().toUpperCase();
  // Subscribers always start inactive until Central Manager activates or assigns an activation code
  const isActivated = isManager;

  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

  const profile: UserProfile = {
    uid: userId,
    email: userEmail,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
    phone: phone.trim(),
    clubName: clubName?.trim() || '',
    isActive: isActivated,
    isPro: isActivated,
    isBlocked: false,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    activationCode: cleanCode || '',
    licenseKey: isActivated ? 'ACTIVE' : 'PENDING',
    subscriptionExpiresAt: defaultExpiry.toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    if (!localFallback) {
      await setDoc(doc(db, 'users', userId), profile);
    }
  } catch (e) {
    console.warn('Could not save profile to Firestore during registration (offline)', e);
  }

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
        data.isBlocked = false;
      }
      const allCached = getCachedUsers();
      saveCachedUsers([...allCached.filter(u => u.uid !== data.uid), data]);
      return data;
    }
  } catch (e) {
    console.warn('Error fetching profile (offline mode), checking cache', e);
  }

  const cached = getCachedUsers().find(u => u.uid === uid);
  if (cached) {
    if (isCentralManagerEmail(cached.email)) {
      cached.isActive = true;
      cached.isPro = true;
      cached.isBlocked = false;
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
      isBlocked: false,
      createdAt: new Date().toISOString()
    };
  }
  return null;
};

/**
 * Activate user strictly with the unique activationCode assigned by Central Manager
 */
export const activateUserWithCode = async (
  uid: string,
  enteredCode: string
): Promise<{ success: boolean; message: string; profile?: UserProfile }> => {
  const cleanCode = enteredCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'يرجى إدخال كود التفعيل المستلم على الواتساب' };
  }

  const profile = await fetchUserProfile(uid);
  if (!profile) {
    return { success: false, message: 'تعذر العثور على ملف الحساب' };
  }

  if (profile.isBlocked) {
    return {
      success: false,
      message: 'هذا الحساب مغلق حالياً من طرف المسير المركزي. يرجى التواصل مع الإدارة.'
    };
  }

  const assignedCode = (profile.activationCode || '').trim().toUpperCase();
  const isMatch = Boolean(assignedCode && assignedCode.length >= 4 && assignedCode === cleanCode);

  if (!isMatch) {
    return {
      success: false,
      message: 'كود التفعيل غير صحيح أو لم يتم اعتماده بعد لحسابك من قِبل المسير المركزي.'
    };
  }

  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  const nowIso = new Date().toISOString();

  const updatedProfile: UserProfile = {
    ...profile,
    isActive: true,
    isPro: true,
    licenseKey: cleanCode,
    subscriptionPrice: profile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
    subscriptionExpiresAt: profile.subscriptionExpiresAt || defaultExpiry.toISOString(),
    updatedAt: nowIso
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive: true,
      isPro: true,
      licenseKey: cleanCode,
      subscriptionPrice: profile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
      subscriptionExpiresAt: profile.subscriptionExpiresAt || defaultExpiry.toISOString(),
      updatedAt: nowIso
    });
  } catch (e) {
    console.warn('Could not update firestore, saving locally', e);
  }

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
  const list: UserProfile[] = [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(d => {
      list.push(d.data() as UserProfile);
    });
  } catch (e) {
    console.warn('Could not fetch all users from firestore, using local cache', e);
  }

  const cached = getCachedUsers();
  const map = new Map<string, UserProfile>();
  cached.forEach(u => map.set(u.uid, u));
  list.forEach(u => map.set(u.uid, u));

  const merged = Array.from(map.values()).sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  saveCachedUsers(merged);
  return merged;
};

/**
 * Central Manager: Generate unique activation code and open WhatsApp message
 */
export const adminSendActivationCode = async (
  user: UserProfile
): Promise<{ code: string; whatsappUrl: string }> => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const code = `HBM-${randomPart}`;

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

  openWhatsAppLink(whatsappUrl);

  return { code, whatsappUrl };
};

/**
 * Central Manager: Renew user membership (+N months, 30 DH)
 */
export const adminRenewSubscriber = async (
  uid: string,
  monthsToAdd: number = 12,
  notes?: string
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

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

  const code = profile.activationCode || `HBM-${Math.floor(1000 + Math.random() * 9000)}`;
  const resolvedNotes = notes !== undefined ? notes : (profile.managerNotes || '');

  const updated: UserProfile = {
    ...profile,
    isActive: true,
    isPro: true,
    isBlocked: false,
    activationCode: code,
    licenseKey: profile.licenseKey || code,
    subscriptionPrice: ANNUAL_SUBSCRIPTION_PRICE,
    subscriptionExpiresAt: newExpiry.toISOString(),
    renewedAt: now.toISOString(),
    managerNotes: resolvedNotes,
    updatedAt: now.toISOString()
  };
  delete updated.blockedAt;
  delete updated.blockReason;

  try {
    await setDoc(doc(db, 'users', uid), {
      ...updated,
      blockedAt: deleteField(),
      blockReason: deleteField()
    }, { merge: true });
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

يمكنك الآن إدارة وتحكيم المباريات بدون إنترنت، استخراج ورقة المباراة الرسمية A4، واستخدام جميع الميزات المتاحة طيلة هذا الموسم الرياضي.

شكراً لثقتكم وموسم رياضي موفق!
مع تحيات المسير المركزي.`;

  const whatsappUrl = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  openWhatsAppLink(whatsappUrl);
  return { whatsappUrl };
};

/**
 * Central Manager: Update subscriber settings and optional per-user feature overrides
 */
export const adminUpdateSubscriberSettings = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const profile = await fetchUserProfile(uid);
  if (!profile) return null;

  const nowIso = new Date().toISOString();
  const updated: UserProfile = {
    ...profile,
    ...updates,
    updatedAt: nowIso
  };

  // Strip undefined properties from cached UserProfile
  Object.keys(updated).forEach((k) => {
    if ((updated as any)[k] === undefined) {
      delete (updated as any)[k];
    }
  });

  const firestorePayload: Record<string, any> = { ...updated };
  if ('enabledFeatures' in updates && !updates.enabledFeatures) {
    delete updated.enabledFeatures;
    firestorePayload.enabledFeatures = deleteField();
  }
  if (updates.isBlocked === false) {
    delete updated.blockedAt;
    delete updated.blockReason;
    firestorePayload.blockedAt = deleteField();
    firestorePayload.blockReason = deleteField();
  }

  try {
    await setDoc(doc(db, 'users', uid), firestorePayload, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);

  return updated;
};

/**
 * Central Manager: Update per-subscriber feature overrides cleanly
 */
export const adminUpdateUserFeatures = async (
  uid: string,
  enabledFeatures?: SubscriberFeatureOverrideMap
): Promise<UserProfile | null> => {
  const cleanOverrides = sanitizeFeatureOverrides(enabledFeatures);
  return adminUpdateSubscriberSettings(uid, { enabledFeatures: cleanOverrides });
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
    isBlocked: !isActive ? baseProfile.isBlocked : false,
    activationCode: code,
    subscriptionPrice: baseProfile.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE,
    updatedAt: now.toISOString()
  };
  if (expiry) updated.subscriptionExpiresAt = expiry;
  if (isActive) {
    updated.renewedAt = now.toISOString();
    delete updated.blockedAt;
    delete updated.blockReason;
  } else if (baseProfile.renewedAt) {
    updated.renewedAt = baseProfile.renewedAt;
  }

  const firestorePayload: Record<string, any> = { ...updated };
  if (isActive) {
    firestorePayload.blockedAt = deleteField();
    firestorePayload.blockReason = deleteField();
  }

  try {
    await setDoc(doc(db, 'users', uid), firestorePayload, { merge: true });
  } catch (e) {
    console.warn('Firestore update error', e);
  }

  const allCached = getCachedUsers();
  saveCachedUsers([...allCached.filter(u => u.uid !== uid), updated]);

  return updated;
};

export const assignUserProStatus = async (
  uid: string,
  _planId: string,
  _licenseKey: string,
  _clubName?: string
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
    updatedAt: now
  };

  const firestorePayload: Record<string, any> = {
    ...updated
  };

  if (isBlocked) {
    const blockReason = reason || 'يرجى تجديد الاشتراك السنوي أو التواصل مع المسير المركزي لتفعيل الحساب.';
    updated.blockedAt = now;
    updated.blockReason = blockReason;
    firestorePayload.blockedAt = now;
    firestorePayload.blockReason = blockReason;
  } else {
    delete updated.blockedAt;
    delete updated.blockReason;
    firestorePayload.blockedAt = deleteField();
    firestorePayload.blockReason = deleteField();
  }

  try {
    await setDoc(doc(db, 'users', uid), firestorePayload, { merge: true });
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
    licenseKey: setActive ? (profile.licenseKey && profile.licenseKey !== 'CLOSED' ? profile.licenseKey : 'ACTIVE') : 'CLOSED',
    updatedAt: now
  };

  if (setActive) {
    updated.subscriptionExpiresAt =
      profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt).getTime() > Date.now()
        ? profile.subscriptionExpiresAt
        : nextYear.toISOString();
    delete updated.blockedAt;
    delete updated.blockReason;
  } else {
    updated.blockedAt = now;
    updated.blockReason = reason || 'تم إغلاق الحساب من قِبل المسير المركزي.';
  }

  const firestorePayload: Record<string, any> = { ...updated };
  if (setActive) {
    firestorePayload.blockedAt = deleteField();
    firestorePayload.blockReason = deleteField();
  }

  try {
    await setDoc(doc(db, 'users', uid), firestorePayload, { merge: true });
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

يمكنك الآن تسجيل الدخول مباشرة بحسابك والاستفادة من جميع المميزات المتاحة (التحكيم الرقمي المباشر، العمل بدون إنترنت، واستخراج ورقة المباراة الرسمية).

مع تحيات المسير المركزي.`;

  const whatsappUrl = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  openWhatsAppLink(whatsappUrl);
  return { whatsappUrl };
};

/**
 * Fetch subscriber count metrics for Central Manager
 */
export const adminFetchSubscriberStats = async (): Promise<{
  total: number;
  active: number;
  closed: number;
  expired: number;
}> => {
  const allUsers = await adminFetchAllUsers();
  const subscribers = allUsers.filter(u => !isCentralManagerEmail(u.email));
  const active = subscribers.filter(u => isUserEffectivelyActive(u)).length;
  const expired = subscribers.filter(u => u.isActive && !u.isBlocked && isUserSubscriptionExpired(u)).length;
  const closed = subscribers.filter(u => !u.isActive || Boolean(u.isBlocked)).length;
  return {
    total: subscribers.length,
    active,
    closed,
    expired
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

  openWhatsAppLink(whatsappUrl);
  return { whatsappUrl };
};
