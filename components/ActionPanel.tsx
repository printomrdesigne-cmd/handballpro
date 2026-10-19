import React, { useRef, useState } from 'react';
import { SanctionType, MatchState, AppLanguage } from '../types.ts';
import { Zap, Crosshair, AlertCircle } from 'lucide-react';
import { translations } from '../utils/translations.ts';

interface ActionPanelProps {
  match: MatchState; 
  selectedTarget: { type: 'player' | 'coach' | 'assistant-coach', team: 'home' | 'away', id?: string } | null;
  onAction: (type: 'goal' | '7m' | SanctionType, inc?: boolean) => void;
  onUndo: () => void;
  hasHistory: boolean;
  isDarkMode: boolean;
  matchActive: boolean;
  isTimeoutActive: boolean;
  playerSuspended: boolean;
  suspensionDuration?: number; // 60 or 120
  lang?: AppLanguage;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  match,
  selectedTarget,
  onAction,
  onUndo,
  hasHistory,
  isDarkMode,
  matchActive,
  isTimeoutActive,
  playerSuspended,
  suspensionDuration = 120, // default 2 minutes
  lang = 'ar'
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const lastActionTimeRef = useRef<number>(0);
  const [activePress, setActivePress] = useState<string | null>(null);
  
  // State for 2-minute confirmation
  const [showTwoMinConfirm, setShowTwoMinConfirm] = useState(false);

