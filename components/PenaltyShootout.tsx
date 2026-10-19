import React, { useState, useMemo } from 'react';
import { MatchState, Player, SanctionType, AppLanguage } from '../types.ts';
import { Check, X, User, Trophy, AlertCircle, PartyPopper } from 'lucide-react';

interface PenaltyShootoutProps {
  match: MatchState;
  onShot: (team: 'home' | 'away', playerId: string, isGoal: boolean) => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const PenaltyShootout: React.FC<PenaltyShootoutProps> = ({ 
  match, 
  onShot, 
  isDarkMode, 
  lang = 'ar' 
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const isRtl = lang === 'ar';

  const tPenalty = {
    ar: {
      title: 'سلسلة رميات 7 متر',
      finished: 'المباراة منتهية',
      phase1: (n: number) => `المرحلة الأولى: ${n} رميات لكل فريق`,
      suddenDeath: 'مرحلة الموت المفاجئ: رمية برمية',
      currentTurn: 'الدور الحالي على',
      lastPlayer: 'آخر لاعب متبقي',
      goal: 'هدف',
      missed: 'ضائعة',
      winner: 'الفائز بالمباراة',
      goToSheet: 'يمكنك الآن التوجه لورقة المباراة لحفظ النتيجة النهائية',
      rule: '* يجب على جميع اللاعبين المؤهلين التسديد قبل تكرار أي لاعب'
    },
    fr: {
      title: 'Séance de tirs aux 7 mètres',
      finished: 'Match Terminé',
      phase1: (n: number) => `1ère phase : ${n} tirs par équipe`,
      suddenDeath: 'Mort subite : tir au but alternatif',
      currentTurn: 'Au tour de',
      lastPlayer: 'Dernier tireur éligible',
      goal: 'But marqué',
      missed: 'Tir manqué',
      winner: 'Vainqueur du Match',
      goToSheet: 'Vous pouvez maintenant ouvrir la feuille de match pour enregistrer le résultat',
      rule: '* Tous les joueurs éligibles doivent tirer avant répétition'
    },
    en: {
      title: '7-Meter Penalty Shootout',
      finished: 'Match Finished',
      phase1: (n: number) => `Stage 1: ${n} shots per team`,
      suddenDeath: 'Sudden death: shot by shot',
      currentTurn: 'Current shooter for',
      lastPlayer: 'Last eligible shooter',
      goal: 'Goal Scored',
      missed: 'Shot Missed',
      winner: 'Match Winner',
      goToSheet: 'You can now proceed to the match sheet to save the final score',
      rule: '* All eligible players must shoot before repeating any player'
    }
  }[lang];

  const hShots = match.penaltySequence.home.length;
  const aShots = match.penaltySequence.away.length;
  const hGoals = match.score.homePenalties;
  const aGoals = match.score.awayPenalties;
  
  const maxShots = match.config.penaltyShots || 5;

  const isFinished = useMemo(() => {
    if (hShots < maxShots || aShots < maxShots) {
      const remainingH = maxShots - hShots;
      const remainingA = maxShots - aShots;
      if (hGoals > aGoals + remainingA || aGoals > hGoals + remainingH) return true;
      return false;
    }
    return hShots === aShots && hGoals !== aGoals;
  }, [hShots, aShots, hGoals, aGoals, maxShots]);

  const winner = isFinished ? (hGoals > aGoals ? 'home' : 'away') : null;

  const getEligiblePlayers = (team: 'home' | 'away') => {
    const t = team === 'home' ? match.homeTeam : match.awayTeam;
    const history = team === 'home' ? match.penaltySequence.home : match.penaltySequence.away;
    
    const activePlayers = t.players.filter(p => !p.sanctions.some(s => s.type === SanctionType.RED || s.type === SanctionType.BLUE));
    const usedIds = history.map(h => h.playerId);
    const currentCycleStart = Math.floor(history.length / activePlayers.length) * activePlayers.length;
    const usedInCurrentCycle = usedIds.slice(currentCycleStart);
    
    if (usedInCurrentCycle.length === activePlayers.length) {
      return activePlayers;
    }

    return activePlayers.filter(p => !usedInCurrentCycle.includes(p.id));
  };

  const currentTeam = match.penaltySequence.currentTurn;
  const eligiblePlayers = getEligiblePlayers(currentTeam);

  const handleRecordShot = (isGoal: boolean) => {
    if (!selectedPlayerId) return;
    onShot(currentTeam, selectedPlayerId, isGoal);
    setSelectedPlayerId(null);
  };

  const ShotHistory = ({ shots, total, isHome }: { shots: { goal: boolean }[], total: number, isHome: boolean }) => (
    <div className="flex gap-1 items-center">
      {[...Array(Math.max(maxShots, Math.ceil(total / maxShots) * maxShots))].map((_, i) => {
        const shot = shots[i];
        return (
          <div 
            key={i} 
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs border-2 transition-all ${
              !shot ? (isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-600' : 'border-slate-200 bg-slate-100 text-slate-400') :
              shot.goal ? 'bg-green-600 border-green-500 text-white shadow-sm' : 'bg-red-600 border-red-500 text-white shadow-sm'
            }`}
          >
            {shot ? (shot.goal ? <Check size={14} strokeWidth={4} /> : <X size={14} strokeWidth={4} />) : <span className="text-[10px] font-black">{i + 1}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`p-4 sm:p-6 rounded-[2rem] border-2 shadow-2xl max-w-6xl mx-auto transition-all duration-500 mt-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest mb-2 shadow-lg shadow-indigo-900/20">
          <Trophy size={16} />
          {tPenalty.title}
        </div>
        <div className={`text-[10px] font-bold px-4 py-1 rounded-full inline-block ${hShots + aShots < maxShots * 2 ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500 animate-pulse'}`}>
          {isFinished ? tPenalty.finished : (hShots + aShots < maxShots * 2 ? tPenalty.phase1(maxShots) : tPenalty.suddenDeath)}
        </div>
      </div>

      {/* MATCH STYLE SCOREBOARD STRIP */}
      <div className={`flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl shadow-xl border-2 mb-8 relative overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Background Gradients for Winner */}
        {winner === 'home' && <div className="absolute inset-y-0 left-0 w-1/2 bg-green-500/10 z-0"></div>}
        {winner === 'away' && <div className="absolute inset-y-0 right-0 w-1/2 bg-green-500/10 z-0"></div>}

        {/* Team Away (Right in RTL - Matches Scoreboard Logic) */}
        <div className="flex flex-1 items-center gap-3 z-10 min-w-0">
          <div 
            className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl font-black text-white shadow-lg border-4 border-white/20 flex-shrink-0 relative ${currentTeam === 'away' && !isFinished ? 'ring-4 ring-blue-500/50 scale-105 transition-all' : ''}`}
            style={{ backgroundColor: match.awayTeam.color }}
          >
            {aGoals}
            {winner === 'away' && <div className="absolute -top-3 -right-3 text-green-500 bg-white rounded-full p-1 shadow-md"><PartyPopper size={20} /></div>}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm sm:text-xl font-black truncate" style={{ color: match.awayTeam.color }}>{match.awayTeam.name}</h3>
            <div className="mt-1 sm:mt-2">
              <ShotHistory shots={match.penaltySequence.away} total={aShots} isHome={false} />
            </div>
          </div>
        </div>

        {/* Center VS */}
        <div className="flex flex-col items-center justify-center px-2 z-10">
          <div className={`text-xl sm:text-3xl font-black italic ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>VS</div>
        </div>

        {/* Team Home (Left in RTL - Matches Scoreboard Logic) */}
        <div className="flex flex-1 items-center justify-end gap-3 z-10 min-w-0 text-left">
          <div className="flex flex-col items-end min-w-0">
            <h3 className="text-sm sm:text-xl font-black truncate" style={{ color: match.homeTeam.color }}>{match.homeTeam.name}</h3>
            <div className="mt-1 sm:mt-2">
               <ShotHistory shots={match.penaltySequence.home} total={hShots} isHome={true} />
            </div>
          </div>
           <div 
            className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl font-black text-white shadow-lg border-4 border-white/20 flex-shrink-0 relative ${currentTeam === 'home' && !isFinished ? 'ring-4 ring-blue-500/50 scale-105 transition-all' : ''}`}
            style={{ backgroundColor: match.homeTeam.color }}
          >
            {hGoals}
            {winner === 'home' && <div className="absolute -top-3 -left-3 text-green-500 bg-white rounded-full p-1 shadow-md"><PartyPopper size={20} /></div>}
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className={`p-4 sm:p-6 rounded-[2rem] border-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md transition-colors duration-300" style={{ backgroundColor: currentTeam === 'home' ? match.homeTeam.color : match.awayTeam.color }}>
                {currentTeam === 'home' ? 'A' : 'B'}
              </div>
              <div>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>{tPenalty.currentTurn}</div>
                <div className="text-lg sm:text-2xl font-black leading-none">{currentTeam === 'home' ? match.homeTeam.name : match.awayTeam.name}</div>
              </div>
            </div>
            
            {eligiblePlayers.length === 1 && (
              <div className="flex items-center gap-2 text-amber-500 text-[10px] sm:text-xs font-black bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <AlertCircle size={14} />
                <span className="hidden sm:inline">{tPenalty.lastPlayer}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 mb-8 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {eligiblePlayers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={`p-2 rounded-xl border-2 font-black transition-all flex flex-col items-center gap-0.5 group ${
                  selectedPlayerId === p.id ? 
                  'bg-blue-600 border-blue-400 text-white shadow-xl scale-105 ring-2 ring-blue-500/20' : 
                  (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-100 text-black hover:border-slate-300')
                }`}
              >
                <span className="text-lg sm:text-xl leading-none group-hover:scale-110 transition-transform">{p.number}</span>
                <span className="text-[8px] truncate w-full text-center opacity-80">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              disabled={!selectedPlayerId}
              onClick={() => handleRecordShot(true)}
              className={`flex-1 py-4 sm:py-5 rounded-2xl font-black text-white text-base sm:text-xl shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer ${
                !selectedPlayerId ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 active:scale-95 hover:shadow-green-900/20'
              }`}
            >
              <Check size={24} strokeWidth={4} />
              <span>{tPenalty.goal}</span>
            </button>
            <button
              disabled={!selectedPlayerId}
              onClick={() => handleRecordShot(false)}
              className={`flex-1 py-4 sm:py-5 rounded-2xl font-black text-white text-base sm:text-xl shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer ${
                !selectedPlayerId ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 active:scale-95 hover:shadow-red-900/20'
              }`}
            >
              <X size={24} strokeWidth={4} />
              <span>{tPenalty.missed}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center bg-green-500/10 border-4 border-green-500/20 rounded-[3rem] animate-in zoom-in duration-500">
           <Trophy size={48} className="mx-auto text-green-500 mb-4" />
           <h3 className="text-2xl font-black mb-2">{tPenalty.winner}</h3>
           <div className="text-4xl sm:text-5xl font-black mb-4" style={{ color: winner === 'home' ? match.homeTeam.color : match.awayTeam.color }}>
             {winner === 'home' ? match.homeTeam.name : match.awayTeam.name}
           </div>
           <p className="text-slate-500 text-xs sm:text-sm font-bold">{tPenalty.goToSheet}</p>
        </div>
      )}
      
      {!isFinished && (
        <p className={`text-center mt-6 text-[10px] font-black uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>
          {tPenalty.rule}
        </p>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
    </div>
  );
};
