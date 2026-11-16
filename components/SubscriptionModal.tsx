import React, { useState, useEffect } from 'react';
import {
  SubscriptionState,
  AppLanguage,
  SubscriberFeaturesConfig,
  SubscriberFeatureOverrideMap,
  SubscriptionFeatureKey,
  DEFAULT_SUBSCRIBER_FEATURES,
  SUBSCRIPTION_FEATURES_CATALOG
} from '../types.ts';
import {
  adminFetchAllUsers,
  adminSendActivationCode,
  activateUserWithCode,
  adminRenewSubscriber,
  adminSendRenewalWhatsApp,
  adminUpdateSubscriberSettings,
  adminSendSubscriptionRequestWhatsApp,
  adminToggleAccountStatus,
  adminSendActivationSuccessWhatsApp,
  saveGlobalFeaturesConfig,
  isUserSubscriptionExpired,
  isUserEffectivelyActive,
  sanitizeFeaturesConfig,
  sanitizeFeatureOverrides,
  UserProfile,
  isCentralManagerEmail,
  ANNUAL_SUBSCRIPTION_PRICE
} from '../utils/firebase.ts';
import {
  KeyRound,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Phone,
  Mail,
  Lock,
  Building,
  Search,
  Settings,
  Calendar,
  RotateCw,
  Save,
  Ban,
  RefreshCw,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onUpdateSubscription: (state: SubscriptionState) => void;
  currentUser?: UserProfile | null;
  onUpdateCurrentUser?: (profile: UserProfile | null) => void;
  globalFeatures?: SubscriberFeaturesConfig;
  onUpdateGlobalFeatures?: (features: SubscriberFeaturesConfig) => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
  initialTab?: 'activate' | 'manager' | 'features';
}

const FEATURE_KEYS = Object.keys(DEFAULT_SUBSCRIBER_FEATURES) as SubscriptionFeatureKey[];