  const handlePointerDown = (type: 'goal' | '7m' | SanctionType) => {
    isLongPress.current = false;
    setActivePress(type);
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onAction(type, false); // Trigger undo (inc = false)
      if (navigator.vibrate) navigator.vibrate([30, 30]);
      setActivePress(null);
    }, 700);
  };

  const handlePointerUp = (type: 'goal' | '7m' | SanctionType) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const now = Date.now();
    if (!isLongPress.current && activePress === type) {
      // Cooldown guard to ensure strictly 1 click = 1 goal, preventing ghost taps or duplicate events
      if (now - lastActionTimeRef.current < 400) {
        setActivePress(null);
        return;
      }
      lastActionTimeRef.current = now;

      if (type === SanctionType.TWO_MINUTES) {
        setShowTwoMinConfirm(true);
      } else {
        onAction(type, true);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }
    setActivePress(null);
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActivePress(null);
  };

  const confirmTwoMin = () => {
    setShowTwoMinConfirm(false);
    onAction(SanctionType.TWO_MINUTES, true);
  };

  if (!selectedTarget) {
    return (
      <div className={`w-full p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-center transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
        <p className="text-[10px] sm:text-xs font-bold">
          {lang === 'ar' 
            ? 'حدد رقم اللاعب ثم اضغط على لوحة الأهداف لتسجيل الهدف (أو اضغط مطولاً على رقم اللاعب لإلغاء هدف)' 
            : lang === 'fr' 
            ? 'Sélectionnez un joueur puis cliquez sur le score pour marquer (appui long sur le joueur pour annuler)' 
            : 'Select a player then click scoreboard to score (or long-press player number to undo goal)'}
        </p>
      </div>
    );
  }

  const team = selectedTarget.team === 'home' ? match.homeTeam : match.awayTeam;
  const isPlayer = selectedTarget.type === 'player';
  const player = isPlayer ? team.players.find(p => p.id === selectedTarget.id) : null;
  const targetStaff = selectedTarget.type === 'coach' ? team.coach : (selectedTarget.type === 'assistant-coach' ? team.assistantCoach : null);

  const sanctions = isPlayer ? (player?.sanctions || []) : (targetStaff?.sanctions || []);
  const hasYellowCard = sanctions.some(s => s.type === SanctionType.YELLOW);
  const hasRedCard = sanctions.some(s => s.type === SanctionType.RED);
  const hasBlueCard = sanctions.some(s => s.type === SanctionType.BLUE);
  const twoMinCount = sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length;
  
  const isDisqualified = hasRedCard || hasBlueCard;
  const isSuspended = isPlayer ? playerSuspended : false;

  const canGoal = isPlayer && !isDisqualified && !isSuspended && matchActive && !isTimeoutActive;
  
  let canYellow = !hasYellowCard && !isDisqualified;
  if (isPlayer) {
    const teamYellows = team.players.reduce((sum, p) => sum + p.sanctions.filter(s => s.type === SanctionType.YELLOW).length, 0);
    if (teamYellows >= 3) canYellow = false;
  }

  const canTwoMin = !isDisqualified;
  const canRed = !isDisqualified;
  const enableBlueButton = (hasRedCard && !hasBlueCard) || hasBlueCard;

  const btnBaseClass = "flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-xl sm:rounded-2xl border sm:border-2 transition-all shadow-sm select-none touch-none active:scale-95";
  const disabledClass = "bg-slate-500/10 border-slate-500/20 text-slate-500 cursor-not-allowed opacity-50 shadow-none active:scale-100";

  const renderActionButton = (
    type: 'goal' | '7m' | SanctionType, 
    label: string, 
    icon: React.ReactNode, 
    activeColorClass: string,
    enabled: boolean,
    title?: string
  ) => {
    const isPressed = activePress === type;
    
    return (
      <button
        disabled={!enabled}
        onPointerDown={() => enabled && handlePointerDown(type)}
        onPointerUp={() => enabled && handlePointerUp(type)}
        onPointerLeave={handlePointerLeave}
        className={`${btnBaseClass} ${enabled ? activeColorClass : disabledClass} ${isPressed ? 'scale-90 brightness-110 shadow-inner' : ''}`}
        title={title}
      >
        {icon}
        <span className="text-[8px] sm:text-[10px] font-black">{label}</span>
      </button>
    );
  };
  
  const suspensionLabel = suspensionDuration === 60 ? "1'" : "2'";
  const suspensionText = suspensionDuration === 60 
    ? (lang === 'ar' ? 'دقيقة' : lang === 'fr' ? '1 min' : '1 min')
    : (lang === 'ar' ? 'دقيقتين' : lang === 'fr' ? '2 min' : '2 min');

  const isThirdSuspension = isPlayer && twoMinCount === 2;

  return (
    <>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 w-full" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Yellow Card Action */}
        {renderActionButton(
          SanctionType.YELLOW, 
          t.yellowCard, 
          <div className="w-3 h-4.5 sm:w-4 sm:h-6 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm" />, 
          'bg-yellow-400 border-yellow-500 text-yellow-950',
          canYellow || hasYellowCard
        )}

        {/* 2 Minutes Suspension Action */}
        {renderActionButton(
          SanctionType.TWO_MINUTES, 
          suspensionText, 
          <div className="text-sm sm:text-lg font-black leading-none">{suspensionLabel}</div>, 
          'bg-slate-900 border-slate-700 text-white',
          canTwoMin
        )}

        {/* Red Card Action */}
        {renderActionButton(
          SanctionType.RED, 
          t.redCard, 
          <div className="w-3 h-4.5 sm:w-4 sm:h-6 bg-red-600 rounded-sm border border-red-800 shadow-sm" />, 
          'bg-red-600 border-red-700 text-white',
          canRed || hasRedCard
        )}

        {/* Blue Card Action */}
        {renderActionButton(
          SanctionType.BLUE, 
          t.blueCard, 
          <div className="w-3 h-4.5 sm:w-4 sm:h-6 bg-blue-600 rounded-sm border border-blue-800 shadow-sm" />, 
          'bg-blue-600 border-blue-700 text-white',
          enableBlueButton
        )}
      </div>

      {/* Confirmation Modal for 2 Minutes */}
      {showTwoMinConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className={`w-full max-w-sm p-6 rounded-[2rem] border-2 shadow-2xl relative animate-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white mb-2 shadow-lg border-2 ${isThirdSuspension ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                {isThirdSuspension ? <div className="w-6 h-8 bg-red-500 rounded border border-red-300 shadow-sm"></div> : <span className="text-3xl font-black">{suspensionLabel}</span>}
              </div>
              <h3 className="text-xl font-black">
                {isThirdSuspension 
                  ? (lang === 'ar' ? 'إقصاء للمرة الثالثة (بطاقة حمراء)' : lang === 'fr' ? '3ème exclusion (Carton Rouge)' : '3rd suspension (Red Card)')
                  : (lang === 'ar' ? 'تأكيد الإقصاء المؤقت' : lang === 'fr' ? 'Confirmation de l\'exclusion' : 'Confirm Suspension')}
              </h3>
              <p className={`text-xs font-bold mt-1 px-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                {isThirdSuspension 
                  ? (lang === 'ar' ? "هذا هو الإيقاف الثالث لهذا اللاعب. سيتم منح البطاقة الحمراء واستبعاد اللاعب." : lang === 'fr' ? "C'est la 3ème exclusion. Carton rouge automatique infligé." : "This is the 3rd suspension. Automatic red card applied.")
                  : (lang === 'ar' ? `هل أنت متأكد من منح ${suspensionText} لهذا ${isPlayer ? 'اللاعب' : 'المؤطر'}؟` : lang === 'fr' ? `Confirmer l'exclusion de ${suspensionText} ?` : `Confirm ${suspensionText} suspension?`)
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={confirmTwoMin} className={`py-3 text-white font-black rounded-xl shadow-lg transition-colors ${isThirdSuspension ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                {t.confirm}
              </button>
              <button onClick={() => setShowTwoMinConfirm(false)} className={`py-3 font-black rounded-xl border-2 transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
