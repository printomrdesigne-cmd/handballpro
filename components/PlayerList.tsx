
import React from 'react';
import { Player, SanctionType, Team } from '../types';

interface PlayerListProps {
  team: Team;
  isTimerActive: boolean;
  isDarkMode?: boolean;
  onGoal: (id: string, inc: boolean) => void;
  onSanction: (id: string, type: SanctionType) => void;
  onCoachSanction: (type: SanctionType) => void;
  onRemoveCoachSanction: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, u: Partial<Player>) => void;
}

const formatMMSS = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const PlayerList: React.FC<PlayerListProps> = ({ 
  team, 
  isTimerActive, 
  isDarkMode = false,
  onGoal, 
  onSanction, 
  onCoachSanction, 
  onRemoveCoachSanction, 
  onRemove, 
  onUpdate 
}) => {
  const coachYellowCount = team.coach.sanctions.filter(s => s.type === SanctionType.YELLOW).length;
  const coachRed = team.coach.sanctions.some(s => s.type === SanctionType.RED);
  const coachBlue = team.coach.sanctions.some(s => s.type === SanctionType.BLUE);

  return (
    <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-[2rem] shadow-2xl border overflow-hidden w-full transition-all flex flex-col max-h-[70vh] ${!isTimerActive ? (isDarkMode ? 'ring-2 ring-slate-700 opacity-90' : 'ring-2 ring-slate-200 opacity-90') : 'ring-2'}`} style={{ boxShadow: isTimerActive ? `0 0 0 2px ${team.color}` : undefined }}>
      <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-100 bg-white/90'} backdrop-blur-md sticky top-0 z-40`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg border-2 border-white flex-shrink-0" style={{ backgroundColor: team.color }}></div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className={`text-lg sm:text-2xl font-black truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{team.name}</div>
          </div>
        </div>
        <div className={`flex gap-1 p-1.5 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'} flex-shrink-0`}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-3 h-5 sm:w-3.5 sm:h-6 rounded-md border-2 transition-colors ${i < team.timeoutsUsed ? '' : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200')}`} style={{ backgroundColor: i < team.timeoutsUsed ? team.color : undefined, borderColor: i < team.timeoutsUsed ? team.color : undefined }} />
          ))}
        </div>
      </div>

      <div className={`overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative transition-all duration-300 ${!isTimerActive ? 'grayscale-[0.5]' : ''} ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="min-w-[580px]">
          {/* Header with Colored Indicators for Sanctions (Jane/Rouj) */}
          <div className={`grid grid-cols-[45px_190px_50px_100px_50px_100px] gap-1 ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-900 text-white'} text-[10px] font-black p-3 text-center uppercase tracking-tighter sticky top-0 z-30 shadow-md`}>
            <div className={`sticky right-0 z-40 border-l ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'} pr-1`}>#</div>
            <div className={`sticky right-[45px] z-40 text-right pr-4 border-l ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'}`}>اللاعب</div>
            <div className={`border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-700'}`}>⚽</div>
            <div className={`border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-700'}`}>2' ×2</div>
            <div className={`border-l flex items-center justify-center ${isDarkMode ? 'border-slate-800' : 'border-slate-700'}`}>
                <div className="w-3 h-4 bg-yellow-400 border border-yellow-600 rounded-sm" title="بطاقة صفراء (Jaune)"></div>
            </div>
            <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-4 bg-red-600 border border-red-800 rounded-sm" title="بطاقة حمراء (Rouge)"></div>
                <div className="w-3 h-4 bg-blue-600 border border-blue-800 rounded-sm"></div>
            </div>
          </div>

          <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {team.players.map((p, idx) => {
              const isRed = p.sanctions.some(s => s.type === SanctionType.RED);
              const isBlue = p.sanctions.some(s => s.type === SanctionType.BLUE);
              const yellows = p.sanctions.filter(s => s.type === SanctionType.YELLOW);
              const twoMins = p.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES);
              const activeSuspension = p.sanctions.some(s => s.type === SanctionType.TWO_MINUTES && s.remainingTime && s.remainingTime > 0);
              
              const rowBg = idx % 2 === 0 ? (isDarkMode ? 'bg-slate-800/30' : 'bg-white') : (isDarkMode ? 'bg-slate-800/60' : 'bg-slate-50/40');
              const canInteract = isTimerActive && !isRed && !isBlue;
              const canScore = canInteract && !activeSuspension;

              return (
                <div key={p.id} className={`grid grid-cols-[45px_190px_50px_100px_50px_100px] gap-1 p-1.5 min-h-[57px] items-center text-center transition-all ${isRed ? 'bg-red-900/10 grayscale opacity-80' : rowBg}`}>
                  <div className={`sticky right-0 z-10 ${isRed ? 'bg-red-900/10' : rowBg} border-l ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} h-full flex items-center justify-center`}>
                    <input type="text" value={p.number} onChange={e => onUpdate(p.id, { number: e.target.value })} className={`w-full bg-transparent text-center font-black outline-none text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} />
                  </div>
                  
                  <div className={`sticky right-[45px] z-10 ${isRed ? 'bg-red-900/10' : rowBg} text-right pr-4 border-l ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} h-full flex items-center min-w-0`}>
                    <div className={`truncate font-bold text-[12px] w-full ${isDarkMode ? 'text-slate-200' : 'text-black'}`}>{p.name}</div>
                  </div>
                  
                  <button 
                    disabled={!canScore}
                    onClick={() => canScore && onGoal(p.id, true)} 
                    onContextMenu={e => { e.preventDefault(); canScore && onGoal(p.id, false); }} 
                    className={`h-[38px] w-full rounded-xl flex items-center justify-center font-black text-base border-2 transition-all active:scale-90 ${p.goals > 0 ? (isDarkMode ? 'bg-slate-700 border-slate-600 text-white shadow-sm' : 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm') : (isDarkMode ? 'bg-slate-900/50 border-slate-800 text-transparent' : 'bg-slate-50 border-slate-100 text-transparent')} ${!canScore ? 'cursor-not-allowed opacity-40 bg-slate-200/50' : (isDarkMode ? 'hover:border-blue-500' : 'hover:border-blue-300')}`}
                  >
                    {p.goals || '0'}
                  </button>

                  <div className="grid grid-cols-2 gap-1 px-1">
                    {[0, 1].map(box => {
                      const s = twoMins[box];
                      const active = s && s.remainingTime !== undefined && s.remainingTime > 0;
                      return (
                        <button 
                          key={box} 
                          disabled={!canInteract && !(isTimerActive && s)} 
                          onClick={() => canInteract && box === twoMins.length && onSanction(p.id, SanctionType.TWO_MINUTES)} 
                          onContextMenu={e => { e.preventDefault(); canInteract && box === twoMins.length - 1 && onRemove(p.id); }} 
                          className={`h-[38px] rounded-lg flex items-center justify-center text-[10px] font-black border-2 transition-all active:scale-90 ${s ? (isDarkMode ? 'bg-slate-950 text-white border-blue-600 shadow-md' : 'bg-slate-900 text-white border-slate-950 shadow-md') : (isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200')} ${!canInteract ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          {active ? <span className={`font-mono text-[9px] ${s.remainingTime! < 20 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>{formatMMSS(s.remainingTime!)}</span> : s ? "2'" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-center px-1">
                    {[0].map(box => (
                      <button 
                        key={box} 
                        disabled={!canInteract}
                        onClick={() => canInteract && box === yellows.length && onSanction(p.id, SanctionType.YELLOW)} 
                        onContextMenu={e => { e.preventDefault(); canInteract && box === yellows.length - 1 && onRemove(p.id); }} 
                        className={`h-[38px] w-full rounded-lg flex items-center justify-center border-2 transition-all active:scale-90 ${yellows[box] ? 'bg-yellow-400 border-yellow-500 shadow-md' : (isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200')} ${!canInteract ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {yellows[box] && <div className="w-3.5 h-6 bg-yellow-700/30 rounded-sm border border-yellow-700/20 shadow-sm" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1 px-1">
                    <button 
                      disabled={!canInteract && !isRed}
                      onClick={() => canInteract && onSanction(p.id, SanctionType.RED)} 
                      onContextMenu={e => { e.preventDefault(); isRed && canInteract && onRemove(p.id); }} 
                      className={`h-[38px] flex-1 rounded-lg flex items-center justify-center border-2 transition-all active:scale-90 ${isRed ? 'bg-red-600 border-red-700 shadow-lg' : (isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200')} ${!canInteract ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {isRed && <div className="w-3 h-5 bg-white/30 rounded-sm border border-white/40 shadow-sm" />}
                    </button>
                    <button 
                      disabled={!canInteract && !isBlue}
                      onClick={() => canInteract && onSanction(p.id, SanctionType.BLUE)} 
                      onContextMenu={e => { e.preventDefault(); isBlue && canInteract && onRemove(p.id); }} 
                      className={`h-[38px] flex-1 rounded-lg flex items-center justify-center border-2 transition-all active:scale-90 ${isBlue ? 'bg-blue-600 border-blue-700 shadow-lg' : (isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200')} ${!canInteract ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {isBlue && <div className="w-3 h-5 bg-white/30 rounded-sm border border-white/40 shadow-sm" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`p-5 border-t flex items-center justify-between z-40 transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} ${!isTimerActive ? 'grayscale-[0.5] opacity-80' : ''}`}>
        <div className="min-w-0 flex-1">
          <span className={`text-[9px] font-black uppercase block mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>المؤطر المسؤول</span>
          <span className={`text-base font-black truncate block ${isDarkMode ? 'text-slate-200' : 'text-black'}`}>{team.coach.name}</span>
        </div>
        <div className="flex items-center gap-3 pl-1">
          <div className="flex gap-1.5">
            <button 
              disabled={!isTimerActive || coachRed}
              onClick={() => isTimerActive && !coachRed && onCoachSanction(SanctionType.YELLOW)} 
              onContextMenu={e => { e.preventDefault(); isTimerActive && coachYellowCount > 0 && onRemoveCoachSanction(); }} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 ${coachYellowCount > 0 ? 'bg-yellow-400 border-yellow-500 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'} ${!isTimerActive ? 'cursor-not-allowed' : ''}`}
            >
              <div className="relative flex">
                <div className="w-4 h-6 rounded-sm border border-yellow-700/20 bg-yellow-700/30" />
                {coachYellowCount > 1 && <div className="absolute -right-2 -top-2 w-4 h-4 bg-white text-yellow-600 rounded-full text-[10px] flex items-center justify-center font-black border border-yellow-500">2</div>}
              </div>
            </button>
            <button 
              disabled={!isTimerActive || coachRed}
              onClick={() => isTimerActive && !coachRed && onCoachSanction(SanctionType.RED)} 
              onContextMenu={e => { e.preventDefault(); isTimerActive && coachRed && onRemoveCoachSanction(); }} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 ${coachRed ? 'bg-red-600 border-red-700 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'} ${!isTimerActive ? 'cursor-not-allowed' : ''}`}
            >
              <div className="w-4 h-6 rounded-sm border border-white/20 bg-white/20" />
            </button>
            <button 
              disabled={!isTimerActive || coachBlue}
              onClick={() => isTimerActive && !coachBlue && onCoachSanction(SanctionType.BLUE)} 
              onContextMenu={e => { e.preventDefault(); isTimerActive && coachBlue && onRemoveCoachSanction(); }} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 ${coachBlue ? 'bg-blue-600 border-blue-700 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'} ${!isTimerActive ? 'cursor-not-allowed' : ''}`}
            >
              <div className="w-4 h-6 rounded-sm border border-white/20 bg-white/20" />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};
