import React, { useState } from 'react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  activateUserWithCode, 
  UserProfile,
  CENTRAL_MANAGER_EMAIL 
} from '../utils/firebase.ts';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  LogOut, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Loader2, 
  Phone, 
  KeyRound, 
  Clock, 
  MessageSquare, 
  ShieldAlert,
  Crown
} from 'lucide-react';
import { AppLanguage } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (profile: UserProfile | null) => void;
  onOpenCentralManager?: () => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onOpenCentralManager,
  isDarkMode,
  lang = 'ar'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [clubName, setClubName] = useState('');
  const [activationCodeInput, setActivationCodeInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEmailInUse, setIsEmailInUse] = useState(false);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const isCentralManager = currentUser?.email?.toLowerCase() === CENTRAL_MANAGER_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEmailInUse(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        const profile = await loginWithEmail(email, password);
        onAuthSuccess(profile);
        if (profile.isActive) {
          setSuccessMsg(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! مرحباً بك.' : 'Connexion réussie ! Bienvenue.');
          setTimeout(() => onClose(), 1200);
        } else {
          setSuccessMsg(lang === 'ar' ? 'تم تسجيل الدخول. حسابك في انتظار كود التفعيل من المسير المركزي.' : 'Connecté. Compte en attente de code d\'activation.');
        }
      } else {
        if (!displayName.trim()) {
          throw new Error(lang === 'ar' ? 'يرجى إدخال اسم الأستاذ أو المسؤول' : 'Veuillez saisir votre nom');
        }
        if (!phone.trim()) {
          throw new Error(lang === 'ar' ? 'يرجى إدخال رقم الهاتف لاستلام كود التفعيل عبر الواتساب' : 'Veuillez saisir votre numéro WhatsApp pour recevoir le code');
        }
        const profile = await registerWithEmail(email, password, displayName, phone, clubName);
        onAuthSuccess(profile);
        setSuccessMsg(lang === 'ar' 
          ? 'تم تسجيل طلبك بنجاح! سيتم إرسال كود التفعيل عبر الواتساب قريباً.' 
          : 'Demande enregistrée ! Votre code d\'activation WhatsApp vous sera envoyé sous peu.'
        );
      }
    } catch (err: any) {
      console.error(err);
      let msg = lang === 'ar' ? 'حدث خطأ أثناء الاتصال. يرجى التحقق من البيانات المدخلة.' : 'Une erreur s\'est produite.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Email ou mot de passe incorrect.';
      } else if (err.code === 'auth/email-already-in-use') {
        setIsEmailInUse(true);
        msg = lang === 'ar' 
          ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.' 
          : 'Cet email est déjà enregistré. Veuillez vous connecter.';
      } else if (err.code === 'auth/weak-password') {
        msg = lang === 'ar' ? 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل).' : 'Mot de passe trop court (min. 6 caractères).';
      } else if (err.code === 'auth/invalid-email') {
        msg = lang === 'ar' ? 'صيغة البريد الإلكتروني غير صالحة.' : 'Format email invalide.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!activationCodeInput.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى كتابة كود التفعيل المستلم على الواتساب' : 'Veuillez entrer le code reçu par WhatsApp');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await activateUserWithCode(currentUser.uid, activationCodeInput);
      if (res.success && res.profile) {
        onAuthSuccess(res.profile);
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء التحقق من الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onAuthSuccess(null);
      setSuccessMsg(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Déconnexion effectuée.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const contactManagerWhatsApp = () => {
    const name = currentUser?.displayName || displayName || 'أستاذ';
    const emailStr = currentUser?.email || email || '';
    const phoneStr = currentUser?.phone || phone || '';
    const text = `السلام عليكم ورحمة الله، أنا الأستاذ: *${name}*
البريد الإلكتروني: ${emailStr}
رقم الهاتف: ${phoneStr}
لقد قمت بملأ استمارة التسجيل في تطبيق HandballScore Pro، وأنتظر استلام كود التفعيل الخاص بحسابي. شكراً جزيلاً!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className={`w-full max-w-md rounded-[2.5rem] border-2 shadow-2xl p-6 sm:p-8 relative ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer`}
          title="Close"
        >
          <X size={22} />
        </button>

        {currentUser ? (
          /* Profile & Account Details View */
          <div className="text-center py-2 space-y-4">
            <div className={`w-20 h-20 rounded-3xl text-white flex items-center justify-center mx-auto shadow-xl rotate-2 ${
              currentUser.isActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-amber-500 shadow-amber-500/30'
            }`}>
              {currentUser.isActive ? <ShieldCheck size={40} /> : <Clock size={40} />}
            </div>

            <div>
              <h3 className="text-2xl font-black">{currentUser.displayName || 'أستاذ'}</h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">{currentUser.email}</p>
              {currentUser.phone && (
                <p className="text-xs text-slate-400 font-mono font-bold mt-0.5" dir="ltr">
                  📱 {currentUser.phone}
                </p>
              )}
              {currentUser.clubName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-2 border border-blue-500/20">
                  <Building size={13} />
                  <span>{currentUser.clubName}</span>
                </div>
              )}
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black flex items-center gap-2 text-start">
                <AlertCircle size={17} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-2 text-start">
                <CheckCircle2 size={17} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Account Status Box */}
            {currentUser.isActive ? (
              <div className={`p-4 rounded-2xl border text-start space-y-2 ${
                isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">حالة التفعيل:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                    <ShieldCheck size={14} />
                    <span>حساب مفعل رسمياً</span>
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  تم تفعيل حسابك من قِبل المسير المركزي. يمكنك الآن استخدام كافة مميزات التطبيق، إدارة وتحكيم المباريات بدون إنترنت، وطباعة ورقة المباراة الرسمية.
                </p>
              </div>
            ) : (
              /* PENDING ACTIVATION BOX */
              <div className={`p-5 rounded-3xl border-2 text-start space-y-3 ${
                isDarkMode ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-2 font-black text-sm text-amber-600 dark:text-amber-400">
                  <Clock size={18} />
                  <span>في انتظار التفعيل من قِبل المسير المركزي</span>
                </div>

                <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                  تم تسجيل طلبك بنجاح. سيقوم المسير المركزي بإرسال <strong>كود التفعيل الخاص بك</strong> عبر رسالة واتساب على رقمك <strong>{currentUser.phone || 'المسجل'}</strong>.
                </p>

                {/* Activation code input form */}
                <form onSubmit={handleActivateWithCode} className="pt-2 space-y-2">
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300">
                    أدخل كود التفعيل المستلم على الواتساب:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activationCodeInput}
                      onChange={e => setActivationCodeInput(e.target.value.toUpperCase())}
                      placeholder="مثال: HBM-7491"
                      className={`flex-1 p-3 rounded-xl border-2 font-mono font-bold text-xs uppercase outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={loading || !activationCodeInput.trim()}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : 'تفعيل'}
                    </button>
                  </div>
                </form>

                {/* Direct WhatsApp button to request activation */}
                <button
                  type="button"
                  onClick={contactManagerWhatsApp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <MessageSquare size={15} />
                  <span>تذكير المسير المركزي عبر الواتساب لتسريع التفعيل</span>
                </button>
              </div>
            )}

            {/* Central Manager Access Link if Admin */}
            {isCentralManager && onOpenCentralManager && (
              <button
                onClick={() => { onClose(); onOpenCentralManager(); }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown size={17} />
                <span>فتح لوحة المسير المركزي (إرسال الأكواد وتفعيل الحسابات)</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl border-2 border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج من هذا الحساب</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 mb-3 rotate-3">
                <Lock size={30} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black">
                {mode === 'login' ? 'تسجيل دخول الأساتذة' : 'استمارة تسجيل حساب جديد'}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 max-w-xs mx-auto">
                {mode === 'login' 
                  ? 'سجّل الدخول للوصول إلى نسختك ومبارياتك المحمية' 
                  : 'املأ الاستمارة ليقوم المسير المركزي بإرسال كود التفعيل لك عبر الواتساب'}
              </p>
            </div>

            {/* Mode switch */}
            <div className={`p-1 rounded-2xl flex gap-1 mb-5 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); setIsEmailInUse(false); }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); setIsEmailInUse(false); }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                تسجيل حساب جديد
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={17} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {isEmailInUse && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(null); setIsEmailInUse(false); }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer text-center"
                  >
                    انقر هنا لتسجيل الدخول بهذا البريد
                  </button>
                )}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-2">
                <CheckCircle2 size={17} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  {/* Annual Subscription Fee Notice (ثمن الاشتراك السنوي 30 درهم) */}
                  <div className={`p-4 rounded-2xl border-2 mb-2 text-start transition-all ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border-amber-500/50 text-amber-200' 
                      : 'bg-gradient-to-r from-amber-50 via-yellow-50/60 to-amber-100/50 border-amber-400 text-amber-950 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                          {lang === 'ar' ? 'ثمن الاشتراك السنوي:' : 'Tarif de l\'abonnement annuel :'}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
                        <span>{lang === 'ar' ? '30 درهم مغربي فقط' : '30 DH seulement'}</span>
                      </span>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                      {lang === 'ar'
                        ? 'رسوم رمزية قدرها 30 درهماً سنوياً تتيح لك الاستفادة الكاملة من كافة مميزات التطبيق، إدارة وتحكيم المباريات بدون إنترنت، استخراج ورقة المباراة الرسمية A4، وتحديثات طيلة الموسم الرياضي. يتم تفعيل وتجديد الحساب يدوياً من طرف المسير المركزي عبر إرسال كود خاص على رقم الواتساب المسجل.'
                        : 'Un tarif symbolique de 30 DH par an donne un accès illimité à toutes les fonctionnalités. L\'activation et le renouvellement se font manuellement par le gestionnaire central via WhatsApp.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      الاسم الكامل للأستاذ / المسؤول <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="مثال: ذ. عمر حمان"
                        className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm ${isRtl ? 'pr-3 pl-10' : 'pl-3 pr-10'} ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                        }`}
                      />
                      <User className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={17} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      رقم هاتف الواتساب (لاستلام كود التفعيل) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+212600000000"
                        dir="ltr"
                        className={`w-full p-3 rounded-xl border-2 font-mono font-bold outline-none text-xs sm:text-sm text-left ${isRtl ? 'pl-10 pr-3' : 'pr-10 pl-3'} ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                        }`}
                      />
                      <Phone className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={17} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      المؤسسة التعليمية أو النادي الرياضي
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={clubName}
                        onChange={e => setClubName(e.target.value)}
                        placeholder="مثال: ثانوية النهضة التأهيلية - فكيك"
                        className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm ${isRtl ? 'pr-3 pl-10' : 'pl-3 pr-10'} ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                        }`}
                      />
                      <Building className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={17} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="professeur@example.com"
                    dir="ltr"
                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm text-left ${isRtl ? 'pl-10 pr-3' : 'pr-10 pl-3'} ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                  <Mail className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={17} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-xs sm:text-sm text-left ${isRtl ? 'pl-10 pr-3' : 'pr-10 pl-3'} ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                  <Lock className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={17} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'تسجيل الدخول' : 'إرسال طلب التسجيل وتأكيد البيانات'}</span>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                💰 ثمن الاشتراك السنوي: 30 درهم مغربي فقط
              </p>
              <p className="text-[11px] font-bold text-slate-400">
                🔒 يتم التفعيل وتجديد الانخراط يدوياً من طرف المسير المركزي عبر إرسال كود خاص بالواتساب
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
