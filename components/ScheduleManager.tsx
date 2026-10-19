
import React, { useState } from 'react';
import { ScheduledMatch, Officials } from '../types.ts';
import { Plus, Trash2, Calendar, MapPin, Users, Save, X, Edit2, RotateCcw, Lock } from 'lucide-react';

interface ScheduleManagerProps {
  schedule: ScheduledMatch[];
  onSave: (newSchedule: ScheduledMatch[]) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ schedule, onSave, onClose, isDarkMode }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMatch, setNewMatch] = useState<Partial<ScheduledMatch>>({
    homeTeam: '', awayTeam: '', date: '', time: '', lieu: '', category: '', centerPassword: '',
    officials: { referee1: '', referee2: '', timer: '', secretary: '', chefCentre: '' }
  });

  const inputStyle = `w-full p-2.5 rounded-xl border font-bold text-sm outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400'}`;
  const labelStyle = `block text-[10px] font-black uppercase mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`;

  const resetForm = () => {
    setEditingId(null);
    setNewMatch({
      homeTeam: '', awayTeam: '', date: '', time: '', lieu: '', category: '', centerPassword: '',
      officials: { referee1: '', referee2: '', timer: '', secretary: '', chefCentre: '' }
    });
  };

  const handleSaveAction = () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam) return;
    
    if (editingId) {
      // Update existing
      const updatedSchedule = schedule.map(m => 
        m.id === editingId ? { ...m, ...newMatch as ScheduledMatch } : m
      );
      onSave(updatedSchedule);
    } else {
      // Add new
      const matchToAdd: ScheduledMatch = {
        id: Math.random().toString(36).substr(2, 9),
        homeTeam: newMatch.homeTeam!,
        awayTeam: newMatch.awayTeam!,
        date: newMatch.date || '',
        time: newMatch.time || '',
        lieu: newMatch.lieu || '',
        category: newMatch.category || '',
        centerPassword: newMatch.centerPassword || '',
        officials: newMatch.officials as Officials
      };
      onSave([...schedule, matchToAdd]);
    }
    resetForm();
  };

  const handleEdit = (match: ScheduledMatch) => {
    setEditingId(match.id);
    setNewMatch({ ...match });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (editingId === id) resetForm();
    onSave(schedule.filter(m => m.id !== id));
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <h2 className="text-xl font-black flex items-center gap-2"><Calendar className="text-blue-500" /> إدارة برنامج المباريات</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full"><X /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
        {/* Form to Add/Edit Match */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${editingId ? (isDarkMode ? 'bg-blue-900/10 border-blue-500/50' : 'bg-blue-50 border-blue-200') : (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-black text-sm flex items-center gap-2 ${editingId ? 'text-amber-500' : 'text-blue-500'}`}>
              {editingId ? <Edit2 size={16} /> : <Plus size={16} />} 
              {editingId ? 'تعديل بيانات المقابلة' : 'إضافة مقابلة جديدة للبرنامج'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-[10px] font-black flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                <RotateCcw size={12} /> إلغاء التعديل
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelStyle}>الفريق المضيف</label><input className={inputStyle} value={newMatch.homeTeam} onChange={e => setNewMatch({...newMatch, homeTeam: e.target.value})} placeholder="مثال: فريق A" /></div>
            <div><label className={labelStyle}>الفريق الضيف</label><input className={inputStyle} value={newMatch.awayTeam} onChange={e => setNewMatch({...newMatch, awayTeam: e.target.value})} placeholder="مثال: فريق B" /></div>
            
            <div><label className={labelStyle}>التاريخ</label><input type="date" className={inputStyle} value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} /></div>
            <div><label className={labelStyle}>التوقيت</label><input type="time" className={inputStyle} value={newMatch.time} onChange={e => setNewMatch({...newMatch, time: e.target.value})} /></div>
            
            <div><label className={labelStyle}>المكان (القاعة)</label><input className={inputStyle} value={newMatch.lieu} onChange={e => setNewMatch({...newMatch, lieu: e.target.value})} /></div>
            <div><label className={labelStyle}>الفئة</label><input className={inputStyle} value={newMatch.category} onChange={e => setNewMatch({...newMatch, category: e.target.value})} /></div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>القن السري للمركز (قاعة {newMatch.lieu || '...'})</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  className={`${inputStyle} pr-9`} 
                  value={newMatch.centerPassword} 
                  onChange={e => setNewMatch({...newMatch, centerPassword: e.target.value})} 
                  placeholder="اترك فارغاً إذا لم تكن هناك حماية"
                />
              </div>
            </div>

            <div className={`sm:col-span-2 border-t pt-3 mt-1 border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                <span className={`text-xs font-black mb-2 block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>طاقم التحكيم</span>
                <div className="grid grid-cols-2 gap-2">
                    <input className={inputStyle} placeholder="الحكم 1" value={newMatch.officials?.referee1} onChange={e => setNewMatch({...newMatch, officials: {...newMatch.officials!, referee1: e.target.value}})} />
                    <input className={inputStyle} placeholder="الحكم 2" value={newMatch.officials?.referee2} onChange={e => setNewMatch({...newMatch, officials: {...newMatch.officials!, referee2: e.target.value}})} />
                    <input className={inputStyle} placeholder="الميقاتي" value={newMatch.officials?.timer} onChange={e => setNewMatch({...newMatch, officials: {...newMatch.officials!, timer: e.target.value}})} />
                    <input className={inputStyle} placeholder="المسجل" value={newMatch.officials?.secretary} onChange={e => setNewMatch({...newMatch, officials: {...newMatch.officials!, secretary: e.target.value}})} />
                </div>
            </div>
          </div>
          <button onClick={handleSaveAction} className={`w-full mt-4 py-3 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg ${editingId ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}>
            <Save size={18} /> {editingId ? 'تحديث التغييرات' : 'حفظ المقابلة في البرنامج'}
          </button>
        </div>

        {/* List of Matches */}
        <div className="space-y-3">
          <h3 className={`font-black text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>المباريات المبرمجة ({schedule.length})</h3>
          {schedule.length === 0 && <p className={`text-center text-xs py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>لا توجد مباريات مبرمجة</p>}
          {schedule.map(match => (
            <div key={match.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 group transition-all ${editingId === match.id ? 'border-amber-500 ring-2 ring-amber-500/20' : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-300')}`}>
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">{match.category}</span>
                     <span className={`text-[10px] font-bold flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}><Calendar size={10} /> {match.date} - {match.time}</span>
                     {match.centerPassword && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Lock size={10} /> محمي بكلمة سر</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm sm:text-base">
                     <span className="font-black">{match.homeTeam}</span>
                     <span className={`font-bold text-xs italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ضد</span>
                     <span className="font-black">{match.awayTeam}</span>
                  </div>
                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>
                    <MapPin size={10} /> {match.lieu}
                  </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleEdit(match)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors" title="تعديل">
                   <Edit2 size={18} />
                 </button>
                 <button onClick={() => handleDelete(match.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors" title="حذف">
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
