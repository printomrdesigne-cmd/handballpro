import React, { useState, useEffect } from 'react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle,
  logoutUser, 
  activateUserWithCode, 
  resetUserPassword,
  UserProfile,
  CENTRAL_MANAGER_EMAIL,
  isCentralManagerEmail 
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
  Sparkles,
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
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onOpenCentralManager,
  isDarkMode,
  lang = 'ar',
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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
  const [suggestRegister, setSuggestRegister] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const isCentralManager = isCentralManagerEmail(currentUser?.email);

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى كتابة بريدك الإلكتروني في الخانة أعلاه أولاً.' : 'Veuillez saisir votre email d\'abord.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await resetUserPassword(email.trim());
      if (res.success) {
        setSuccessMsg(lang === 'ar' 
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة صندوق الوارد والبريد غير المرغوب فيه (Spam).' 
          : 'Lien de réinitialisation envoyé à votre adresse email.');
      } else {
        setErrorMsg(res.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'تعذر إرسال الرابط.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const profile = await loginWithGoogle();
      onAuthSuccess(profile);
      setSuccessMsg(lang === 'ar' ? 'تم تسجيل الدخول بواسطة Google بنجاح! مرحباً بك.' : 'Connexion Google réussie !');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (lang === 'ar' ? 'حدث خطأ أثناء الاتصال بواسطة Google.' : 'Erreur de connexion Google.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEmailInUse(false);
    setSuggestRegister(false);
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

        const profile = await registerWithEmail(
          email, 
          password, 
          displayName, 
          phone, 
          clubName,
          activationCodeInput
        );
        onAuthSuccess(profile);

        if (profile.isActive) {
          setSuccessMsg(lang === 'ar' 
            ? 'تهانينا! تم فتح وتفعيل حسابك بنجاح بكود التفعيل السنوي. مرحباً بك!' 
            : 'Félicitations ! Votre compte est créé et activé avec succès.'
          );
          setTimeout(() => onClose(), 1500);
        } else {
          setSuccessMsg(lang === 'ar' 
            ? 'تم فتح حسابك بنجاح! سيقوم المسير المركزي بإرسال كود التفعيل الخاص بك عبر الواتساب قريباً.' 
            : 'Compte créé avec succès ! Votre code d\'activation WhatsApp vous sera envoyé sous peu.'
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = lang === 'ar' ? 'حدث خطأ أثناء الاتصال. يرجى التحقق من البيانات المدخلة.' : 'Une erreur s\'est produite.';
      if (err.code) {
        msg += ` (${err.code})`;
      }
      if (err.code === 'auth/operation-not-allowed') {
        msg = lang === 'ar'
          ? 'تنبيه: ميزة تسجيل الدخول بالبريد وكلمة المرور غير مفعلة في مشروع Firebase. يرجى تفعيلها من لوحة تحكم Firebase (Authentication -> Sign-in method) أو استخدام زر تسجيل الدخول السريع بواسطة Google أدناه.'
          : 'Erreur: La connexion par email/mot de passe n\'est pas activée dans Firebase. Veuillez l\'activer dans la console Firebase ou utiliser Google.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = lang === 'ar' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات، أو قم بفتح حساب جديد، أو استخدم خاصية استعادة كلمة المرور إذا كنت تملك حساباً سابقاً.' 
          : 'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants, créer un compte, ou réinitialiser votre mot de passe.';
        setSuggestRegister(true);
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
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 mb-3 rotate-2">
                {mode === 'register' ? <KeyRound size={26} strokeWidth={2.5} /> : <Lock size={26} strokeWidth={2.5} />}
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                {mode === 'login' ? 'تسجيل دخول الأساتذة' : 'فتح حساب جديد وتفعيل الكود'}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 max-w-xs mx-auto">
                {mode === 'login' 
                  ? 'سجّل الدخول للوصول إلى نسختك ومبارياتك المحمية' 
                  : 'أدخل كود التفعيل إذا كان لديك، أو املأ الاستمارة لاستلام كودك عبر الواتساب'}
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full py-3 mb-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>تسجيل الدخول السريع بواسطة Google</span>
            </button>

            <div className="flex items-center my-3 text-slate-400 text-xs">
              <div className="flex-1 border-t border-slate-300 dark:border-slate-800"></div>
              <span className="px-3 font-bold">أو البريد الإلكتروني</span>
              <div className="flex-1 border-t border-slate-300 dark:border-slate-800"></div>
            </div>

            {/* Mode switch */}
            <div className={`p-1 rounded-2xl flex gap-1 mb-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); setIsEmailInUse(false); setSuggestRegister(false); }}
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
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); setIsEmailInUse(false); setSuggestRegister(false); }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                فتح حساب جديد
              </button>
            </div>

            {/* In Login mode: helper callout for first-time visitors */}
            {mode === 'login' && (
              <div className={`p-3 rounded-2xl border-2 mb-4 text-start flex items-center justify-between gap-2.5 transition-all ${
                isDarkMode ? 'bg-blue-950/20 border-blue-500/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-950 shadow-sm'
              }`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-black text-xs text-blue-600 dark:text-blue-400">
                    <Sparkles size={14} className="text-amber-500 shrink-0" />
                    <span>أول مرة تفتح حساباً أو تملك كود تفعيل؟</span>
                  </div>
                  <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    انقر هنا لإدخال كود التفعيل أو طلب فتح حساب جديد
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); setSuggestRegister(false); }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                >
                  فتح حساب جديد
                </button>
              </div>
            )}

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
                {suggestRegister && (
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(null); setSuggestRegister(false); }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <KeyRound size={14} />
                    <span>انقر هنا لفتح حساب جديد وتفعيل الكود</span>
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
                  {/* PROMINENT ACTIVATION CODE FIELD FOR FIRST TIME ACCOUNTS */}
                  <div className={`p-4 rounded-2xl border-2 mb-2 text-start transition-all ${
                    activationCodeInput.trim() 
                      ? 'bg-emerald-500/10 border-emerald-500/60 shadow-sm' 
                      : (isDarkMode ? 'bg-slate-950/70 border-amber-500/40 text-amber-200' : 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-sm')
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                        <KeyRound size={16} className="text-amber-500" />
                        <span>كود تفعيل الحساب (Activation Code)</span>
                      </label>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        activationCodeInput.trim() 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      }`}>
                        {activationCodeInput.trim() ? '✓ تم إدخال الكود' : 'اختياري إذا توفر'}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={activationCodeInput}
                        onChange={e => setActivationCodeInput(e.target.value.toUpperCase())}
                        placeholder="أدخل كود التفعيل هنا (مثال: HBM-7491 أو ACT-2026)"
                        className={`w-full p-3 rounded-xl border-2 font-mono font-black text-xs uppercase outline-none transition-all ${isRtl ? 'pr-3 pl-10' : 'pl-3 pr-10'} ${
                          activationCodeInput.trim()
                            ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : (isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500')
                        }`}
                      />
                      <KeyRound className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-amber-500`} size={17} />
                    </div>

                    {/* Dynamic feedback: If code exists vs if user needs to request one */}
                    {activationCodeInput.trim() ? (
                      <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <span>سيتم تفعيل حسابك فوراً بمجرد تأكيد فتح الحساب أدناه!</span>
                      </p>
                    ) : (
                      <div className="mt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p>
                          💡 <strong>ليس لديك كود تفعيل بعد؟</strong> لا تقلق، تابع ملء بياناتك أدناه (الاسم، الهاتف، المؤسسة) وسيقوم المسير المركزي بإرسال كود التفعيل الخاص بك عبر الواتساب فور التسجيل.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Annual Subscription Fee Notice */}
                  <div className={`p-3.5 rounded-2xl border mb-2 text-start transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950/40 border-slate-800 text-slate-300' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                        {lang === 'ar' ? '💰 ثمن الاشتراك السنوي:' : 'Tarif annuel :'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950">
                        <span>{lang === 'ar' ? '30 درهم مغربي فقط' : '30 DH'}</span>
                      </span>
                    </div>
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
                    onChange={e => setEmail(e.target.value.trim())}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black uppercase text-slate-500">
                    كلمة المرور <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value.trim())}
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
                className={`w-full py-3.5 mt-2 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                  mode === 'register' && activationCodeInput.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>جاري المعالجة...</span>
                  </>
                ) : mode === 'login' ? (
                  <span>تسجيل الدخول</span>
                ) : activationCodeInput.trim() ? (
                  <>
                    <KeyRound size={17} />
                    <span>تأكيد فتح الحساب وتفعيله بالكود فوراً</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    <span>فتح حساب جديد وطلب كود التفعيل</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  ليس لديك حساب بعد؟ انقر هنا لفتح حساب جديد وتفعيل الكود
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول من هنا
                </button>
              )}

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
