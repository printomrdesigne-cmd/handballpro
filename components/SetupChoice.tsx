import React from 'react';
import { ScheduledMatch, AppLanguage } from '../types.ts';
import { Calendar, Plus, Clock, MapPin, ChevronLeft, ChevronRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { translations } from '../utils/translations.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface SetupChoiceProps {
  schedule: ScheduledMatch[];
  onChoice: (match?: ScheduledMatch) => void;
  onStartDemo?: () => void;
  onOpenSubscription?: () => void;
  onOpenManagerSettings?: () => void;
  currentUser?: any;
  onOpenAuth?: () => void;
  isPro?: boolean;
  isCentralManager?: boolean;
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const SetupChoice: React.FC<SetupChoiceProps> = ({ 
  schedule, 
  onChoice, 
  onStartDemo,
  onOpenSubscription,
  onOpenManagerSettings,
  currentUser,
  onOpenAuth,
  isPro = false,
  isCentralManager = false,
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
          <div className="pt-1 flex justify-center">
            {currentUser ? (
              <div 
                onClick={onOpenAuth}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border cursor-pointer transition-all ${
                  isPro 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <span>👤 {t.userGreeting} <strong>{currentUser.displayName || currentUser.email}</strong> {isPro ? `★ (${t.proActive})` : `(${t.proRequired})`}</span>
                <span className="text-[11px] underline font-bold">{t.manageAccount}</span>
              </div>
            ) : (
              <div 
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-all"
              >
                <span>{t.signInNotice}</span>
                <span className="text-[11px] font-black underline bg-amber-500 text-white px-2 py-0.5 rounded-full">{t.signInBtn}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1-CLICK DEMO CARD (Only show if account is NOT activated) */}
      {onStartDemo && !isPro && (
        <div className={`p-6 rounded-[2.5rem] border-2 relative overflow-hidden shadow-xl transition-all hover:shadow-2xl ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border-blue-500/50' 
            : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border-blue-400'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 rotate-3">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-1 border border-blue-500/20">
                  <Sparkles size={12} />
                  <span>{t.demoCardBadge}</span>
                </div>
                <h3 className="text-xl font-black">{t.demoCardTitle}</h3>
                <p className={`text-xs font-bold mt-0.5 max-w-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.demoCardDesc}
                </p>
              </div>
            </div>

            <button
              onClick={onStartDemo}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>{t.demoCardBtn}</span>
              <ArrowIcon size={18} />
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
            {isPro ? (
              <span className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-full font-black text-xs transition-colors ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-50 text-blue-600'}`}>
                <CheckCircle2 size={14} />
                <span>{t.startFromScratch}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-xs bg-amber-500/15 text-amber-600 border border-amber-500/30">
                <Lock size={12} />
                <span>{t.forSubscribersOnly}</span>
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
