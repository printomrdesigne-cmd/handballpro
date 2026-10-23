import React from 'react';
import { MatchState, ScheduledMatch, AppLanguage } from '../types.ts';
import { Trophy, Calendar, History, Plus, Play, FileText, Users, Crown, ShieldCheck, Zap, Activity, BarChart3, ArrowUpRight, Clock, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { translations } from '../utils/translations.ts';

interface HomeDashboardProps {
  match: MatchState | null;
  archive: MatchState[];
  schedule: ScheduledMatch[];
  currentUser: any;
  isPro: boolean;
  isCentralManager: boolean;
  subscriberStats?: { total: number; active: number; closed: number };
  onNavigate: (view: 'home' | 'setup' | 'setup_choice' | 'match' | 'sheet' | 'archive' | 'admin_schedule') => void;
  onNewMatch: () => void;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
  onOpenEvents?: () => void;
  onOpenAnalysis?: () => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  match,
  archive,
  schedule,
  currentUser,
  isPro,
  isCentralManager,
  subscriberStats,
  onNavigate,
  onNewMatch,
  onOpenAuth,
  onOpenSubscription,
  onOpenEvents,
  onOpenAnalysis,
  isDarkMode,
  lang = 'ar'
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Compute statistics
  const totalMatchesArchived = archive.length;
  const activeMatchExists = Boolean(match);
  const totalGoalsScored = archive.reduce((acc, m) => {
    return acc + (m.score?.home || 0) + (m.score?.away || 0) + (m.score?.homePenalties || 0) + (m.score?.awayPenalties || 0);
  }, 0) + (match ? (match.score?.home || 0) + (match.score?.away || 0) + (match.score?.homePenalties || 0) + (match.score?.awayPenalties || 0) : 0);

  const totalScheduled = schedule.length;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Welcome & Account Status Banner */}
      <div className={`p-6 sm:p-8 rounded-[2.5rem] border-2 relative overflow-hidden shadow-xl ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white border-transparent'
      }`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black tracking-wide border border-white/20">
              <Sparkles size={14} className="text-amber-300" />
              <span>{isCentralManager ? '👑 لوحة تحكم المسير المركزي' : isPro ? '★ حساب مشترك مفعل PRO' : '⚡ لوحة القيادة الرئيسية'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentUser ? `${lang === 'ar' ? 'مرحباً،' : 'Bienvenue,'} ${currentUser.displayName || currentUser.email}` : (lang === 'ar' ? 'مرحباً بك في HandManager PRO' : 'Bienvenue sur HandManager PRO')}
            </h1>
            <p className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-blue-100'}`}>
              {lang === 'ar' 
                ? 'النظام الاحترافي المتكامل لإدارة مباريات وتحكيم كرة اليد وفق القوانين الرسمية.' 
                : 'Système professionnel de gestion de matchs de handball.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="px-5 py-3 rounded-2xl bg-white/25 hover:bg-white/35 backdrop-blur-md text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users size={16} />
                <span>{currentUser.displayName || currentUser.email}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users size={16} />
                <span>{lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Connexion'}</span>
              </button>
            )}

            <button
              onClick={onNewMatch}
              className="px-6 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="text-blue-600" />
              <span>{lang === 'ar' ? 'مباراة جديدة' : 'Nouveau Match'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Match Resumption Banner if active match exists */}
      {match && (
        <div className={`p-5 sm:p-6 rounded-[2.2rem] border-2 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-2 ${
          isDarkMode ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-slate-900'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <Play size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {lang === 'ar' ? 'مقابلة جارية الآن' : 'Match en cours'}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {match.period}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1">
                <span style={{ color: match.homeTeam.color }}>{match.homeTeam.name}</span>
                <span className="mx-2 font-mono text-xl">({match.score.home} - {match.score.away})</span>
                <span style={{ color: match.awayTeam.color }}>{match.awayTeam.name}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {onOpenAnalysis && (
              <button
                onClick={onOpenAnalysis}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                title={lang === 'ar' ? 'تحليل المقابلة والنتائج وإحصائيات اللاعبين' : 'Analyse du match'}
              >
                <BarChart3 size={16} />
                <span>{lang === 'ar' ? 'تحليل المباراة' : 'Analyse'}</span>
              </button>
            )}

            {onOpenEvents && (
              <button
                onClick={onOpenEvents}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-300"
              >
                <History size={16} />
                <span>{lang === 'ar' ? 'سجل الأحداث' : 'Événements'}</span>
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[9px] font-black">{match.events?.length || 0}</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('match')}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={16} />
              <span>{lang === 'ar' ? 'استئناف المباراة' : 'Reprendre le match'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Central Manager Subscriber Quick Stats Banner */}
      {isCentralManager && subscriberStats && (
        <div className={`p-5 rounded-[2.2rem] border-2 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 ${
          isDarkMode ? 'bg-amber-950/30 border-amber-500/40' : 'bg-amber-50 border-amber-300 text-slate-900'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">{lang === 'ar' ? 'حالة المشتركين والمنخرطين' : 'Statistiques des abonnés'}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'إجمالي المنخرطين في النظام:' : 'Total abonnés:'} <strong className="text-amber-600 dark:text-amber-400">{subscriberStats.total}</strong> | {lang === 'ar' ? 'المفعلين:' : 'Actifs:'} <strong className="text-emerald-600">{subscriberStats.active}</strong> | {lang === 'ar' ? 'المغلقين:' : 'Fermés:'} <strong className="text-rose-600">{subscriberStats.closed}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSubscription}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Crown size={15} />
            <span>{lang === 'ar' ? 'إدارة وتفعيل حسابات المشتركين' : 'Gérer les abonnés'}</span>
          </button>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Archived Matches */}
        <div className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <History size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
              {lang === 'ar' ? 'الأرشيف' : 'Archive'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-1">{totalMatchesArchived}</div>
          <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {lang === 'ar' ? 'مباراة مسجلة في الأرشيف' : 'Matchs archivés'}
          </p>
        </div>

        {/* Stat 2: Active Match Status */}
        <div className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
              activeMatchExists ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'
            }`}>
              <Activity size={24} className={activeMatchExists ? 'animate-pulse' : ''} />
            </div>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              activeMatchExists ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
            }`}>
              {activeMatchExists ? (lang === 'ar' ? 'جارية الآن' : 'En cours') : (lang === 'ar' ? 'متوقفة' : 'Inactif')}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black mb-1 truncate">
            {activeMatchExists && match ? `${match.homeTeam.name} - ${match.awayTeam.name}` : (lang === 'ar' ? 'لا توجد مباراة' : 'Aucun match')}
          </div>
          <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {activeMatchExists ? (lang === 'ar' ? 'حالة المقابلة الحالية' : 'Match actif') : (lang === 'ar' ? 'جاهز لبدء مباراة' : 'Prêt')}
          </p>
        </div>

        {/* Stat 3: Total Goals Scored */}
        <div className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              <Trophy size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
              {lang === 'ar' ? 'الأهداف' : 'Buts'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-1">{totalGoalsScored}</div>
          <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {lang === 'ar' ? 'إجمالي الأهداف المسجلة' : 'Total buts'}
          </p>
        </div>

        {/* Stat 4: Scheduled Matches */}
        <div className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all hover:scale-[1.02] ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
              {lang === 'ar' ? 'المواعيد' : 'Planning'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-1">{totalScheduled}</div>
          <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {lang === 'ar' ? 'مباريات مجدولة' : 'Matchs planifiés'}
          </p>
        </div>
      </div>

      {/* Quick Action Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight px-1 flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          <span>{lang === 'ar' ? 'التنقل السريع والإجراءات الرئيسية' : 'Accès Rapide'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: New Match */}
          <button
            onClick={onNewMatch}
            className={`p-6 rounded-[2.2rem] border-2 text-start transition-all duration-200 flex flex-col justify-between group hover:scale-[1.02] hover:shadow-xl ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <Plus size={28} strokeWidth={3} />
              </div>
              <ArrowUpRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">{lang === 'ar' ? 'إعداد وبدء مباراة جديدة' : 'Nouveau Match'}</h3>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'ar' ? 'تحديد الفرق، اللوائح، الحكام والتوقيت الرسمي.' : 'Configurer les équipes et arbitres.'}
              </p>
            </div>
          </button>

          {/* Action 2: Current Match / Scoreboard */}
          <button
            onClick={() => onNavigate(match ? 'match' : 'setup_choice')}
            className={`p-6 rounded-[2.2rem] border-2 text-start transition-all duration-200 flex flex-col justify-between group hover:scale-[1.02] hover:shadow-xl ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${
                match ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-slate-700 shadow-slate-700/30'
              }`}>
                <Play size={28} strokeWidth={3} />
              </div>
              <ArrowUpRight size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">{lang === 'ar' ? 'تسيير المقابلة الحالية' : 'Match Actل'}</h3>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : (lang === 'ar' ? 'لا توجد مقابلة نشطة حالياً' : 'Aucun match actif')}
              </p>
            </div>
          </button>

          {/* Action 3: Archive */}
          <button
            onClick={() => onNavigate('archive')}
            className={`p-6 rounded-[2.2rem] border-2 text-start transition-all duration-200 flex flex-col justify-between group hover:scale-[1.02] hover:shadow-xl ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-purple-500' : 'bg-white border-slate-100 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                <History size={28} strokeWidth={2.5} />
              </div>
              <ArrowUpRight size={20} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">{lang === 'ar' ? 'أرشيف المباريات والنتائج' : 'Archives'}</h3>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'ar' ? `${totalMatchesArchived} مباراة مؤرشفة ومسجلة.` : `${totalMatchesArchived} matchs archivés.`}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Matches Archive Preview */}
      {archive.length > 0 && (
        <div className={`p-6 rounded-[2.5rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              <h3 className="text-lg font-black">{lang === 'ar' ? 'آخر المباريات المنجزة' : 'Derniers Matchs'}</h3>
            </div>
            <button
              onClick={() => onNavigate('archive')}
              className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {lang === 'ar' ? 'عرض الكل ←' : 'Voir tout →'}
            </button>
          </div>

          <div className="space-y-3">
            {archive.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onNavigate('match');
                }}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer hover:scale-[1.01] ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center font-black">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div className="font-black text-sm">
                      {m.homeTeam.name} <span className="text-slate-400 font-normal italic mx-1">vs</span> {m.awayTeam.name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{m.details.date || 'اليوم'}</span>
                      <span>•</span>
                      <span>{m.details.categorie || 'عام'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-sm">
                    {(m.score.home + m.score.homePenalties)} - {(m.score.away + m.score.awayPenalties)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
