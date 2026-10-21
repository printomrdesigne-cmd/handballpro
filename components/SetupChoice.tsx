import React from 'react';
import { ScheduledMatch, AppLanguage } from '../types.ts';
import { Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight, Lock, Sparkles, CheckCircle2, Crown, Ban } from 'lucide-react';
import { translations } from '../utils/translations.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface SetupChoiceProps {
  schedule: ScheduledMatch[];
  onChoice: (match?: ScheduledMatch) => void;
  onOpenSubscription?: () => void;
  onOpenManagerSettings?: () => void;
  currentUser?: any;
  onOpenAuth?: () => void;
  isPro?: boolean;
  isCentralManager?: boolean;
  subscriberStats?: { total: number; active: number; closed: number };
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const SetupChoice: React.FC<SetupChoiceProps> = ({ 
  schedule, 
  onChoice, 
  onOpenSubscription,
  onOpenManagerSettings,
  currentUser,
  onOpenAuth,
  isPro = false,
  isCentralManager = false,
  subscriberStats,
  isDarkMode,
  lang = 'ar'
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-6 py-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">{t.setupChoiceTitle}</h2>
        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
          {t.setupChoiceSubtitle}
        </p>

        {/* Account Authentication Banner */}
        {onOpenAuth && (
          <div className="pt-1 flex flex-col items-center gap-2 justify-center">
            {currentUser ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div 
                  onClick={onOpenAuth}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border cursor-pointer transition-all ${
                    isCentralManager
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                      : isPro 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <span>{isCentralManager ? '👑 المسير المركزي:' : '👤 ' + t.userGreeting} <strong>{currentUser.displayName || currentUser.email}</strong> {isCentralManager ? '(المسؤول الإداري العام)' : isPro ? `★ (${t.proActive})` : '(حساب مغلق / في انتظار التفعيل)'}</span>
                  <span className="text-[11px] underline font-bold">{t.manageAccount}</span>
                </div>

                {isCentralManager && onOpenManagerSettings && (
                  <button
                    onClick={onOpenManagerSettings}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    <Crown size={13} className="text-amber-200" />
                    <span>لوحة تسيير المشتركين وتفعيل الحسابات</span>
                  </button>
                )}
              </div>
            ) : (
              <div 
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-all"
              >
                <span>{t.signInNotice}</span>
                <span className="text-[11px] font-black underline bg-blue-600 text-white px-2 py-0.5 rounded-full">{t.signInBtn}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Central Manager Subscriber Count & Account Activation/Closing Card */}
      {isCentralManager && onOpenManagerSettings && (
        <div className={`p-5 rounded-[2.5rem] border-2 shadow-xl transition-all ${
          isDarkMode 
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-amber-500/40' 
            : 'bg-gradient-to-r from-amber-50/90 via-blue-50/50 to-white border-amber-400'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <Crown size={28} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-1">
                  <span>خاص بالمسير المركزي (printomrdesigne@gmail.com)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  إحصائيات المنخرطين وتفعيل / غلق الحسابات
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>إجمالي المشتركين: <strong className="text-blue-600 dark:text-blue-400 font-black text-sm">{subscriberStats?.total ?? 0}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>المفعلين: <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{subscriberStats?.active ?? 0}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>المغلقين: <strong className="text-rose-600 dark:text-rose-400 font-black text-sm">{subscriberStats?.closed ?? 0}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenManagerSettings}
              className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Crown size={17} />
              <span>تفعيل أو غلق حسابات المشتركين</span>
              <ArrowIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* PWA Mobile App Installation Card */}
      <PWAInstallButton lang={lang} variant="card" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option: Manual Setup */}
        <button 
          onClick={() => onChoice()}
          className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center text-center gap-4 hover:scale-[1.02] hover:shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-400'}`}
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 group-hover:rotate-6 transition-transform">
            <Plus size={40} strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-xl font-black mb-1">{t.manualSetupTitle}</h3>
            <p className={`text-xs font-bold px-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{t.manualSetupDesc}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {currentUser && isPro ? (
              <span className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-full font-black text-xs transition-colors ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-50 text-blue-600'}`}>
                <CheckCircle2 size={14} />
                <span>{t.startFromScratch}</span>
              </span>
            ) : currentUser && !isPro ? (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-xs bg-rose-500/15 text-rose-600 border border-rose-500/30">
                <Ban size={12} />
                <span>حساب محجوب مؤقتاً</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-xs bg-blue-500/15 text-blue-600 border border-blue-500/30">
                <Lock size={12} />
                <span>تسجيل الدخول للمتابعة</span>
              </span>
            )}
          </div>
        </button>

        {/* Option: Scheduled Matches */}
        <div className={`flex flex-col p-8 rounded-[2.5rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Calendar size={24} strokeWidth={3} />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black mb-0.5">{t.scheduledTitle}</h3>
                {!isPro && (
                  <span className="text-[10px] font-black bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock size={10} /> {t.proRequired}
                  </span>
                )}
              </div>
              <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>{t.scheduledDesc}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 pr-1 custom-scrollbar space-y-3">
            {schedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8 gap-2">
                <Clock size={32} opacity={0.3} />
                <p className="text-xs font-bold">{t.noScheduledMatches}</p>
              </div>
            ) : (
              schedule.map((match) => (
                <button
                  key={match.id}
                  onClick={() => onChoice(match)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-amber-500' : 'bg-slate-50 border-slate-100 hover:border-amber-400'}`}
                >
                  <div className="flex-1 text-start">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded uppercase">{match.category}</span>
                    </div>
                    <div className="font-black text-sm truncate">{match.homeTeam} <span className={`${isDarkMode ? 'text-slate-400 font-normal' : 'text-slate-600'} italic mx-1`}>{t.vs}</span> {match.awayTeam}</div>
                    <div className={`flex items-center gap-2 mt-1 text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>
                      <span className="flex items-center gap-1"><MapPin size={10} /> {match.lieu}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {match.time}</span>
                    </div>
                  </div>
                  <ArrowIcon className="text-slate-300 group-hover:text-amber-500 transition-all shrink-0" size={20} />
                </button>
              ))
            )}
          </div>
          
          {schedule.length > 0 && (
            <p className={`text-center mt-4 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.selectScheduledPrompt}
            </p>
          )}
        </div>
      </div>

      {/* WhatsApp Manual Activation Banner - only for inactive accounts */}
      {!isPro && onOpenSubscription ? (
        <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <div className="flex items-center gap-3 text-center sm:text-start">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-xs sm:text-sm font-black">
                {lang === 'ar' ? 'الانخراط السنوي (30 درهم) والتفعيل اليدوي عبر الواتساب' : 'Abonnement annuel (30 DH) et activation manuelle'}
              </p>
              <p className="text-[11px] font-bold text-slate-500">
                {lang === 'ar' 
                  ? 'املأ استمارة التسجيل وسيقوم المسير المركزي بإرسال كود التفعيل الخاص بك عبر الواتساب' 
                  : 'Remplissez le formulaire et recevez votre code d\'activation sur WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSubscription}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>{lang === 'ar' ? 'كود التفعيل / المسير المركزي' : 'Code WhatsApp / Gestionnaire'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
