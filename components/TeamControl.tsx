
import React, { useState } from 'react';
import { Team, SanctionType, Player } from '../types.ts';
import { Trash2, X, Save, AlertCircle, UserPlus, Shield, Crown, Edit2 } from 'lucide-react';

interface TeamControlProps {
  team: Team;
  side: 'home' | 'away';
  selectedTarget: { type: 'player' | 'coach' | 'assistant-coach', team: 'home' | 'away', id?: string } | null;
  onSelect: (target: { type: 'player' | 'coach' | 'assistant-coach', team: 'home' | 'away', id?: string }) => void;
  isDarkMode: boolean;
  onUpdatePlayer: (side: 'home' | 'away', id: string, data: Partial<Player>) => void;
  onDeletePlayer: (side: 'home' | 'away', id: string) => void;
  onAddPlayer: (side: 'home' | 'away', number: string, name: string) => void;
  onUpdateStaff?: (side: 'home' | 'away', type: 'coach' | 'assistant-coach', name: string) => void;
  onUndoGoal?: (side: 'home' | 'away', playerId: string) => void;
  lang?: import('../types.ts').AppLanguage;
}

export const TeamControl: React.FC<TeamControlProps> = ({ 
  team, 
  side, 
  selectedTarget, 
  onSelect, 
  isDarkMode, 
  onUpdatePlayer, 
  onDeletePlayer, 
  onAddPlayer, 
  onUpdateStaff, 
  onUndoGoal,
  lang = 'ar' 
}) => {
  const isRtl = lang === 'ar';
  const tTeam = {
    ar: {
      coach: 'المؤطر',
      asstCoach: 'م. مدرب',
      addPlayer: 'إضافة لاعب جديد',
      editPlayer: 'تعديل بيانات اللاعب',
      editStaff: 'تعديل بيانات المؤطر',
      deleteConfirmTitle: 'تأكيد حذف اللاعب؟',
      deleteConfirmDesc: 'نهائياً من القائمة؟',
      confirmDelete: 'تأكيد الحذف',
      cancel: 'تراجع',
      number: 'رقم القميص',
      licence: 'رقم مسار (Licence)',
      name: 'الاسم',
      captain: 'عميد الفريق (C)',
      goalkeeper: 'حارس مرمى (G)',
      save: 'حفظ',
      delete: 'حذف',
      addToList: 'إضافة للقائمة',
      playerNamePlaceholder: 'اسم اللاعب الكامل',
      numberPlaceholder: 'مثال: 10'
    },
    fr: {
      coach: 'Entraîneur',
      asstCoach: 'Adj. Coach',
      addPlayer: 'Ajouter un joueur',
      editPlayer: 'Modifier le joueur',
      editStaff: "Modifier l'encadrant",
      deleteConfirmTitle: 'Supprimer ce joueur ?',
      deleteConfirmDesc: 'définitivement de la liste ?',
      confirmDelete: 'Confirmer la suppression',
      cancel: 'Retour',
      number: 'N° Maillot',
      licence: 'N° Licence',
      name: 'Nom',
      captain: 'Capitaine (C)',
      goalkeeper: 'Gardien (G)',
      save: 'Enregistrer',
      delete: 'Supprimer',
      addToList: 'Ajouter à la feuille',
      playerNamePlaceholder: 'Nom complet du joueur',
      numberPlaceholder: 'Ex: 10'
    },
    en: {
      coach: 'Head Coach',
      asstCoach: 'Asst Coach',
      addPlayer: 'Add New Player',
      editPlayer: 'Edit Player',
      editStaff: 'Edit Staff Member',
      deleteConfirmTitle: 'Delete this player?',
      deleteConfirmDesc: 'permanently from roster?',
      confirmDelete: 'Confirm Delete',
      cancel: 'Cancel',
      number: 'Jersey #',
      licence: 'Licence #',
      name: 'Name',
      captain: 'Captain (C)',
      goalkeeper: 'Goalkeeper (G)',
      save: 'Save',
      delete: 'Delete',
      addToList: 'Add to Roster',
      playerNamePlaceholder: 'Full player name',
      numberPlaceholder: 'e.g. 10'
    }
  }[lang];
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editLicence, setEditLicence] = useState('');
  const [editIsCaptain, setEditIsCaptain] = useState(false);
  const [editIsGoalkeeper, setEditIsGoalkeeper] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Staff Editing
  const [editingStaff, setEditingStaff] = useState<'coach' | 'assistant-coach' | null>(null);
  
  // New Player State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const isCoachSelected = selectedTarget?.type === 'coach' && selectedTarget.team === side;
  const isAssistantSelected = selectedTarget?.type === 'assistant-coach' && selectedTarget.team === side;

  if (!team) return null;

  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = React.useRef(false);
  const activePressPlayerId = React.useRef<string | null>(null);

  const handlePlayerPointerDown = (p: Player) => {
    isLongPressTriggered.current = false;
    activePressPlayerId.current = p.id;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (onUndoGoal) {
        onUndoGoal(side, p.id);
      }
    }, 600);
  };

  const handlePlayerPointerUp = (p: Player) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isLongPressTriggered.current && activePressPlayerId.current === p.id) {
      onSelect({ type: 'player', team: side, id: p.id });
    }
    activePressPlayerId.current = null;
  };

  const handlePlayerPointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    activePressPlayerId.current = null;
  };

  const handleDoubleClickPlayer = (p: Player) => {
    setEditingPlayer(p);
    setEditName(p.name);
    setEditNumber(p.number);
    setEditLicence(p.licence || '');
    setEditIsCaptain(p.isCaptain || false);
    setEditIsGoalkeeper(p.isGoalkeeper || false);
    setShowDeleteConfirm(false);
  };

  const handleDoubleClickStaff = (type: 'coach' | 'assistant-coach') => {
      setEditingStaff(type);
      setEditName(type === 'coach' ? team.coach.name : (team.assistantCoach?.name || ''));
  };

  const saveEdit = () => {
    if (editingPlayer) {
      // Check for duplicate number (excluding current player)
      const duplicate = team.players.some(p => p.number === editNumber && p.id !== editingPlayer.id);
      if (duplicate) {
          alert(`الرقم ${editNumber} موجود بالفعل في هذا الفريق.`);
          return;
      }

      onUpdatePlayer(side, editingPlayer.id, { 
          name: editName, 
          number: editNumber,
          licence: editLicence,
          isCaptain: editIsCaptain,
          isGoalkeeper: editIsGoalkeeper
      });
      setEditingPlayer(null);
    } else if (editingStaff && onUpdateStaff) {
        onUpdateStaff(side, editingStaff, editName);
        setEditingStaff(null);
    }
  };

  const handleAddSubmit = () => {
    if (newNumber.trim() && newName.trim()) {
      // Check for duplicate number
      const duplicate = team.players.some(p => p.number === newNumber);
      if (duplicate) {
          alert(`الرقم ${newNumber} موجود بالفعل في هذا الفريق.`);
          return;
      }

      onAddPlayer(side, newNumber, newName);
      setNewName('');
      setNewNumber('');
      setShowAddModal(false);
    }
  };

  const closeEdit = () => {
    setEditingPlayer(null);
    setEditingStaff(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`flex flex-col h-full gap-1.5 sm:gap-2 p-1.5 sm:p-3 rounded-2xl sm:rounded-3xl border-2 transition-all ${selectedTarget?.team === side ? 'border-blue-500 shadow-xl' : isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center justify-between mb-0.5 sm:mb-1 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 sm:w-3 h-5 sm:h-6 rounded-full shadow-inner" style={{ backgroundColor: team.color || '#ccc' }}></div>
          <h3 className="font-black text-xs sm:text-base uppercase tracking-tight truncate max-w-[90px] sm:max-w-none">{team.name || 'فريق'}</h3>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
          className={`p-1 sm:p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
          title="إضافة لاعب جديد"
        >
          <UserPlus size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5 sm:pr-1 custom-player-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2 pb-1 sm:pb-2">
          {team.players?.map((p) => {
            const isSelected = selectedTarget?.type === 'player' && selectedTarget.id === p.id;
            const isBlue = p.sanctions?.some(s => s.type === SanctionType.BLUE);
            // Red or Blue implies disqualification
            const isRed = p.sanctions?.some(s => s.type === SanctionType.RED);
            
            const yellowSanc = p.sanctions?.filter(s => s.type === SanctionType.YELLOW) || [];
            const twoMinSancs = p.sanctions?.filter(s => s.type === SanctionType.TWO_MINUTES) || [];
            const active2Min = twoMinSancs.find(s => s.remainingTime && s.remainingTime > 0);
            
            // Check if suspension is ending soon (<= 20 seconds)
            const isEndingSoon = active2Min && active2Min.remainingTime! <= 20;
            
            return (
              <button
                key={p.id}
                type="button"
                onPointerDown={() => handlePlayerPointerDown(p)}
                onPointerUp={() => handlePlayerPointerUp(p)}
                onPointerLeave={handlePlayerPointerLeave}
                onPointerCancel={handlePlayerPointerLeave}
                onDoubleClick={() => handleDoubleClickPlayer(p)}
                title={lang === 'ar' ? `رقم ${p.number} - ${p.name} (اضغط للتحديد - اضغط مطولاً لإلغاء هدف)` : `#${p.number} ${p.name} (Clic: sélectionner - Long: annuler but)`}
                className={`
                  relative h-[50px] sm:h-[74px] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border-2 flex-shrink-0 select-none
                  ${isBlue ? 'bg-blue-950/20 border-blue-900/50 grayscale opacity-70' :
                    isRed ? 'bg-red-950/20 border-red-900/50 grayscale opacity-70' : 
                    isSelected ? 'bg-blue-600 border-blue-400 scale-[1.02] shadow-xl text-white' : 
                    isEndingSoon ? 'ring-2 sm:ring-4 ring-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-100 animate-pulse' :
                    isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-100' : 'bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-800'}
                `}
              >
                <span className="text-base sm:text-2xl font-black leading-none">{p.number}</span>
                <span className={`text-[7.5px] sm:text-[9px] font-bold truncate w-full px-0.5 text-center mt-0.5 ${isSelected ? 'text-blue-100' : isEndingSoon ? 'text-amber-600 dark:text-amber-300' : (isDarkMode ? 'text-slate-500' : 'text-black')}`}>{p.name}</span>
                
                {/* Role Indicators */}
                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex flex-col gap-0.5">
                   {p.isCaptain && <Crown size={9} className="text-yellow-500 fill-yellow-500" />}
                   {p.isGoalkeeper && <Shield size={9} className="text-gray-400 fill-gray-400" />}
                </div>

                <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 flex flex-col gap-0.5">
                  {yellowSanc.map((_, i) => (
                    <div key={i} className="w-1.5 h-2.5 sm:w-2.5 sm:h-4 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm"></div>
                  ))}
                  {twoMinSancs.slice(0, 2).map((_, i) => (
                    <div key={i} className="w-1.5 h-2.5 sm:w-2.5 sm:h-4 bg-slate-950 rounded-sm border border-slate-700 flex items-center justify-center text-[5px] sm:text-[7px] text-white font-black">
                        {active2Min && active2Min === twoMinSancs[i] ? '1' : ''}
                    </div>
                  ))}
                  {isRed && (
                    <div className="w-1.5 h-2.5 sm:w-2.5 sm:h-4 bg-red-600 rounded-sm border border-red-800 shadow-sm"></div>
                  )}
                  {isBlue && (
                    <div className="w-1.5 h-2.5 sm:w-2.5 sm:h-4 bg-blue-600 rounded-sm border border-blue-800 shadow-sm" title="تقرير (Rapport)"></div>
                  )}
                </div>

                {active2Min && (
                  <div className={`absolute -top-1.5 -right-1 text-[7px] sm:text-[8px] px-1 py-0.2 rounded-full font-mono font-bold border animate-pulse z-10 ${isEndingSoon ? 'bg-amber-500 text-black border-amber-600 scale-110' : 'bg-black text-white border-slate-700'}`}>
                    {Math.floor(active2Min.remainingTime! / 60)}:{(active2Min.remainingTime! % 60).toString().padStart(2, '0')}
                  </div>
                )}

                {p.goals > 0 && (
                  <div className={`absolute -bottom-1 -left-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[8px] sm:text-[11px] font-black shadow-lg border sm:border-2 ${isSelected ? 'bg-white text-blue-600 border-blue-100' : 'bg-green-600 text-white border-green-700'}`}>
                    {p.goals}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-0.5 pt-1.5 border-t space-y-1.5 flex-shrink-0">
          <button 
            onClick={() => onSelect({ type: 'coach', team: side })}
            onDoubleClick={() => handleDoubleClickStaff('coach')}
            className={`flex w-full items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all ${isCoachSelected ? 'bg-blue-600/10 border-blue-500' : isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}
          >
            <div className={`text-[8px] sm:text-[10px] font-black uppercase truncate max-w-[110px] sm:max-w-none ${isCoachSelected ? 'text-blue-500' : (isDarkMode ? 'text-slate-500' : 'text-black')}`}>{tTeam.coach}: {team.coach?.name || '---'}</div>
            <div className="flex gap-1 flex-shrink-0">
              {team.coach?.sanctions?.map((s, i) => (
                <div key={i} className={`w-2 h-3.5 sm:w-3 sm:h-5 rounded-sm shadow-sm ${s.type === SanctionType.YELLOW ? 'bg-yellow-400' : s.type === SanctionType.RED ? 'bg-red-600' : s.type === SanctionType.BLUE ? 'bg-blue-600' : 'bg-slate-900 flex items-center justify-center text-[7px] text-white font-black'}`}>
                </div>
              ))}
            </div>
          </button>
          
          {team.assistantCoach && (
            <button 
                onClick={() => onSelect({ type: 'assistant-coach', team: side })}
                onDoubleClick={() => handleDoubleClickStaff('assistant-coach')}
                className={`flex w-full items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all ${isAssistantSelected ? 'bg-blue-600/10 border-blue-500' : isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}
            >
                <div className={`text-[8px] sm:text-[10px] font-black uppercase truncate max-w-[110px] sm:max-w-none ${isAssistantSelected ? 'text-blue-500' : (isDarkMode ? 'text-slate-500' : 'text-black')}`}>{tTeam.asstCoach}: {team.assistantCoach.name}</div>
                <div className="flex gap-1 flex-shrink-0">
                {team.assistantCoach.sanctions?.map((s, i) => (
                    <div key={i} className={`w-2 h-3.5 sm:w-3 sm:h-5 rounded-sm shadow-sm ${s.type === SanctionType.YELLOW ? 'bg-yellow-400' : s.type === SanctionType.RED ? 'bg-red-600' : s.type === SanctionType.BLUE ? 'bg-blue-600' : 'bg-slate-900 flex items-center justify-center text-[7px] text-white font-black'}`}>
                    </div>
                ))}
                </div>
            </button>
          )}
      </div>

      {/* Edit Player/Staff Modal */}
      {(editingPlayer || editingStaff) && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className={`w-full max-w-sm p-6 rounded-[2rem] border-2 shadow-2xl relative overflow-hidden transition-all ${showDeleteConfirm ? 'bg-red-950/90 border-red-500 scale-105' : (isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900')}`}>
            {showDeleteConfirm && editingPlayer ? (
              <div className="flex flex-col items-center text-center animate-in zoom-in duration-200">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-red-900/40">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{tTeam.deleteConfirmTitle}</h3>
                <p className="text-red-200 text-xs font-bold mb-8">#{editingPlayer.number} {editingPlayer.name} {tTeam.deleteConfirmDesc}</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button onClick={() => { onDeletePlayer(side, editingPlayer.id); closeEdit(); }} className="py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl hover:bg-red-50 transition-colors cursor-pointer">{tTeam.confirmDelete}</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="py-4 bg-red-800/40 text-white rounded-2xl font-black border-2 border-red-400/20 hover:bg-red-800/60 cursor-pointer">{tTeam.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black">{editingPlayer ? tTeam.editPlayer : tTeam.editStaff}</h3>
                  <button onClick={closeEdit} className="p-2 rounded-full hover:bg-slate-500/10 cursor-pointer"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  {editingPlayer && (
                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <label className={`text-[10px] font-black uppercase block mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>{tTeam.number}</label>
                            <input type="tel" pattern="[0-9]*" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} className={`w-full p-3 rounded-xl border-2 font-black outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                            <label className={`text-[10px] font-black uppercase block mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>{tTeam.licence}</label>
                            <input type="text" value={editLicence} onChange={(e) => setEditLicence(e.target.value)} className={`w-full p-3 rounded-xl border-2 font-black outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-500'}`} />
                        </div>
                    </div>
                  )}
                  <div>
                    <label className={`text-[10px] font-black uppercase block mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>{tTeam.name}</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full p-3 rounded-xl border-2 font-black outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  
                  {/* Role Toggles for Player */}
                  {editingPlayer && (
                      <div className="flex gap-4 pt-2">
                          <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${editIsCaptain ? 'bg-yellow-500/10 border-yellow-500' : (isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                              <span className="text-xs font-black flex items-center gap-2">
                                <Crown size={14} className={editIsCaptain ? "text-yellow-500" : "text-slate-400"} />
                                {tTeam.captain}
                              </span>
                              <input type="checkbox" checked={editIsCaptain} onChange={e => setEditIsCaptain(e.target.checked)} className="accent-yellow-500 w-4 h-4" />
                          </label>

                          <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${editIsGoalkeeper ? 'bg-blue-500/10 border-blue-500' : (isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                              <span className="text-xs font-black flex items-center gap-2">
                                <Shield size={14} className={editIsGoalkeeper ? "text-blue-500" : "text-slate-400"} />
                                {tTeam.goalkeeper}
                              </span>
                              <input type="checkbox" checked={editIsGoalkeeper} onChange={e => setEditIsGoalkeeper(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                          </label>
                      </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={saveEdit} className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-900/20 hover:bg-blue-500 cursor-pointer"><Save size={18} />{tTeam.save}</button>
                  {editingPlayer && <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 py-3 bg-red-600/10 text-red-600 rounded-xl font-black border-2 border-red-600/20 hover:bg-red-600 hover:text-white cursor-pointer"><Trash2 size={18} />{tTeam.delete}</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className={`w-full max-w-sm p-6 rounded-[2rem] border-2 shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-xl font-black">{tTeam.addPlayer}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-slate-500/10 cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`text-[10px] font-black uppercase block mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>{tTeam.number}</label>
                <input 
                  type="tel" 
                  pattern="[0-9]*"
                  autoFocus
                  value={newNumber} 
                  onChange={(e) => setNewNumber(e.target.value)} 
                  placeholder={tTeam.numberPlaceholder}
                  className={`w-full p-3 rounded-xl border-2 font-black outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`} 
                />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase block mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>{tTeam.name}</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder={tTeam.playerNamePlaceholder}
                  className={`w-full p-3 rounded-xl border-2 font-black outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleAddSubmit} 
                disabled={!newNumber.trim() || !newName.trim()}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
              >
                {tTeam.addToList}
              </button>
              <button 
                onClick={() => setShowAddModal(false)} 
                className={`flex-1 py-4 rounded-2xl font-black border-2 transition-colors cursor-pointer ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}
              >
                {tTeam.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-player-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-player-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-player-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
        .custom-player-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#475569' : '#cbd5e1'}; }
      `}</style>
    </div>
  );
};