const CATEGORY_LABELS: Record<'core' | 'export' | 'analysis' | 'custom', { ar: string; fr: string }> = {
  core: { ar: 'الوظائف الأساسية لإدارة المباريات', fr: 'Fonctions Principales de Match' },
  export: { ar: 'التصدير والورقة الرسمية والملصقات', fr: 'Export, Feuilles A4 & Affiches' },
  analysis: { ar: 'التحليل الفني وسجل الأحداث', fr: 'Analyse Technique & Événements' },
  custom: { ar: 'التخصيص والهوية البصرية', fr: 'Personnalisation & Logo' }
};

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
  currentUser,
  onUpdateCurrentUser,
  globalFeatures,
  onUpdateGlobalFeatures,
  isDarkMode,
  lang = 'ar',
  initialTab
}) => {
  const isCentralManager = isCentralManagerEmail(currentUser?.email);

  const [tab, setTab] = useState<'activate' | 'manager' | 'features'>(
    initialTab && isCentralManager ? initialTab : (isCentralManager ? 'manager' : 'activate')
  );
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Central Manager State
  const [managerPin, setManagerPin] = useState('');
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(isCentralManager);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'expired'>('all');

  // Global Subscriber Features Control State
  const [draftFeatures, setDraftFeatures] = useState<SubscriberFeaturesConfig>(
    sanitizeFeaturesConfig(globalFeatures)
  );
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

  // Custom WhatsApp Subscription Message Modal State
  const [messagingUser, setMessagingUser] = useState<UserProfile | null>(null);
  const [customMsgText, setCustomMsgText] = useState('');

  // Edit Subscriber Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    clubName: '',
    subscriptionExpiresAt: '',
    managerNotes: '',
    isActive: true,
    isBlocked: false,
    activationCode: '',
    enabledFeatures: {} as SubscriberFeatureOverrideMap
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    if (isCentralManager) {
      setIsManagerUnlocked(true);
      setTab(initialTab || 'manager');
    } else {
      setTab('activate');
    }
  }, [isCentralManager, initialTab, isOpen]);

  useEffect(() => {
    if (globalFeatures) {
      setDraftFeatures(sanitizeFeaturesConfig(globalFeatures));
    }
  }, [globalFeatures]);

  useEffect(() => {
    if (isOpen && (isManagerUnlocked || isCentralManager)) {
      loadUsers();
    }
  }, [isOpen, isManagerUnlocked, isCentralManager]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await adminFetchAllUsers();
      setUsersList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleActivateCode = async () => {
    if (!inputCode.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال كود التفعيل المستلم عبر الواتساب' });
      return;
    }

    setFeedback(null);
    const uid = currentUser?.uid || 'guest_user';

    const res = await activateUserWithCode(uid, inputCode);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      onUpdateSubscription({
        isPro: true,
        licenseKey: inputCode.trim().toUpperCase(),
        activatedAt: new Date().toISOString(),
        expiresAt: res.profile?.subscriptionExpiresAt
      });
      if (res.profile && onUpdateCurrentUser) {
        onUpdateCurrentUser(res.profile);
      }
      setTimeout(() => {
        setFeedback(null);
      }, 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPin === '123456' || managerPin === '2026' || managerPin === 'admin2026' || isCentralManager) {
      setIsManagerUnlocked(true);
      setManagerPin('');
      loadUsers();
    } else {
      setFeedback({ type: 'error', message: 'رمز مرور المسير المركزي غير صحيح' });
    }
  };

  const handleSendWhatsApp = async (u: UserProfile) => {
    try {
      const { code } = await adminSendActivationCode(u);
      setFeedback({
        type: 'success',
        message: `تم توليد كود التفعيل (${code}) وفتح محادثة الواتساب مع ${u.displayName} بنجاح.`
      });
      loadUsers();
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر فتح الواتساب أو تحديث الكود' });
    }
  };

  const handleRenewMembership = async (u: UserProfile) => {
    setRenewingId(u.uid);
    try {
      const updated = await adminRenewSubscriber(u.uid, 12, u.managerNotes || 'تم تجديد الانخراط بـ 30 درهم');
      if (updated) {
        setFeedback({
          type: 'success',
          message: `تم تجديد انخراط ${updated.displayName} لسنة إضافية (30 درهم) وتفعيل حسابه بنجاح!`
        });
        await loadUsers();

        setTimeout(() => {
          adminSendRenewalWhatsApp(updated);
        }, 500);
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء تجديد الانخراط' });
    } finally {
      setRenewingId(null);
    }
  };

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    let dateStr = '';
    if (u.subscriptionExpiresAt) {
      try {
        dateStr = new Date(u.subscriptionExpiresAt).toISOString().split('T')[0];
      } catch {
        dateStr = '';
      }
    } else {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      dateStr = d.toISOString().split('T')[0];
    }

    setEditForm({
      displayName: u.displayName || '',
      phone: u.phone || '',
      clubName: u.clubName || '',
      subscriptionExpiresAt: dateStr,
      managerNotes: u.managerNotes || '',
      isActive: Boolean(u.isActive),
      isBlocked: Boolean(u.isBlocked),
      activationCode: u.activationCode || '',
      enabledFeatures: sanitizeFeatureOverrides(u.enabledFeatures) || {}
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);

    try {
      let isoDate = editingUser.subscriptionExpiresAt;
      if (editForm.subscriptionExpiresAt) {
        isoDate = new Date(editForm.subscriptionExpiresAt).toISOString();
      }

      const cleanOverrides = sanitizeFeatureOverrides(editForm.enabledFeatures);

      await adminUpdateSubscriberSettings(editingUser.uid, {
        displayName: editForm.displayName.trim(),
        phone: editForm.phone.trim(),
        clubName: editForm.clubName.trim(),
        subscriptionExpiresAt: isoDate,
        managerNotes: editForm.managerNotes.trim(),
        isActive: editForm.isActive,
        isPro: editForm.isActive,
        isBlocked: editForm.isBlocked,
        activationCode: editForm.activationCode.trim().toUpperCase(),
        enabledFeatures: cleanOverrides
      });

      setFeedback({
        type: 'success',
        message: `تم تحديث إعدادات وميزات المشترك ${editForm.displayName} بنجاح!`
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'تعذر حفظ تعديلات المشترك' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleAccount = async (u: UserProfile, shouldActivate: boolean) => {
    setActivatingId(u.uid);
    try {
      const defaultReason = shouldActivate
        ? ''
        : 'تم غلق الحساب من قِبل المسير المركزي. يرجى التواصل مع الإدارة لإعادة تفعيل الحساب.';
      await adminToggleAccountStatus(u.uid, shouldActivate, defaultReason);
      setFeedback({
        type: 'success',
        message: shouldActivate
          ? `✅ تم تفعيل حساب ${u.displayName || u.email} بنجاح! أصبح بإمكانه استخدام التطبيق.`
          : `🔒 تم غلق حساب ${u.displayName || u.email}. لن يتمكن من استخدام التطبيق حتى يتم تفعيله مجدداً.`
      });
      await loadUsers();
      if (shouldActivate && u.phone) {
        adminSendActivationSuccessWhatsApp(u);
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر تعديل حالة الحساب' });
    } finally {
      setActivatingId(null);
    }
  };

  const handleToggleGlobalFeature = async (key: SubscriptionFeatureKey) => {
    const updated: SubscriberFeaturesConfig = {
      ...draftFeatures,
      [key]: !draftFeatures[key]
    };
    setDraftFeatures(updated);
    setIsSavingFeatures(true);
    try {
      const saved = await saveGlobalFeaturesConfig(updated, currentUser?.email);
      if (onUpdateGlobalFeatures) onUpdateGlobalFeatures(saved);
      const item = SUBSCRIPTION_FEATURES_CATALOG.find(f => f.key === key);
      setFeedback({
        type: 'success',
        message: updated[key]
          ? `✅ تم تفعيل ميزة "${item?.labelAr}" لجميع المشتركين`
          : `🔒 تم إخفاء/تعطيل ميزة "${item?.labelAr}" عن جميع المشتركين`
      });
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر حفظ إعدادات الميزات' });
    } finally {
      setIsSavingFeatures(false);
    }
  };

  const handleApplyFeaturePreset = async (preset: 'all' | 'basic') => {
    const updated: SubscriberFeaturesConfig =
      preset === 'all'
        ? { ...DEFAULT_SUBSCRIBER_FEATURES }
        : {
            newMatch: true,
            liveMatch: true,
            scheduleManager: false,
            archive: true,
            matchSheetPdf: true,
            excelExport: false,
            matchAnalysis: false,
            aiAnalysis: false,
            socialPoster: false,
            eventsLog: false,
            customBranding: false
          };

    setDraftFeatures(updated);
    setIsSavingFeatures(true);
    try {
      const saved = await saveGlobalFeaturesConfig(updated, currentUser?.email);
      if (onUpdateGlobalFeatures) onUpdateGlobalFeatures(saved);
      setFeedback({
        type: 'success',
        message:
          preset === 'all'
            ? '✅ تم تفعيل جميع الميزات (11/11) لكافة المشتركين بنجاح'
            : '⚙️ تم تفعيل الوضع الأساسي فقط للمشتركين (إنشاء المباراة + المباشر + الأرشيف + ورقة A4)'
      });
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر تطبيق القالب' });
    } finally {
      setIsSavingFeatures(false);
    }
  };

  const handleSetUserOverride = (
    key: SubscriptionFeatureKey,
    mode: 'default' | 'enabled' | 'disabled'
  ) => {
    setEditForm(prev => {
      const next = { ...prev.enabledFeatures };
      if (mode === 'default') {
        delete next[key];
      } else {
        next[key] = mode === 'enabled';
      }
      return { ...prev, enabledFeatures: next };
    });
  };

  const handleOpenCustomMessage = (u: UserProfile) => {
    const teacherName = u.displayName || 'الأستاذ الكريم';
    const defaultText =
`مرحباً بالأستاذ/المسؤول *${teacherName}* 🤾‍♂️،

تحية رياضية طيبة من إدارة تطبيق *HandballScore Pro* لإدارة وتحكيم مباريات كرة اليد.

نحيطكم علماً بضرورة تسوية الانخراط السنوي (30 درهم فقط) لمتابعة الاستفادة من جميع خدمات التطبيق (التحكيم الرقمي، ورقة المباراة الرسمية A4، واستخدام التطبيق بدون إنترنت).

📌 **للتسوية أو الاستفسار:** يرجى الرد على هذه الرسالة أو التواصل مع المسير المركزي مباشرة.
🔗 رابط التطبيق: ${window.location.origin}

مع خالص التقدير،
المسير المركزي.`;

    setCustomMsgText(defaultText);
    setMessagingUser(u);
  };

  // Metrics calculation
  const subscribersList = usersList.filter(u => !isCentralManagerEmail(u.email));
  const totalSubscribers = subscribersList.length;
  const activeSubscribers = subscribersList.filter(u => isUserEffectivelyActive(u)).length;
  const expiredSubscribers = subscribersList.filter(
    u => u.isActive && !u.isBlocked && isUserSubscriptionExpired(u)
  ).length;
  const closedSubscribers = subscribersList.filter(u => !u.isActive || Boolean(u.isBlocked)).length;

  const enabledFeaturesCount = FEATURE_KEYS.filter(k => draftFeatures[k]).length;

  const filteredUsers = subscribersList
    .filter(u => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.clubName && u.clubName.toLowerCase().includes(q)) ||
        (u.activationCode && u.activationCode.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') {
        return isUserEffectivelyActive(u);
      }
      if (statusFilter === 'expired') {
        return Boolean(u.isActive && !u.isBlocked && isUserSubscriptionExpired(u));
      }
      if (statusFilter === 'closed') {
        return !u.isActive || Boolean(u.isBlocked);
      }
      return true;
    })
    .sort((a, b) => {
      const aClosed = !a.isActive || Boolean(a.isBlocked);
      const bClosed = !b.isActive || Boolean(b.isBlocked);
      if (aClosed && !bClosed) return -1;
      if (!aClosed && bClosed) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`w-full max-w-5xl rounded-[2.5rem] border-2 shadow-2xl p-4 sm:p-7 relative max-h-[94vh] flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10 cursor-pointer`}
          title="إغلاق"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-2 rotate-2">
            {tab === 'features' ? (
              <Sliders size={30} strokeWidth={2.5} />
            ) : isCentralManager ? (
              <Users size={32} strokeWidth={2.5} />
            ) : (
              <KeyRound size={32} strokeWidth={2.5} />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isCentralManager
              ? 'لوحة المسير المركزي: إدارة الاشتراكات وميزات المشتركين'
              : 'تفعيل الحساب (كود الواتساب)'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 max-w-xl mx-auto">
            {isCentralManager
              ? 'تفعيل الحسابات، تحديد الوظائف والميزات الظاهرة للمشتركين، وتخصيص صلاحيات كل حساب'
              : 'الانخراط السنوي (30 درهم) والتفعيل اليدوي عبر المسير المركزي بواسطة كود الواتساب'}
          </p>
        </div>

        {/* Tab switch - Manager / Features / Activate */}
        {(isCentralManager || isManagerUnlocked) && (
          <div className="flex justify-center mb-5">
            <div className={`p-1 rounded-2xl flex flex-wrap justify-center gap-1 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setTab('manager')}
                className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'manager'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users size={16} />
                <span>لائحة المشتركين ({totalSubscribers})</span>
              </button>
              <button
                onClick={() => setTab('features')}
                className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'features'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sliders size={16} />
                <span>تحكم في ميزات المشتركين ({enabledFeaturesCount}/{FEATURE_KEYS.length})</span>
              </button>
              <button
                onClick={() => setTab('activate')}
                className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'activate'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound size={16} />
                <span>تفعيل بكود</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs font-black animate-in fade-in shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-2">
          {/* TAB 1: ACTIVATE BY CODE */}
          {tab === 'activate' && (
            <div className="max-w-xl mx-auto space-y-6 py-2">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm">الانخراط السنوي الرمزي</h4>
                    <p className="text-[11px] font-bold text-slate-500">
                      ثمن الاشتراك السنوي هو 30 درهماً فقط لتفعيل الحساب لموسم كامل
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shrink-0">
                  30 درهم / سنة
                </span>
              </div>

              <div className={`p-6 rounded-3xl border-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base">إدخال كود التفعيل المستلم عبر الواتساب</h3>
                    <p className="text-xs text-slate-500 font-bold">
                      يرسل المسير المركزي كوداً فريداً لكل مشترك بعد مراجعة وتأكيد الحساب
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="مثال: HBM-7491"
                    className={`flex-1 p-3.5 rounded-2xl border-2 font-mono font-bold text-sm tracking-wider uppercase outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white'
                        : 'bg-white border-slate-300 focus:border-blue-500 text-slate-900'
                    }`}
                  />
                  <button
                    onClick={handleActivateCode}
                    disabled={!inputCode.trim()}
                    className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
                  >
                    تفعيل الحساب
                  </button>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-bold text-slate-500">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">1</span>
                    <p>يقوم المشترك بإنشاء حساب (الاسم، البريد، ورقم هاتف الواتساب).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">2</span>
                    <p>يقوم المسير المركزي بتفعيل الحساب أو إرسال كود التفعيل على الواتساب (واجب الانخراط: 30 درهم سنوياً).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">3</span>
                    <p>تظهر للمشترك كافة الوظائف والميزات التي يفعلها المسير المركزي بشكل فوري.</p>
                  </div>
                </div>
              </div>

              {isUserEffectivelyActive(currentUser) && (
                <div className={`p-5 rounded-3xl border-2 space-y-2 ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      <ShieldCheck size={20} />
                      <span>حسابك مفعل وجاهز للاستخدام</span>
                    </div>
                    {currentUser?.subscriptionExpiresAt && (
                      <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                        📅 ينتهي في: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ar-MA')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                    يمكنك الآن استخدام جميع الوظائف المفعلة في اشتراكك وإدارة المباريات بدون إنترنت.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GLOBAL FEATURE VISIBILITY CONTROLS (CENTRAL MANAGER) */}
          {tab === 'features' && (isCentralManager || isManagerUnlocked) && (
            <div className="space-y-5 py-1">
              <div className={`p-4 sm:p-5 rounded-3xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDarkMode ? 'bg-indigo-950/25 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers size={20} className="text-indigo-500" />
                    <h3 className="font-black text-sm sm:text-base">
                      التحكم المركزي في الميزات الظاهرة للمشتركين ({enabledFeaturesCount} / {FEATURE_KEYS.length} مفعلة)
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    أي ميزة يتم تعطيلها هنا تختفي أو تقفل فوراً عند جميع المشتركين (بينما يحتفظ المسير المركزي بكامل الصلاحيات، ويمكن تخصيص استثناءات لكل مشترك من زر "إعدادات").
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isSavingFeatures}
                    onClick={() => handleApplyFeaturePreset('all')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>تفعيل الكل (11/11)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSavingFeatures}
                    onClick={() => handleApplyFeaturePreset('basic')}
                    className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock size={14} />
                    <span>الوضع الأساسي فقط</span>
                  </button>
                </div>
              </div>

              {(['core', 'export', 'analysis', 'custom'] as const).map((cat) => {
                const items = SUBSCRIPTION_FEATURES_CATALOG.filter(item => item.category === cat);
                return (
                  <div key={cat} className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                      {isRtl ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].fr}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((item) => {
                        const enabled = draftFeatures[item.key];
                        return (
                          <div
                            key={item.key}
                            onClick={() => handleToggleGlobalFeature(item.key)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              enabled
                                ? isDarkMode
                                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                                  : 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500'
                                : isDarkMode
                                ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-85'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-85'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs sm:text-sm">
                                  {isRtl ? item.labelAr : item.labelFr}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    enabled
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {enabled ? 'مفعلة للمشتركين' : 'معطلة / مخفية'}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                {isRtl ? item.descAr : item.descFr}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isSavingFeatures}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGlobalFeature(item.key);
                              }}
                              className={`shrink-0 p-1.5 rounded-xl transition-colors cursor-pointer ${
                                enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`}
                              title={enabled ? 'تعطيل الميزة للمشتركين' : 'تفعيل الميزة للمشتركين'}
                            >
                              {enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: SUBSCRIBERS LIST & MANAGER CONTROLS */}
          {tab === 'manager' && (
            <div className="space-y-5 py-1">
              {!isManagerUnlocked && !isCentralManager ? (
                <div className="max-w-md mx-auto text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black">الدخول إلى لوحة المسير المركزي</h3>
                  <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">
                    هذا القسم مخصص للمسير المركزي لإدارة إعدادات المشتركين وتفعيل الحسابات والتحكم في الميزات.
                  </p>
                  <form onSubmit={handleManagerLogin} className="space-y-3 pt-2">
                    <input
                      type="password"
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      placeholder="أدخل رمز مرور المسير"
                      className={`w-full p-3.5 rounded-2xl border-2 text-center font-mono font-bold text-sm outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      فتح لوحة التحكم
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-black">إجمالي المشتركين</span>
                        <Users size={15} className="text-blue-500" />
                      </div>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalSubscribers}</p>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'}`}>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                        <span className="text-[11px] font-black">حسابات مفعلة</span>
                        <ShieldCheck size={15} />
                      </div>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeSubscribers}</p>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/80 border-amber-200'}`}>
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                        <span className="text-[11px] font-black">منتهية الصلاحية</span>
                        <Calendar size={15} />
                      </div>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{expiredSubscribers}</p>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/80 border-rose-200'}`}>
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                        <span className="text-[11px] font-black">مغلقة / معلقة</span>
                        <Lock size={15} />
                      </div>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{closedSubscribers}</p>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          statusFilter === 'all'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        الكل ({totalSubscribers})
                      </button>
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          statusFilter === 'active'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        المفعلين ({activeSubscribers})
                      </button>
                      <button
                        onClick={() => setStatusFilter('expired')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          statusFilter === 'expired'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        المنتهية ({expiredSubscribers})
                      </button>
                      <button
                        onClick={() => setStatusFilter('closed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          statusFilter === 'closed'
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        المغلقين ({closedSubscribers})
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="بحث بالاسم أو الهاتف أو المؤسسة أو الكود..."
                          className={`w-full py-2 pr-9 pl-3 rounded-xl border font-bold text-xs outline-none ${
                            isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
                      </div>

                      <button
                        onClick={loadUsers}
                        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        title="تحديث القائمة"
                      >
                        <RefreshCw size={16} className={isLoadingUsers ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Subscribers List */}
                  <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-800">
                        {isLoadingUsers
                          ? 'جاري تحميل قائمة الأساتذة والمشتركين...'
                          : 'لا يوجد مشتركون مطابقون لمعايير البحث حالياً.'}
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isBlocked = Boolean(u.isBlocked);
                        const isExpired = isUserSubscriptionExpired(u);
                        const isEffectivelyActive = isUserEffectivelyActive(u);
                        const isRenewing = renewingId === u.uid;
                        const overrideCount = u.enabledFeatures ? Object.keys(u.enabledFeatures).length : 0;

                        let expiryDisplay = 'غير محدد';
                        if (u.subscriptionExpiresAt) {
                          try {
                            expiryDisplay = new Date(u.subscriptionExpiresAt).toLocaleDateString('ar-MA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch {
                            expiryDisplay = u.subscriptionExpiresAt;
                          }
                        }

                        return (
                          <div
                            key={u.uid}
                            className={`p-4 rounded-3xl border-2 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                              !u.isActive || isBlocked
                                ? isDarkMode
                                  ? 'bg-rose-950/30 border-rose-600/70 shadow-lg'
                                  : 'bg-rose-50 border-rose-400 shadow-md'
                                : isExpired
                                ? isDarkMode
                                  ? 'bg-amber-950/20 border-amber-500/40'
                                  : 'bg-amber-50/70 border-amber-300'
                                : isDarkMode
                                ? 'bg-slate-900/60 border-slate-800'
                                : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            {/* Subscriber Information */}
                            <div className="space-y-1.5 flex-1 w-full">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {isBlocked && <Ban size={16} className="text-rose-500" />}
                                  <span>{u.displayName || 'أستاذ'}</span>
                                </h4>

                                {/* Status Badge */}
                                {!u.isActive || isBlocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm">
                                    <Lock size={12} />
                                    <span>{isBlocked ? 'حساب محجوب 🔒' : 'بانتظار التفعيل ⏳'}</span>
                                  </span>
                                ) : isExpired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm">
                                    <Calendar size={12} />
                                    <span>منتهي الصلاحية ⚠️</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <ShieldCheck size={12} />
                                    <span>حساب مفعل ونشط ✅</span>
                                  </span>
                                )}

                                {u.activationCode && (
                                  <span className="font-mono text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                    🔑 {u.activationCode}
                                  </span>
                                )}

                                {overrideCount > 0 && (
                                  <span className="text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/25">
                                    🎛️ {overrideCount} تخصيص ميزات
                                  </span>
                                )}

                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {u.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500 pt-0.5">
                                {u.phone && (
                                  <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                                    <Phone size={13} className="text-emerald-500" />
                                    <span>{u.phone}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Mail size={13} />
                                  <span>{u.email}</span>
                                </span>
                                {u.clubName && (
                                  <span className="flex items-center gap-1">
                                    <Building size={13} />
                                    <span>{u.clubName}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <Calendar size={13} className="text-blue-500" />
                                  <span>نهاية الصلاحية: <strong>{expiryDisplay}</strong></span>
                                </span>
                              </div>

                              {(!u.isActive || isBlocked) && u.blockReason && (
                                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/25 inline-block mt-1">
                                  🔒 سبب الغلق: {u.blockReason}
                                </p>
                              )}
                              {u.managerNotes && isEffectivelyActive && (
                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5 px-2.5 py-1 rounded-xl border border-amber-500/20 inline-block mt-1">
                                  📝 ملاحظات المسير: {u.managerNotes}
                                </p>
                              )}
                            </div>

                            {/* Actions for Central Manager */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                              {isEffectivelyActive ? (
                                <button
                                  onClick={() => handleToggleAccount(u, false)}
                                  disabled={activatingId === u.uid}
                                  className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="غلق حساب هذا المنخرط"
                                >
                                  <Lock size={14} className={activatingId === u.uid ? 'animate-spin' : ''} />
                                  <span>غلق الحساب</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleAccount(u, true)}
                                  disabled={activatingId === u.uid}
                                  className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="تفعيل حساب المنخرط وإتاحة التطبيق له فوراً"
                                >
                                  <ShieldCheck size={14} className={activatingId === u.uid ? 'animate-spin' : ''} />
                                  <span>تفعيل الحساب</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleSendWhatsApp(u)}
                                className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="توليد كود جديد وإرساله عبر واتساب"
                              >
                                <KeyRound size={14} />
                                <span>كود</span>
                              </button>

                              <button
                                onClick={() => handleOpenCustomMessage(u)}
                                className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="إرسال رسالة خاصة بالاشتراك عبر الواتساب"
                              >
                                <MessageSquare size={14} />
                                <span>واتساب</span>
                              </button>

                              <button
                                onClick={() => handleRenewMembership(u)}
                                disabled={isRenewing}
                                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                title="تجديد الانخراط لسنة إضافية"
                              >
                                <RotateCw size={13} className={isRenewing ? 'animate-spin' : ''} />
                                <span>+سنة</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow transition-all flex items-center gap-1 cursor-pointer"
                                title="تعديل بيانات وميزات المنخرط"
                              >
                                <Settings size={14} />
                                <span>إعدادات وميزات</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Edit Subscriber Settings & Per-User Features */}
        {editingUser && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div
              className={`w-full max-w-2xl rounded-[2.5rem] border-2 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <button
                onClick={() => setEditingUser(null)}
                className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 cursor-pointer`}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black">إعدادات وصلاحيات المشترك</h3>
                  <p className="text-xs text-slate-400 font-bold">{editingUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1">
                    اسم الأستاذ / المسؤول
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">
                      رقم هاتف الواتساب
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      dir="ltr"
                      className={`w-full p-3 rounded-xl border-2 font-mono font-bold outline-none text-xs sm:text-sm text-left ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">
                      كود التفعيل (Activation Code)
                    </label>
                    <input
                      type="text"
                      value={editForm.activationCode}
                      onChange={(e) => setEditForm(prev => ({ ...prev, activationCode: e.target.value.toUpperCase() }))}
                      placeholder="مثال: HBM-1234"
                      className={`w-full p-3 rounded-xl border-2 font-mono font-bold outline-none text-xs sm:text-sm uppercase ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">
                      المؤسسة التعليمية أو النادي
                    </label>
                    <input
                      type="text"
                      value={editForm.clubName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, clubName: e.target.value }))}
                      className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">
                      تاريخ انتهاء الانخراط (الصلاحية)
                    </label>
                    <input
                      type="date"
                      value={editForm.subscriptionExpiresAt}
                      onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionExpiresAt: e.target.value }))}
                      className={`w-full p-3 rounded-xl border-2 font-mono font-bold outline-none text-xs sm:text-sm ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1">
                    ملاحظات المسير المركزي
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.managerNotes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, managerNotes: e.target.value }))}
                    placeholder="مثال: تم تسليم واجب الانخراط 30 درهم نقداً"
                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Activation + Blocked Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    editForm.isActive
                      ? isDarkMode ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
                      : isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-xs font-black block">تفعيل الاشتراك</span>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {editForm.isActive ? 'الحساب مفعل ✅' : 'غير مفعل ⏳'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                        editForm.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
                      }`}
                    >
                      {editForm.isActive ? 'مفعل' : 'معطل'}
                    </button>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    editForm.isBlocked
                      ? isDarkMode ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50 border-rose-300'
                      : isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-xs font-black block flex items-center gap-1">
                        {editForm.isBlocked && <Ban size={14} className="text-rose-500" />}
                        <span>حجب التطبيق</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {editForm.isBlocked ? 'محجوب 🚫' : 'متاح ✅'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        editForm.isBlocked ? 'bg-rose-600 text-white shadow' : 'bg-emerald-600 text-white shadow'
                      }`}
                    >
                      {editForm.isBlocked ? 'محجوب 🚫' : 'متاح ✅'}
                    </button>
                  </div>
                </div>

                {/* Per-subscriber Feature Overrides */}
                <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <Sliders size={15} />
                        <span>تخصيص الميزات لهذا المشترك (استثناء فردي)</span>
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500">
                        افتراضياً يتبع المشترك الإعدادات العامة، ويمكنك تفعيل أو تعطيل أي ميزة له خصيصاً.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, enabledFeatures: {} }))}
                      className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      إرجاع الكل للافتراضي العام
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {SUBSCRIPTION_FEATURES_CATALOG.map((item) => {
                      const overrideVal = editForm.enabledFeatures[item.key];
                      const currentMode: 'default' | 'enabled' | 'disabled' =
                        overrideVal === true ? 'enabled' : overrideVal === false ? 'disabled' : 'default';
                      const globalVal = draftFeatures[item.key];

                      return (
                        <div
                          key={item.key}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="text-xs font-black">
                            <span>{isRtl ? item.labelAr : item.labelFr}</span>
                            <span className="block text-[10px] font-bold text-slate-400">
                              الإعداد العام: {globalVal ? 'مفعلة' : 'معطلة'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetUserOverride(item.key, 'default')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                                currentMode === 'default'
                                  ? 'bg-slate-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              عام
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetUserOverride(item.key, 'enabled')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                                currentMode === 'enabled'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              تفعيل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetUserOverride(item.key, 'disabled')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                                currentMode === 'disabled'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              تعطيل
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs cursor-pointer hover:opacity-80"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات والصلاحيات'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Send Custom WhatsApp Subscription Message */}
        {messagingUser && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div
              className={`w-full max-w-lg rounded-[2.5rem] border-2 shadow-2xl p-6 sm:p-8 relative ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <button
                onClick={() => setMessagingUser(null)}
                className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 cursor-pointer`}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">إرسال رسالة خاصة من أجل الاشتراك</h3>
                  <p className="text-xs text-slate-500 font-bold">
                    إلى: <strong>{messagingUser.displayName}</strong> ({messagingUser.phone || 'بدون رقم مسجل'})
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                    نص الرسالة التي ستُرسل عبر الواتساب (يمكنك التعديل عليها بحرية):
                  </label>
                  <textarea
                    rows={8}
                    value={customMsgText}
                    onChange={(e) => setCustomMsgText(e.target.value)}
                    className={`w-full p-3.5 rounded-2xl border-2 font-bold outline-none text-xs leading-relaxed ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  💡 عند الضغط على إرسال، سيتم فتح محادثة الواتساب فوراً مع الأستاذ بالرسالة المجهزة.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMessagingUser(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs cursor-pointer hover:opacity-80"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      adminSendSubscriptionRequestWhatsApp(messagingUser, customMsgText);
                      setMessagingUser(null);
                      setFeedback({
                        type: 'success',
                        message: `تم فتح الواتساب لإرسال رسالة الاشتراك إلى ${messagingUser.displayName} بنجاح!`
                      });
                    }}
                    className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    <span>إرسال الرسالة عبر الواتساب</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
