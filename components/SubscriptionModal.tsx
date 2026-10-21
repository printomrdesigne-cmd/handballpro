import React, { useState, useEffect } from 'react';
import { SubscriptionState, AppLanguage } from '../types.ts';
import { 
  adminFetchAllUsers, 
  adminSendActivationCode, 
  adminDirectlyActivateUser, 
  activateUserWithCode, 
  adminRenewSubscriber,
  adminSendRenewalWhatsApp,
  adminUpdateSubscriberSettings,
  adminBlockUser,
  adminSendSubscriptionRequestWhatsApp,
  adminToggleAccountStatus,
  adminSendActivationSuccessWhatsApp,
  UserProfile, 
  CENTRAL_MANAGER_EMAIL,
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
  Clock, 
  Check, 
  RefreshCw, 
  Lock, 
  Building, 
  Search,
  Sparkles,
  Settings,
  Calendar,
  RotateCw,
  Coins,
  Edit,
  Save,
  AlertTriangle,
  UserCheck,
  Crown,
  Ban,
  ShieldAlert
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onUpdateSubscription: (state: SubscriptionState) => void;
  currentUser?: UserProfile | null;
  onUpdateCurrentUser?: (profile: UserProfile | null) => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
  initialTab?: 'activate' | 'manager';
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
  currentUser,
  onUpdateCurrentUser,
  isDarkMode,
  lang = 'ar',
  initialTab
}) => {
  const isCentralManager = isCentralManagerEmail(currentUser?.email);
  
  // Exclusively for Central Manager
  const [tab, setTab] = useState<'activate' | 'manager'>(
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'expired'>('all');
  const [blockingId, setBlockingId] = useState<string | null>(null);

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
    activationCode: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    if (isCentralManager) {
      setIsManagerUnlocked(true);
      setTab('manager');
    } else {
      setTab('activate');
    }
  }, [isCentralManager, initialTab]);

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
        activatedAt: new Date().toISOString()
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

  // Renew membership for 1 additional year (30 DH) and activate account
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

        // Ask or automatically open WhatsApp confirmation
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

  // Open Edit Subscriber Settings Modal
  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    // Format expiration date for date input (YYYY-MM-DD)
    let dateStr = '';
    if (u.subscriptionExpiresAt) {
      try {
        dateStr = new Date(u.subscriptionExpiresAt).toISOString().split('T')[0];
      } catch (e) {
        dateStr = '';
      }
    } else {
      // Default to 1 year from now
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
      activationCode: u.activationCode || ''
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

      await adminUpdateSubscriberSettings(editingUser.uid, {
        displayName: editForm.displayName.trim(),
        phone: editForm.phone.trim(),
        clubName: editForm.clubName.trim(),
        subscriptionExpiresAt: isoDate,
        managerNotes: editForm.managerNotes.trim(),
        isActive: editForm.isActive,
        isPro: editForm.isActive,
        isBlocked: editForm.isBlocked,
        activationCode: editForm.activationCode.trim().toUpperCase()
      });

      setFeedback({ 
        type: 'success', 
        message: `تم تحديث إعدادات المشترك ${editForm.displayName} بنجاح!` 
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

  const handleToggleActivate = async (u: UserProfile, targetState: boolean) => {
    setActivatingId(u.uid);
    try {
      await adminDirectlyActivateUser(u.uid, targetState);
      setFeedback({ 
        type: 'success', 
        message: targetState 
          ? `✅ تم تفعيل حساب ${u.displayName || u.email} بضغطة زر بنجاح!` 
          : `تم تعطيل حساب ${u.displayName || u.email}` 
      });
      await loadUsers();
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر تعديل حالة الحساب' });
    } finally {
      setActivatingId(null);
    }
  };

  // Toggle Account Active / Closed Status (تفعيل الحساب أو غلق الحساب)
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
      // If activated and user has a phone, notify them via WhatsApp
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

  // Toggle User Block Status (حجب التطبيق على المنخرط)
  const handleToggleBlock = async (u: UserProfile, shouldBlock: boolean) => {
    setBlockingId(u.uid);
    try {
      const defaultReason = shouldBlock 
        ? 'تم حجب التطبيق على هذا الحساب مؤقتاً من قبل المسير المركزي. يرجى أداء واجب الانخراط السنوي (30 درهم) لتفعيل الحساب.'
        : '';
      await adminBlockUser(u.uid, shouldBlock, defaultReason);
      setFeedback({
        type: 'success',
        message: shouldBlock 
          ? `🚫 تم غلق التطبيق على ${u.displayName || u.email}.`
          : `✅ تم تفعيل حساب ${u.displayName || u.email} بنجاح!`
      });
      await loadUsers();
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'تعذر تعديل حالة الحساب' });
    } finally {
      setBlockingId(null);
    }
  };

  // Open Custom WhatsApp Subscription Message Modal
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

  // Helper to test if a membership is expired
  const isUserExpired = (u: UserProfile): boolean => {
    if (u.isBlocked || !u.isActive) return false;
    if (!u.subscriptionExpiresAt) return false;
    return new Date(u.subscriptionExpiresAt).getTime() < Date.now();
  };

  // Metrics calculation
  const subscribersList = usersList.filter(u => !isCentralManagerEmail(u.email));
  const totalSubscribers = subscribersList.length;
  const activeSubscribers = subscribersList.filter(u => u.isActive && !u.isBlocked).length;
  const closedSubscribers = subscribersList.filter(u => !u.isActive || u.isBlocked).length;

  const filteredUsers = subscribersList.filter(u => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q || (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.clubName && u.clubName.toLowerCase().includes(q)) ||
      (u.activationCode && u.activationCode.toLowerCase().includes(q))
    );

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return u.isActive && !u.isBlocked;
    }
    if (statusFilter === 'closed' || statusFilter === 'blocked') {
      return !u.isActive || u.isBlocked;
    }
    return true;
  }).sort((a, b) => {
    // Priority 1: Closed/inactive users first so manager can quickly activate them
    const aClosed = !a.isActive || a.isBlocked;
    const bClosed = !b.isActive || b.isBlocked;
    if (aClosed && !bClosed) return -1;
    if (!aClosed && bClosed) return 1;
    // Priority 2: Newest first
    return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
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
            {isCentralManager ? <Users size={32} strokeWidth={2.5} /> : <KeyRound size={32} strokeWidth={2.5} />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isCentralManager ? 'لوحة المسير المركزي: لائحة المسجلين وتفعيل الحسابات' : 'تفعيل الحساب (كود الواتساب)'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 max-w-xl mx-auto">
            {isCentralManager 
              ? 'تفعيل حسابات الأساتذة بضغطة زر واحدة، تجديد الانخراط السنوي (30 درهم)، وإرسال الأكواد عبر الواتساب'
              : 'الانخراط السنوي (30 درهم) والتفعيل اليدوي عبر المسير المركزي بواسطة كود الواتساب'}
          </p>
        </div>

        {/* Tab switch - Only show manager tab to central manager or unlocked */}
        {(isCentralManager || isManagerUnlocked) && (
          <div className="flex justify-center mb-5">
            <div className={`p-1 rounded-2xl flex gap-1 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setTab('manager')}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'manager'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users size={16} />
                <span>لائحة المسجلين وتفعيل الحسابات (المسؤول المركزي)</span>
              </button>
              <button
                onClick={() => setTab('activate')}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'activate'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound size={16} />
                <span>تفعيل كود الواتساب يدويًا</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs font-black animate-in fade-in shrink-0 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-2">
          {tab === 'activate' && (
            <div className="max-w-xl mx-auto space-y-6 py-2">
              {/* Annual price reminder card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                isDarkMode ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
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
                      يرسل المسير المركزي كوداً فريداً لكل أستاذ بعد ملء استمارة التسجيل
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="مثال: HBM-7491 أو HAND-2026"
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

                {/* Instructions note */}
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-bold text-slate-500">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">1</span>
                    <p>يقوم الأستاذ بملأ استمارة التسجيل (الاسم، البريد، ورقم هاتف الواتساب).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">2</span>
                    <p>يقوم المسير المركزي بمراجعة الطلب وتفعيل الحساب بإرسال كود خاص على الواتساب (واجب الانخراط: 30 درهم سنوياً).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-mono">3</span>
                    <p>بمجرد كتابة الكود هنا، يتم فتح وتفعيل كافة وظائف التطبيق بالكامل وبلا أي قيود.</p>
                  </div>
                </div>
              </div>

              {/* Status Box if already active */}
              {(subscription.isPro || currentUser?.isActive) && (
                <div className={`p-5 rounded-3xl border-2 space-y-2 ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      <ShieldCheck size={20} />
                      <span>حسابك مفعل وجاهز للاستخدام الكامل</span>
                    </div>
                    {currentUser?.subscriptionExpiresAt && (
                      <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                        📅 ينتهي في: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ar-MA')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                    يمكنك الآن تحكيم المباريات بدون إنترنت، استخراج ورقة المباراة A4 الرسمية، واستعمال المؤقت الإلكتروني طيلة الموسم الرياضي.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'manager' && (
            <div className="space-y-5 py-1">
              {!isManagerUnlocked && !isCentralManager ? (
                /* Manager PIN lock screen */
                <div className="max-w-md mx-auto text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black">الدخول إلى لوحة المسير المركزي</h3>
                  <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">
                    هذا القسم مخصص للمسير المركزي لإدارة إعدادات المشتركين وتجديد انخراطهم عبر تفعيل الحساب وإرسال الأكواد.
                  </p>
                  <form onSubmit={handleManagerLogin} className="space-y-3 pt-2">
                    <input
                      type="password"
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      placeholder="أدخل رمز مرور المسير (2026)"
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
                /* Manager Registered Users & Renewal Settings Panel */
                <div className="space-y-4">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-black">إجمالي المشتركين المسجلين</span>
                        <Users size={16} className="text-blue-500" />
                      </div>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalSubscribers}</p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'}`}>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                        <span className="text-[11px] font-black">الحسابات المفعلة (نشط)</span>
                        <ShieldCheck size={16} />
                      </div>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeSubscribers}</p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/80 border-rose-200'}`}>
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                        <span className="text-[11px] font-black">الحسابات المغلقة / قيد الانتظار</span>
                        <Lock size={16} />
                      </div>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{closedSubscribers}</p>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    {/* Status filter tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          statusFilter === 'all'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        الكل ({totalSubscribers})
                      </button>
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          statusFilter === 'active'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        المفعلين ({activeSubscribers})
                      </button>
                      <button
                        onClick={() => setStatusFilter('closed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                        {isLoadingUsers ? 'جاري تحميل قائمة الأساتذة والمشتركين...' : 'لا يوجد مشتركون مطابقون لمعايير البحث حالياً.'}
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isBlocked = Boolean(u.isBlocked);
                        const isExpired = isUserExpired(u);
                        const isUserActive = !isBlocked && !isExpired;
                        const isRenewing = renewingId === u.uid;
                        const isBlocking = blockingId === u.uid;

                        let expiryDisplay = 'غير محدد';
                        if (u.subscriptionExpiresAt) {
                          try {
                            expiryDisplay = new Date(u.subscriptionExpiresAt).toLocaleDateString('ar-MA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch (e) {
                            expiryDisplay = u.subscriptionExpiresAt;
                          }
                        }

                        return (
                          <div 
                            key={u.uid}
                            className={`p-4 rounded-3xl border-2 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                              isBlocked
                                ? (isDarkMode ? 'bg-rose-950/30 border-rose-600/70 shadow-lg' : 'bg-rose-50 border-rose-400 shadow-md')
                                : isExpired
                                ? (isDarkMode ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50/70 border-amber-300')
                                : (isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm')
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
                                    <span>حساب مغلق 🔒</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <ShieldCheck size={12} />
                                    <span>حساب مفعل ونشط ✅</span>
                                  </span>
                                )}

                                {/* Activation Code Badge */}
                                {u.activationCode ? (
                                  <span className="font-mono text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                    🔑 {u.activationCode}
                                  </span>
                                ) : null}

                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {u.subscriptionPrice || ANNUAL_SUBSCRIPTION_PRICE}
                                </span>
                              </div>

                              {/* Details: Phone, Email, Club, Expiration */}
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

                              {/* Manager Notes or Block Reason if present */}
                              {(!u.isActive || isBlocked) && u.blockReason && (
                                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/25 inline-block mt-1">
                                  🔒 سبب الغلق: {u.blockReason}
                                </p>
                              )}
                              {u.managerNotes && u.isActive && !isBlocked && (
                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5 px-2.5 py-1 rounded-xl border border-amber-500/20 inline-block mt-1">
                                  📝 ملاحظات المسير: {u.managerNotes}
                                </p>
                              )}
                            </div>

                            {/* Actions for Central Manager */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                              {/* 1. DIRECT ACTIVATE / CLOSE BUTTON */}
                              {u.isActive && !isBlocked ? (
                                <button
                                  onClick={() => handleToggleAccount(u, false)}
                                  disabled={activatingId === u.uid}
                                  className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="غلق حساب هذا المنخرط"
                                >
                                  <Lock size={15} className={activatingId === u.uid ? 'animate-spin' : ''} />
                                  <span>غلق الحساب 🔒</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleAccount(u, true)}
                                  disabled={activatingId === u.uid}
                                  className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="تفعيل حساب المنخرط وإتاحة التطبيق له فوراً"
                                >
                                  <ShieldCheck size={15} className={activatingId === u.uid ? 'animate-spin' : ''} />
                                  <span>تفعيل الحساب 🔓</span>
                                </button>
                              )}

                              {/* 2. SEND CUSTOM SUBSCRIPTION WHATSAPP MESSAGE */}
                              <button
                                onClick={() => handleOpenCustomMessage(u)}
                                className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="إرسال رسالة خاصة بالاشتراك عبر الواتساب"
                              >
                                <MessageSquare size={14} />
                                <span>رسالة واتساب</span>
                              </button>

                              {/* 3. RENEW MEMBERSHIP (+1 Year & 30 DH) */}
                              <button
                                onClick={() => handleRenewMembership(u)}
                                disabled={isRenewing}
                                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                title="تجديد الانخراط لسنة إضافية"
                              >
                                <RotateCw size={13} className={isRenewing ? 'animate-spin' : ''} />
                                <span>+سنة</span>
                              </button>

                              {/* 4. EDIT SUBSCRIBER SETTINGS */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                                title="تعديل بيانات المنخرط والملاحظات"
                              >
                                <Settings size={14} />
                                <span>إعدادات</span>
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

        {/* Modal: Edit Subscriber Settings (إعدادات المشترك) */}
        {editingUser && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div 
              className={`w-full max-w-lg rounded-[2.5rem] border-2 shadow-2xl p-6 sm:p-8 relative ${
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
                  <h3 className="text-xl font-black">إعدادات حساب المشترك</h3>
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
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    تاريخ انتهاء الاشتراك السنوي (30 درهم). يمكنك تمديده يدوياً أو استخدام زر التجديد السريع.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1">
                    ملاحظات المسير المركزي
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.managerNotes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, managerNotes: e.target.value }))}
                    placeholder="مثال: تم تسليم واجب الانخراط 30 درهم نقداً / تم التجديد لموسم 2026-2027"
                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Blocked / Allowed Toggle Switch */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  editForm.isBlocked
                    ? (isDarkMode ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50 border-rose-300')
                    : (isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                }`}>
                  <div>
                    <span className="text-xs font-black block flex items-center gap-1">
                      {editForm.isBlocked && <Ban size={14} className="text-rose-500" />}
                      <span>حجب التطبيق</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {editForm.isBlocked ? 'التطبيق محجوب على هذا الحساب 🚫' : 'التطبيق متاح للاستخدام بشكل طبيعي ✅'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      editForm.isBlocked 
                        ? 'bg-rose-600 text-white shadow' 
                        : 'bg-emerald-600 text-white shadow'
                    }`}
                  >
                    {editForm.isBlocked ? 'محجوب 🚫' : 'متاح ✅'}
                  </button>
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
                    className="flex-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
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
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
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
                    className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
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
