import React, { useRef, useState, useMemo } from 'react';
import { MatchState, MatchPeriod, SanctionType, AppLanguage } from '../types.ts';
import { Play, Pause, Ban, Flag, ChevronLeft, ChevronRight, RotateCcw, Timer, History } from 'lucide-react';
import { translations } from '../utils/translations.ts';

interface ScoreBoardProps {
  match: MatchState;
  onToggleTimer: () => void;
  onTimeout: (team: 'home' | 'away') => void;
  onCancelTimeout: (team: 'home' | 'away') => void;
  onFinishMatch: () => void;
  onPeriodChange?: (direction: 'next' | 'prev') => void;
  timeoutTimer: number | null;
  breakTimer: number | null;
  isDarkMode?: boolean;
  lang?: AppLanguage;
  selectedTarget?: { type: 'player' | 'coach' | 'assistant-coach', team: 'home' | 'away', id?: string } | null;
  onScoreGoal?: (team: 'home' | 'away') => void;
  onOpenEvents?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ 
  match, 
  onToggleTimer, 
  onTimeout, 
  onCancelTimeout,
  onFinishMatch,
  onPeriodChange,
  timeoutTimer, 
  breakTimer,
  isDarkMode = false,
  lang = 'ar',
  selectedTarget,
  onScoreGoal,
  onOpenEvents
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isBreak = match.period === MatchPeriod.BREAK;
  const isExtraTime = match.period.includes('إضافي');
  const timerRefHome = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRefAway = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const [pressing, setPressing] = useState<'home' | 'away' | null>(null);

  const homeCanTimeout = match.homeTeam.timeoutsUsed < 3 && match.homeTeam.timeoutsThisHalf < 2 && !isExtraTime;
  const awayCanTimeout = match.awayTeam.timeoutsUsed < 3 && match.awayTeam.timeoutsThisHalf < 2 && !isExtraTime;

  const homeCanCancel = match.homeTeam.timeoutsUsed > 0;
  const awayCanCancel = match.awayTeam.timeoutsUsed > 0;

  // Calculate players ending suspension soon (<= 20s)
  const endingSuspensions = useMemo(() => {
    const list: { side: 'home' | 'away', number: string, remaining: number, color: string }[] = [];
    
    // Check Home Team
    match.homeTeam.players.forEach(p => {
      const s = p.sanctions.find(s => s.type === SanctionType.TWO_MINUTES && s.remainingTime !== undefined && s.remainingTime > 0 && s.remainingTime <= 20);
      if (s) {
        list.push({ side: 'home', number: p.number, remaining: s.remainingTime!, color: match.homeTeam.color });
      }
    });

    // Check Away Team
    match.awayTeam.players.forEach(p => {
      const s = p.sanctions.find(s => s.type === SanctionType.TWO_MINUTES && s.remainingTime !== undefined && s.remainingTime > 0 && s.remainingTime <= 20);
      if (s) {
        list.push({ side: 'away', number: p.number, remaining: s.remainingTime!, color: match.awayTeam.color });
      }
    });

    return list;
  }, [match.homeTeam.players, match.awayTeam.players, match.timer]);

  const canFinishMatch = useMemo(() => {
    if (match.isActive || match.isFinished) return false;
    let isDraw = match.period === MatchPeriod.PENALTIES 
      ? match.score.homePenalties === match.score.awayPenalties 
      : match.score.home === match.score.away;
    if (isDraw) return false;

    const halfDur = match.config.halfDuration;
    const otDur = match.config.otDuration;

    if (match.period === MatchPeriod.SECOND_HALF) return match.timer >= halfDur * 2;
    if (match.period === MatchPeriod.OT1_H2) return match.timer >= (halfDur * 2) + (otDur * 2);
    if (match.period === MatchPeriod.OT2_H2) return match.timer >= (halfDur * 2) + (otDur * 2) + (otDur * 2);

    if (match.period === MatchPeriod.PENALTIES) {
      const hShots = match.penaltySequence.home.length;
      const aShots = match.penaltySequence.away.length;
      const maxShots = match.config.penaltyShots || 5;
      if (hShots < maxShots || aShots < maxShots) {
        const remainingH = maxShots - hShots; 
        const remainingA = maxShots - aShots;
        if (match.score.homePenalties > match.score.awayPenalties + remainingA || match.score.awayPenalties > match.score.homePenalties + remainingH) return true;
        return false;
      }
      return (hShots === aShots) && (match.score.homePenalties !== match.score.awayPenalties);
    }
    return false;
  }, [match]);

