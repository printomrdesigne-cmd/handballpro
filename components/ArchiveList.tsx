import React, { useState } from 'react';
import { MatchState, AppLanguage } from '../types.ts';
import { Trash2, Eye, Calendar, MapPin, Search, Trophy, AlertTriangle, X, History } from 'lucide-react';

interface ArchiveListProps {
  matches: MatchState[];
  isDarkMode: boolean;
  onSelect: (m: MatchState) => void;
  onDelete: (id: string) => void;
  onOpenEvents?: (m: MatchState) => void;
  lang?: AppLanguage;
}

/**
 * ArchiveList displays a list of previous matches from local storage.
 */
export const ArchiveList: React.FC<ArchiveListProps> = ({ matches, isDarkMode, onSelect, onDelete, onOpenEvents, lang = 'ar' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchToDelete, setMatchToDelete] = useState<MatchState | null>(null);

  const isRtl = lang === 'ar';

  const t = {
    ar: {
      title: 'أرشيف المباريات',
      searchPlaceholder: 'بحث عن فريق أو فئة...',
      emptyTitle: 'لا توجد مباريات مؤرشفة بعد',
      emptySubtitle: 'المباريات المكتملة أو المحفوظة ستظهر هنا تلقائياً.',
      viewMatch: 'عرض وتعديل المباراة',
      deleteConfirmTitle: 'تأكيد حذف المباراة من الأرشيف',
      deleteConfirmDesc: 'هل أنت متأكد من رغبتك في حذف هذه المقابلة بشكل نهائي؟',
      cancel: 'إلغاء',
      confirmDelete: 'نعم، حذف نهائي',
      venue: 'المكان',
      date: 'التاريخ'
    },
    fr: {
      title: 'Archives des Matchs',
      searchPlaceholder: 'Rechercher une équipe ou catégorie...',
      emptyTitle: 'Aucun match archivé pour le moment',
      emptySubtitle: 'Les matchs terminés ou enregistrés apparaîtront ici automatiquement.',
      viewMatch: 'Consulter et modifier le match',
      deleteConfirmTitle: "Confirmer la suppression",
      deleteConfirmDesc: 'Voulez-vous vraiment supprimer définitivement ce match des archives ?',
      cancel: 'Annuler',
      confirmDelete: 'Oui, supprimer définitivement',
      venue: 'Lieu',
      date: 'Date'
    },
    en: {
      title: 'Match Archives',
      searchPlaceholder: 'Search team or category...',
      emptyTitle: 'No archived matches yet',
      emptySubtitle: 'Finished or saved matches will automatically appear here.',
      viewMatch: 'View & Edit Match',
      deleteConfirmTitle: 'Confirm Match Deletion',
      deleteConfirmDesc: 'Are you sure you want to permanently delete this match from archives?',
      cancel: 'Cancel',
      confirmDelete: 'Yes, permanently delete',
      venue: 'Venue',
      date: 'Date'
    }
  }[lang];

  const handleDeleteConfirm = () => {
    if (matchToDelete) {
      onDelete(matchToDelete.id);
      setMatchToDelete(null);
    }
  };

  const filteredMatches = matches.filter(m => 
    m.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.details.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const dateA = new Date(`${a.details.date} ${a.details.time}`).getTime();
    const dateB = new Date(`${b.details.date} ${b.details.time}`).getTime();
    return dateB - dateA;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative h-full flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-3xl font-black">{t.title}</h2>
        <div className={`relative w-full sm:w-72 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`} size={18} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-2xl border-2 outline-none font-bold text-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 focus:border-blue-600' : 'bg-white border-slate-100 focus:border-blue-400'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center p-12 rounded-[3rem] border-2 border-dashed text-center ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
           <Trophy className="mx-auto text-slate-300 mb-4" size={48} />
           <p className={`font-black text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{t.emptyTitle}</p>
           <p className="text-xs text-slate-500 font-bold mt-1">{t.emptySubtitle}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {filteredMatches.map((m) => (
            <div 
              key={m.id}
              className={`p-5 rounded-3xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
            >
              <div className="flex-1 space-y-2 text-center sm:text-start w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    {m.details.categorie || 'Match'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {m.details.date} - {m.details.time}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-4 text-lg font-black">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.homeTeam.color }} />
                    <span>{m.homeTeam.name}</span>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-xl">
                    {m.score.home + (m.score.homePenalties || 0)} - {m.score.away + (m.score.awayPenalties || 0)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{m.awayTeam.name}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.awayTeam.color }} />
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin size={12} /> {m.details.lieu || '-'}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onOpenEvents && (
                  <button
                    onClick={() => onOpenEvents(m)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    title={lang === 'ar' ? 'سجل الأحداث واستيرادها' : 'Journal des événements'}
                  >
                    <History size={15} />
                    <span className="hidden sm:inline">{lang === 'ar' ? 'الأحداث' : 'Événements'}</span>
                    <span className="text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.2 font-black">{m.events?.length || 0}</span>
                  </button>
                )}
                <button
                  onClick={() => onSelect(m)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Eye size={14} /> {t.viewMatch}
                </button>
                <button
                  onClick={() => setMatchToDelete(m)}
                  className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {matchToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className={`w-full max-w-sm rounded-[2.5rem] border-2 shadow-2xl p-6 relative ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              <button 
                onClick={() => setMatchToDelete(null)}
                className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 transition-colors cursor-pointer`}
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-4">
                 <AlertTriangle size={28} />
              </div>

              <h3 className="text-lg font-black text-center mb-2">{t.deleteConfirmTitle}</h3>
              <p className={`text-xs text-center font-bold mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                 {t.deleteConfirmDesc}
              </p>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setMatchToDelete(null)}
                   className="py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-black text-xs hover:bg-slate-500/10 transition-colors cursor-pointer"
                 >
                   {t.cancel}
                 </button>
                 <button 
                   onClick={handleDeleteConfirm}
                   className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                 >
                   {t.confirmDelete}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
