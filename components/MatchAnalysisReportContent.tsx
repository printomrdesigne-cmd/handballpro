import React from 'react';
import { MatchState, AppLanguage } from '../types.ts';
import { MatchAnalysisReport } from '../utils/matchAnalysis.ts';
import { AIMatchAnalysis } from '../utils/aiAnalysisService.ts';
import { getSafeTeamTextColor, getContrastTextColor } from '../utils/colorContrast.ts';
import { 
  Award, 
  TrendingUp, 
  Clock, 
  PieChart, 
  Bot, 
  Sparkles, 
  Target, 
  Lightbulb, 
  FileText,
  Copy,
  Check,
  Calendar,
  MapPin,
  Trophy,
  Shield
} from 'lucide-react';

interface MatchAnalysisReportContentProps {
  match: MatchState;
  analysis: MatchAnalysisReport;
  aiAnalysis?: AIMatchAnalysis | null;
  isDarkMode?: boolean;
  lang: AppLanguage;
  onCopyAIAnalysis?: () => void;
  copiedAI?: boolean;
}

export const MatchAnalysisReportContent: React.FC<MatchAnalysisReportContentProps> = ({
  match,
  analysis,
  aiAnalysis,
  isDarkMode = false,
  lang,
  onCopyAIAnalysis,
  copiedAI
}) => {
  const isRtl = lang === 'ar';

  // Ensure accessible, high-contrast team colors across Light Mode, Dark Mode, and A4 Print
  const rawHomeColor = (!match.homeTeam.color || match.homeTeam.color.toLowerCase() === '#000000' || match.homeTeam.color.toLowerCase() === '#ffffff')
    ? '#2563eb'
    : match.homeTeam.color;

  const rawAwayColor = (!match.awayTeam.color || match.awayTeam.color.toLowerCase() === '#000000' || match.awayTeam.color.toLowerCase() === '#ffffff')
    ? '#059669'
    : match.awayTeam.color;

  const homeTextColor = getSafeTeamTextColor(rawHomeColor, isDarkMode);
  const awayTextColor = getSafeTeamTextColor(rawAwayColor, isDarkMode);

  const competition = match.details?.competition || (isRtl ? 'مباراة رسمية في كرة اليد' : 'Rencontre Officielle de Handball');
  const matchCategory = match.details?.categorie || '';
  const matchDate = match.details?.date || new Date().toLocaleDateString(isRtl ? 'ar-MA' : 'fr-FR');
  const matchTime = match.details?.time || '';
  const matchVenue = match.details?.lieu || '';
  const matchNum = match.details?.numRencontre || '';
  const referees = [match.details?.referee1, match.details?.referee2].filter(Boolean).join(' • ');

  return (
    <div className={`space-y-4 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>

      {/* 0. Official A4 Document Header Strip */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isDarkMode
            ? 'bg-slate-950/80 border-slate-800 text-slate-200'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Trophy size={18} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs sm:text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {competition}
              </span>
              {matchCategory && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                  isDarkMode ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {matchCategory}
                </span>
              )}
            </div>
            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isRtl ? 'التقرير الفني والإحصائي الرسمي للمباراة' : 'Rapport Technique & Statistique Officiel'}
            </p>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} color="#3b82f6" />
            <span>{matchDate}{matchTime ? ` • ${matchTime}` : ''}</span>
          </span>
          {matchVenue && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} color="#ef4444" />
              <span>{matchVenue}</span>
            </span>
          )}
          {matchNum && (
            <span className={`px-2 py-0.5 rounded-md font-mono font-black ${
              isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white border border-slate-200 text-slate-700'
            }`}>
              #{matchNum}
            </span>
          )}
          {referees && (
            <span className="inline-flex items-center gap-1">
              <Shield size={12} color="#8b5cf6" />
              <span>{isRtl ? 'الحكام:' : 'Arbitres:'} {referees}</span>
            </span>
          )}
        </div>
      </div>

      {/* 1. Match Result Banner */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className={`p-5 sm:p-6 rounded-3xl border-2 relative overflow-hidden shadow-md transition-all ${
          isDarkMode 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-white' 
            : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-emerald-50/90 border-indigo-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-center md:text-start">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-2 shadow-sm ${
              isDarkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-500/15 text-blue-800 border border-blue-200'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30" style={{ backgroundColor: rawHomeColor }} />
              <span>{isRtl ? 'المضيف' : 'Domicile'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black" style={{ color: homeTextColor }}>{match.homeTeam.name}</h3>
            <div className={`text-xs font-bold mt-1.5 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{isRtl ? 'الشوط 1:' : 'MT1:'} <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.firstHalf.home}</strong></span>
              <span>•</span>
              <span>{isRtl ? 'الشوط 2:' : 'MT2:'} <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.secondHalf.home}</strong></span>
              {analysis.penalties.home > 0 && (
                <>
                  <span>•</span>
                  <span>7m: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.penalties.home}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Central Score Card */}
          <div className={`flex flex-col items-center px-7 py-3 rounded-2xl border shadow-lg ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isRtl ? 'النتيجة النهائية' : 'Score Final'}
            </span>
            <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {analysis.finalScore.home} - {analysis.finalScore.away}
            </div>
            <span className={`mt-2 text-xs font-black px-3.5 py-1 rounded-full border shadow-sm ${
              isDarkMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isRtl ? 'الفائز:' : 'Vainqueur:'} {analysis.winner}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center md:items-end">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-2 shadow-sm ${
              isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500/15 text-emerald-800 border border-emerald-200'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30" style={{ backgroundColor: rawAwayColor }} />
              <span>{isRtl ? 'الضيف' : 'Extérieur'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black" style={{ color: awayTextColor }}>{match.awayTeam.name}</h3>
            <div className={`text-xs font-bold mt-1.5 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{isRtl ? 'الشوط 1:' : 'MT1:'} <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.firstHalf.away}</strong></span>
              <span>•</span>
              <span>{isRtl ? 'الشوط 2:' : 'MT2:'} <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.secondHalf.away}</strong></span>
              {analysis.penalties.away > 0 && (
                <>
                  <span>•</span>
                  <span>7m: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{analysis.penalties.away}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Highlights Strip (MVP, Biggest Run, Pace) */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
      >
        {/* Highlight 1: MVP Player */}
        <div className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 shadow-sm transition-all ${
          isDarkMode ? 'bg-slate-950/60 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Award size={24} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              {isRtl ? 'أفضل لاعب وهداف المقابلة' : 'Homme du Match (MVP)'}
            </span>
            <h4 className="text-sm font-black truncate mt-0.5">
              {analysis.mvpPlayer ? `#${analysis.mvpPlayer.number} ${analysis.mvpPlayer.name}` : (isRtl ? 'لا يوجد هداف محدد' : 'Non déterminé')}
            </h4>
            <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {analysis.mvpPlayer ? `${analysis.mvpPlayer.goals} ${isRtl ? 'أهداف' : 'buts'} (${isRtl ? 'تقييم' : 'Note'}: ${analysis.mvpPlayer.impactScore})` : ''}
            </p>
          </div>
        </div>

        {/* Highlight 2: Biggest Scoring Run */}
        <div className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 shadow-sm transition-all ${
          isDarkMode ? 'bg-slate-950/60 border-blue-500/30' : 'bg-blue-50/80 border-blue-300'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20 shrink-0">
            <TrendingUp size={24} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              {isRtl ? 'أكبر سلسلة أهداف دون رد' : 'Meilleure Série'}
            </span>
            <h4 className="text-sm font-black truncate mt-0.5">
              {analysis.largestRun ? `${analysis.largestRun.goalsCount} ${isRtl ? 'أهداف متتالية لـ' : 'buts pour'} ${analysis.largestRun.teamName}` : (isRtl ? 'تبادل مستمر للأهداف' : 'Équilibré')}
            </h4>
            <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {analysis.largestRun ? `${isRtl ? 'الفترة:' : 'Période:'} ${analysis.largestRun.startTimeStr} - ${analysis.largestRun.endTimeStr}` : ''}
            </p>
          </div>
        </div>

        {/* Highlight 3: Rhythm & Changes */}
        <div className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 shadow-sm transition-all ${
          isDarkMode ? 'bg-slate-950/60 border-purple-500/30' : 'bg-purple-50/80 border-purple-300'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20 shrink-0">
            <Clock size={24} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              {isRtl ? 'إيقاع المقابلة وتقلبات النتيجة' : 'Rythme & Changements'}
            </span>
            <h4 className="text-sm font-black truncate mt-0.5">
              {analysis.scoringPaceMinutesPerGoal > 0 ? `${isRtl ? 'هدف كل' : '1 but /'} ${analysis.scoringPaceMinutesPerGoal} ${isRtl ? 'دقيقة' : 'min'}` : '-'}
            </h4>
            <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {analysis.leadChanges} {isRtl ? 'مرات تبدّل فيها المتصدر' : 'changements de leader'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Comparative Technical Bars */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className={`p-5 rounded-2xl border-2 space-y-4 shadow-sm ${
          isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <h3 className="text-sm font-black flex items-center gap-2">
          <PieChart size={18} color="#3b82f6" strokeWidth={2.2} />
          <span>{isRtl ? 'مقارنة فنية مباشرة بين الفريقين' : 'Comparaison Technique Directe'}</span>
        </h3>

        <div className="space-y-3.5 text-xs font-bold">
          {/* Goals Bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rawHomeColor }} />
                <span>{match.homeTeam.name}: <strong className="font-mono text-sm">{analysis.finalScore.home}</strong></span>
              </span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isRtl ? 'إجمالي الأهداف' : 'Total Buts'}</span>
              <span className="flex items-center gap-1.5">
                <span>{match.awayTeam.name}: <strong className="font-mono text-sm">{analysis.finalScore.away}</strong></span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rawAwayColor }} />
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden flex shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div 
                className="h-full transition-all duration-300" 
                style={{ 
                  width: `${analysis.finalScore.home + analysis.finalScore.away > 0 ? (analysis.finalScore.home / (analysis.finalScore.home + analysis.finalScore.away)) * 100 : 50}%`,
                  backgroundColor: rawHomeColor 
                }} 
              />
              <div 
                className="h-full transition-all duration-300" 
                style={{ 
                  width: `${analysis.finalScore.home + analysis.finalScore.away > 0 ? (analysis.finalScore.away / (analysis.finalScore.home + analysis.finalScore.away)) * 100 : 50}%`,
                  backgroundColor: rawAwayColor 
                }} 
              />
            </div>
          </div>

          {/* 7m Penalties Bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span>{match.homeTeam.name}: <strong className="font-mono">{analysis.sevenMeterGoals.home}</strong></span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isRtl ? 'رميات 7 أمتار المسجلة' : 'Jets 7m réussis'}</span>
              <span>{match.awayTeam.name}: <strong className="font-mono">{analysis.sevenMeterGoals.away}</strong></span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden flex shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ 
                  width: `${(analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away > 0) ? (analysis.sevenMeterGoals.home / (analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away)) * 100 : 50}%` 
                }} 
              />
              <div 
                className="h-full bg-emerald-500 transition-all duration-300" 
                style={{ 
                  width: `${(analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away > 0) ? (analysis.sevenMeterGoals.away / (analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away)) * 100 : 50}%` 
                }} 
              />
            </div>
          </div>

          {/* 2-Min Suspensions Bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span>{match.homeTeam.name}: <strong className="font-mono">{analysis.twoMinuteImpact.homeSuspensions}</strong> ({analysis.twoMinuteImpact.homePenaltyMinutes} {isRtl ? 'د' : 'min'})</span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isRtl ? 'الإيقافات المؤقتة (2 دقيقة)' : 'Exclusions 2 min'}</span>
              <span>{match.awayTeam.name}: <strong className="font-mono">{analysis.twoMinuteImpact.awaySuspensions}</strong> ({analysis.twoMinuteImpact.awayPenaltyMinutes} {isRtl ? 'د' : 'min'})</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden flex shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div 
                className="h-full bg-orange-500 transition-all duration-300" 
                style={{ 
                  width: `${(analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions > 0) ? (analysis.twoMinuteImpact.homeSuspensions / (analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions)) * 100 : 50}%` 
                }} 
              />
              <div 
                className="h-full bg-rose-500 transition-all duration-300" 
                style={{ 
                  width: `${(analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions > 0) ? (analysis.twoMinuteImpact.awaySuspensions / (analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions)) * 100 : 50}%` 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Scorers Cards */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Home Scorers */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="text-xs font-black uppercase mb-3 flex items-center gap-2" style={{ color: homeTextColor }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rawHomeColor }} />
            <span>{isRtl ? `أبرز هدافي ${match.homeTeam.name}` : `Buteurs ${match.homeTeam.name}`}</span>
          </h4>
          {analysis.topHomeScorers.length === 0 ? (
            <p className={`text-xs font-bold py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isRtl ? 'لم يسجل أي لاعب بعد' : 'Aucun buteur'}</p>
          ) : (
            <div className="space-y-2">
              {analysis.topHomeScorers.map((p, idx) => (
                <div key={p.id} className={`flex items-center justify-between text-xs font-bold p-2.5 rounded-xl border transition-all ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px]"
                      style={{ backgroundColor: rawHomeColor, color: getContrastTextColor(rawHomeColor) }}
                    >
                      {idx + 1}
                    </span>
                    <span>#{p.number} {p.name}</span>
                  </div>
                  <span className="font-black font-mono" style={{ color: homeTextColor }}>
                    {p.goals} {isRtl ? 'أهداف' : 'buts'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Away Scorers */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="text-xs font-black uppercase mb-3 flex items-center gap-2" style={{ color: awayTextColor }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rawAwayColor }} />
            <span>{isRtl ? `أبرز هدافي ${match.awayTeam.name}` : `Buteurs ${match.awayTeam.name}`}</span>
          </h4>
          {analysis.topAwayScorers.length === 0 ? (
            <p className={`text-xs font-bold py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isRtl ? 'لم يسجل أي لاعب بعد' : 'Aucun buteur'}</p>
          ) : (
            <div className="space-y-2">
              {analysis.topAwayScorers.map((p, idx) => (
                <div key={p.id} className={`flex items-center justify-between text-xs font-bold p-2.5 rounded-xl border transition-all ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px]"
                      style={{ backgroundColor: rawAwayColor, color: getContrastTextColor(rawAwayColor) }}
                    >
                      {idx + 1}
                    </span>
                    <span>#{p.number} {p.name}</span>
                  </div>
                  <span className="font-black font-mono" style={{ color: awayTextColor }}>
                    {p.goals} {isRtl ? 'أهداف' : 'buts'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4.5. AI TACTICAL MATCH ANALYSIS SECTION (Split cleanly into pagination-safe blocks) */}
      {aiAnalysis && (
        <>
          <div
            data-pdf-block="true"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className={`p-5 rounded-3xl border-2 shadow-md space-y-3.5 transition-all ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 border-indigo-500/40' 
                : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-purple-50/70 border-indigo-300'
            }`}
          >
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
              isDarkMode ? 'border-indigo-500/25' : 'border-indigo-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
                  <Bot size={22} color="#ffffff" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black">
                      {aiAnalysis.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      isDarkMode
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35'
                        : 'bg-indigo-500/15 text-indigo-700 border-indigo-300'
                    }`}>
                      Pro Analysis
                    </span>
                  </div>
                  <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {aiAnalysis.headline}
                  </p>
                </div>
              </div>

              {onCopyAIAnalysis && (
                <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                  <button
                    type="button"
                    onClick={onCopyAIAnalysis}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 transition cursor-pointer ${
                      copiedAI 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {copiedAI ? <Check size={14} color="#ffffff" strokeWidth={2.5} /> : <Copy size={14} color="#3b82f6" strokeWidth={2.2} />}
                    <span>{copiedAI ? (isRtl ? 'تم النسخ!' : 'Copié!') : (isRtl ? 'نسخ التقرير' : 'Copier')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Narrative Overview */}
            <div className="space-y-1.5">
              <h4 className={`text-xs font-black uppercase flex items-center gap-1.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
                <Sparkles size={14} color="#6366f1" strokeWidth={2.2} />
                <span>{isRtl ? 'قراءة فنية وسردية شاملة' : 'Synthèse Narrative'}</span>
              </h4>
              <p className={`text-xs sm:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                {aiAnalysis.narrativeOverview}
              </p>
            </div>
          </div>

          {/* Turning points + MVP + Coach Advice as a distinct pagination block */}
          <div
            data-pdf-block="true"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className={`p-5 rounded-3xl border-2 space-y-4 ${
              isDarkMode
                ? 'bg-slate-950/70 border-indigo-500/30'
                : 'bg-white border-indigo-200'
            }`}
          >
            {/* Turning points */}
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase flex items-center gap-1.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                <Target size={14} color="#3b82f6" strokeWidth={2.2} />
                <span>{isRtl ? 'نقاط التحول التكتيكية والحاسمة' : 'Tournants Tactiques'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiAnalysis.turningPoints.map((point: string, idx: number) => (
                  <div key={idx} className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2 ${
                    isDarkMode ? 'bg-slate-900/70 border-slate-800 text-slate-200' : 'bg-indigo-50/40 border-indigo-100 text-slate-800'
                  }`}>
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 ${
                      isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MVP Verdict */}
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
              isDarkMode ? 'bg-slate-900/80 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
                <Award size={24} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {isRtl ? 'تقييم رجل المباراة (MVP)' : 'Verdict MVP'}
                </span>
                <h4 className="text-sm font-black">
                  {aiAnalysis.mvpEvaluation.playerName}{' '}
                  <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    ({aiAnalysis.mvpEvaluation.rating})
                  </span>
                </h4>
                <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {aiAnalysis.mvpEvaluation.verdict}
                </p>
              </div>
            </div>

            {/* Coach Advice for both teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h5 className={`text-xs font-black mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  <Lightbulb size={14} color="#3b82f6" strokeWidth={2.2} />
                  <span>{isRtl ? `توصية مدرب ${match.homeTeam.name}` : `Conseil Coach ${match.homeTeam.name}`}</span>
                </h5>
                <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {aiAnalysis.homeTeamAnalysis.coachAdvice}
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h5 className={`text-xs font-black mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <Lightbulb size={14} color="#10b981" strokeWidth={2.2} />
                  <span>{isRtl ? `توصية مدرب ${match.awayTeam.name}` : `Conseil Coach ${match.awayTeam.name}`}</span>
                </h5>
                <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {aiAnalysis.awayTeamAnalysis.coachAdvice}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. Tactical Observations & Summary Paragraph */}
      <div
        data-pdf-block="true"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className={`p-5 rounded-2xl border-2 space-y-3 ${
          isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <h4 className={`text-xs font-black uppercase flex items-center gap-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
          <FileText size={16} color="#6366f1" strokeWidth={2.2} />
          <span>{isRtl ? 'التقرير الفني والتكتيكي المفصل للمباراة' : 'Rapport Tactique & Technique'}</span>
        </h4>

        {/* Bullet Insights */}
        <div className="space-y-1.5">
          {(isRtl ? analysis.tacticalInsightsAr : analysis.tacticalInsightsFr).map((insight: string, idx: number) => (
            <div key={idx} className={`flex items-start gap-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="text-blue-500 shrink-0 mt-0.5">•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>

        {/* Narrative paragraph */}
        <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <p className={`text-xs sm:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {isRtl ? analysis.narrativeSummaryAr : analysis.narrativeSummaryFr}
          </p>
        </div>
      </div>
    </div>
  );
};