  const handlePointerDown = (team: 'home' | 'away') => {
    if (team === 'home' && !homeCanTimeout && !homeCanCancel) return;
    if (team === 'away' && !awayCanTimeout && !awayCanCancel) return;

    isLongPress.current = false;
    setPressing(team);
    const timer = setTimeout(() => {
      onCancelTimeout(team);
      isLongPress.current = true;
      setPressing(null);
    }, 800);
    if (team === 'home') timerRefHome.current = timer;
    else timerRefAway.current = timer;
  };

  const handlePointerUp = (team: 'home' | 'away') => {
    setPressing(null);
    if (team === 'home') { if (timerRefHome.current) clearTimeout(timerRefHome.current); } 
    else { if (timerRefAway.current) clearTimeout(timerRefAway.current); }
    
    if (!isLongPress.current) {
      if (team === 'home' && homeCanTimeout) onTimeout('home');
      if (team === 'away' && awayCanTimeout) onTimeout('away');
    }
  };

  const renderTimeoutDots = (used: number, thisHalf: number, team: 'home' | 'away') => (
    <div className="flex gap-1.5 items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-lg px-2 py-1 h-8 shadow-inner">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className={`w-3 h-3 rounded-full border-2 transition-all ${i <= used ? (team === 'home' ? 'bg-red-500 border-red-600' : 'bg-blue-500 border-blue-600') : 'bg-transparent border-slate-300 dark:border-slate-600'}`}
        />
      ))}
    </div>
  );

  const getPeriodLabel = (period: MatchPeriod) => {
    switch (period) {
      case MatchPeriod.FIRST_HALF: return t.periodFirstHalf;
      case MatchPeriod.BREAK: return t.periodBreak;
      case MatchPeriod.SECOND_HALF: return t.periodSecondHalf;
      case MatchPeriod.OT1_H1: return t.periodOT1H1;
      case MatchPeriod.OT1_H2: return t.periodOT1H2;
      case MatchPeriod.OT2_H1: return t.periodOT2H1;
      case MatchPeriod.OT2_H2: return t.periodOT2H2;
      case MatchPeriod.PENALTIES: return t.periodPenalties;
      default: return period;
    }
  };

  return (
    <div className={`flex flex-col w-full rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-4 shadow-xl border relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-800/50 pointer-events-none opacity-50" />

      {/* SUSPENSION ALERTS (Ending Soon) */}
      {endingSuspensions.length > 0 && (
        <div className="absolute top-0 left-0 w-full z-50 flex justify-center gap-1 sm:gap-2 p-1 bg-transparent pointer-events-none">
          {endingSuspensions.map((item, idx) => (
            <div key={`${item.side}-${item.number}-${idx}`} className="animate-pulse bg-amber-400 text-black font-black px-2 sm:px-4 py-1 rounded-b-xl shadow-lg border-x-2 border-b-2 border-amber-600 flex items-center gap-1.5 pointer-events-auto transform transition-transform hover:scale-105">
              <div className="flex flex-col items-center leading-none">
                <span className="text-[7px] sm:text-[8px] uppercase">ENTRÉE</span>
                <Timer size={9} />
              </div>
              <span className="text-base sm:text-xl bg-white px-1 sm:px-1.5 rounded-md border border-black min-w-[24px] sm:min-w-[30px] text-center" style={{ color: item.color }}>{item.number}</span>
              <span className="font-mono text-xs sm:text-sm bg-black text-white px-1 sm:px-1.5 rounded py-0.5">{item.remaining}s</span>
            </div>
          ))}
        </div>
      )}

      {/* 1. Period Header & Events Log Button */}
      <div className="relative z-10 flex items-center justify-between sm:justify-center gap-2 sm:gap-6 mb-2 sm:mb-4 mt-0 sm:mt-1 px-1">
        <div className="flex items-center gap-1 sm:gap-2">
          {onPeriodChange && (
            <button onClick={() => onPeriodChange(isRtl ? 'prev' : 'next')} className={`p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <ChevronRight size={18} className="sm:w-6 sm:h-6" strokeWidth={3} />
            </button>
          )}
          <div className={`text-xs sm:text-base font-black uppercase tracking-wider ${match.period === MatchPeriod.PENALTIES ? 'text-purple-600' : (isDarkMode ? 'text-slate-200' : 'text-slate-900')}`}>
            {getPeriodLabel(match.period)}
          </div>
          {onPeriodChange && (
            <button onClick={() => onPeriodChange(isRtl ? 'next' : 'prev')} className={`p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <ChevronLeft size={18} className="sm:w-6 sm:h-6" strokeWidth={3} />
            </button>
          )}
        </div>

        {onOpenEvents && (
          <button
            type="button"
            onClick={onOpenEvents}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-[10px] sm:text-xs font-black shadow-sm transition-all cursor-pointer hover:scale-105 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-blue-600 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white'
            }`}
            title={lang === 'ar' ? 'سجل أحداث المباراة واستيرادها' : 'Journal des événements'}
          >
            <History size={14} className="text-blue-500" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'سجل الأحداث' : 'Événements'}</span>
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-black">
              {match.events.length}
            </span>
          </button>
        )}
      </div>

      {/* 2. Main Score Area */}
      <div className="flex items-start justify-between relative z-10 px-1 sm:px-6">
        {/* Team 1 Side (Home) */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-3 flex-1">
          <h3 className="font-black text-xs sm:text-base truncate max-w-[85px] sm:max-w-[140px] text-center" style={{ color: match.homeTeam.color }}>
            {match.homeTeam.name}
          </h3>
          
          <button 
            type="button"
            onClick={() => onScoreGoal?.('home')}
            disabled={match.isFinished}
            title={
              selectedTarget?.type === 'player' && selectedTarget.team === 'home'
                ? (lang === 'ar' ? 'اضغط لتسجيل هدف للاعب المحدد' : 'Cliquez pour enregistrer un but')
                : (lang === 'ar' ? 'حدد رقم اللاعب أولاً ثم اضغط هنا لتسجيل الهدف' : 'Sélectionnez un joueur puis cliquez pour marquer')
            }
            className={`w-14 h-14 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center shadow-xl sm:shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative group ${
              selectedTarget?.type === 'player' && selectedTarget.team === 'home'
                ? 'ring-4 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 animate-pulse'
                : ''
            }`}
            style={{ backgroundColor: match.homeTeam.color }}
          >
            <span className="text-3xl sm:text-6xl font-black text-white drop-shadow-md leading-none">
              {match.score.home}
            </span>
            <span className="text-[7.5px] sm:text-[10px] font-black text-white/95 uppercase tracking-tight mt-0.5 sm:mt-1 bg-black/30 px-1 sm:px-2 py-0.5 rounded-full shadow-inner">
              {lang === 'ar' ? '+ هدف' : '+ But'}
            </span>
          </button>

          {/* Timeout Controls Home */}
          <div className="flex flex-col gap-1 mt-0.5 sm:mt-1 w-full max-w-[85px] sm:max-w-[120px]">
            <button 
              disabled={(!homeCanTimeout && !homeCanCancel) || isBreak || match.isFinished}
              onPointerDown={() => handlePointerDown('home')}
              onPointerUp={() => handlePointerUp('home')}
              onPointerLeave={() => { if(timerRefHome.current) clearTimeout(timerRefHome.current); setPressing(null); }}
              className={`w-full py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm transition-all border
                ${(!homeCanTimeout && !homeCanCancel) || isBreak || match.isFinished 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}
                ${pressing === 'home' ? 'scale-95 bg-red-50 border-red-200 text-red-500' : ''}
              `}
            >
              {pressing === 'home' ? `${t.cancel}...` : t.timeout}
            </button>
            {renderTimeoutDots(match.homeTeam.timeoutsUsed, match.homeTeam.timeoutsThisHalf, 'home')}
          </div>
        </div>

        {/* CENTER (TIMER) */}
        <div className="flex flex-col items-center justify-start pt-1 sm:pt-2 mx-1 sm:mx-4">
          <div className={`relative w-28 h-20 sm:w-44 sm:h-36 bg-slate-950 rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center shadow-xl sm:shadow-2xl border-2 sm:border-4 ${match.isActive ? 'border-green-500/40' : 'border-slate-800'}`}>
            {/* Timer Text */}
            <div className={`text-2xl sm:text-5xl font-mono font-black tracking-wider mb-1 sm:mb-2 ${match.isFinished ? 'text-red-500' : isBreak ? 'text-green-400' : 'text-white'}`}>
              {match.isFinished ? "00:00" : formatTime(match.timer)}
            </div>

            {/* Play/Pause Button Floating */}
            <button 
              onClick={onToggleTimer}
              disabled={match.isFinished}
              className={`absolute -bottom-4 sm:-bottom-5 w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-white dark:border-slate-900 transition-transform active:scale-90 
                ${match.isFinished ? 'bg-slate-700 cursor-not-allowed' : match.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {match.isFinished ? <Flag size={14} className="sm:w-5 sm:h-5 text-white" /> : match.isActive ? <Pause size={16} fill="white" className="sm:w-6 sm:h-6 text-white" /> : <Play size={16} fill="white" className="sm:w-6 sm:h-6 ml-0.5 text-white" />}
            </button>
          </div>

          {/* Timeout Overlay Display */}
          {timeoutTimer !== null && (
            <div className="mt-5 sm:mt-8 bg-red-600 text-white px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black animate-pulse shadow-lg">
              T.O: {timeoutTimer}s
            </div>
          )}
          
          {/* Finish Button below timer */}
          {canFinishMatch && (
            <button 
              onClick={onFinishMatch}
              className="mt-5 sm:mt-8 flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 bg-black text-white text-[9px] sm:text-[10px] font-black rounded-full shadow-lg hover:bg-slate-800 transition-all animate-in zoom-in"
            >
              <Flag size={11} />
              <span>{t.finishMatch}</span>
            </button>
          )}
          {match.isFinished && (
            <div className="mt-5 sm:mt-8 text-[9px] sm:text-[10px] font-black text-red-500 bg-red-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
              {t.finalScore}
            </div>
          )}
        </div>

        {/* Team 2 Side (Away) */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-3 flex-1">
          <h3 className="font-black text-xs sm:text-base truncate max-w-[85px] sm:max-w-[140px] text-center" style={{ color: match.awayTeam.color }}>
            {match.awayTeam.name}
          </h3>

          <button 
            type="button"
            onClick={() => onScoreGoal?.('away')}
            disabled={match.isFinished}
            title={
              selectedTarget?.type === 'player' && selectedTarget.team === 'away'
                ? (lang === 'ar' ? 'اضغط لتسجيل هدف للاعب المحدد' : 'Cliquez pour enregistrer un but')
                : (lang === 'ar' ? 'حدد رقم اللاعب أولاً ثم اضغط هنا لتسجيل الهدف' : 'Sélectionnez un joueur puis cliquez pour marquer')
            }
            className={`w-14 h-14 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center shadow-xl sm:shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative group ${
              selectedTarget?.type === 'player' && selectedTarget.team === 'away'
                ? 'ring-4 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 animate-pulse'
                : ''
            }`}
            style={{ backgroundColor: match.awayTeam.color }}
          >
            <span className="text-3xl sm:text-6xl font-black text-white drop-shadow-md leading-none">
              {match.score.away}
            </span>
            <span className="text-[7.5px] sm:text-[10px] font-black text-white/95 uppercase tracking-tight mt-0.5 sm:mt-1 bg-black/30 px-1 sm:px-2 py-0.5 rounded-full shadow-inner">
              {lang === 'ar' ? '+ هدف' : '+ But'}
            </span>
          </button>

          {/* Timeout Controls Away */}
          <div className="flex flex-col gap-1 mt-0.5 sm:mt-1 w-full max-w-[85px] sm:max-w-[120px]">
            <button 
              disabled={(!awayCanTimeout && !awayCanCancel) || isBreak || match.isFinished}
              onPointerDown={() => handlePointerDown('away')}
              onPointerUp={() => handlePointerUp('away')}
              onPointerLeave={() => { if(timerRefAway.current) clearTimeout(timerRefAway.current); setPressing(null); }}
              className={`w-full py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm transition-all border
                ${(!awayCanTimeout && !awayCanCancel) || isBreak || match.isFinished 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}
                ${pressing === 'away' ? 'scale-95 bg-red-50 border-red-200 text-red-500' : ''}
              `}
            >
              {pressing === 'away' ? `${t.cancel}...` : t.timeout}
            </button>
            {renderTimeoutDots(match.awayTeam.timeoutsUsed, match.awayTeam.timeoutsThisHalf, 'away')}
          </div>
        </div>
      </div>
    </div>
  );
};
