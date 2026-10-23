import React, { useState, useMemo, useRef } from 'react';
import { MatchState, MatchEvent, SanctionType, AppLanguage } from '../types.ts';
import { 
  X, 
  History, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Timer, 
  ShieldAlert, 
  Trophy, 
  Layers,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { 
  validateAndParseEvents, 
  recalculateMatchFromEvents, 
  exportEventsAsJSON,
  EventsValidationResult
} from '../utils/eventsManager.ts';

interface MatchEventsModalProps {
  match: MatchState;
  onUpdateMatch: (updated: MatchState) => void;
  onClose: () => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
}

export const MatchEventsModal: React.FC<MatchEventsModalProps> = ({
  match,
  onUpdateMatch,
  onClose,
  isDarkMode,
  lang = 'ar'
}) => {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'timeline' | 'import_export' | 'add_event'>('timeline');

  // Filter & Search states
  const [filterType, setFilterType] = useState<'all' | 'GOAL' | 'SANCTION' | 'TIMEOUT'>('all');
  const [filterSanction, setFilterSanction] = useState<'all' | SanctionType>('all');
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [validationResult, setValidationResult] = useState<EventsValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Manual Add Event states
  const [manualTimeMinutes, setManualTimeMinutes] = useState(Math.floor(match.timer / 60));
  const [manualTimeSeconds, setManualTimeSeconds] = useState(match.timer % 60);
  const [manualTeam, setManualTeam] = useState<'home' | 'away'>('home');
  const [manualType, setManualType] = useState<'GOAL' | 'SANCTION' | 'TIMEOUT'>('GOAL');
  const [manualGoalType, setManualGoalType] = useState<'NORMAL' | '7M'>('NORMAL');
  const [manualSanctionType, setManualSanctionType] = useState<SanctionType>(SanctionType.YELLOW);
  const [manualPlayerId, setManualPlayerId] = useState<string>('');

  // Selected player candidates for manual add
  const manualTeamPlayers = manualTeam === 'home' ? match.homeTeam.players : match.awayTeam.players;

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let list = [...match.events];

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter(e => e.type === filterType);
    }

    // Filter by specific sanction
    if (filterType === 'SANCTION' && filterSanction !== 'all') {
      list = list.filter(e => e.sanctionType === filterSanction);
    }

    // Filter by team
    if (filterTeam !== 'all') {
      list = list.filter(e => e.team === filterTeam);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(e => 
        (e.playerName && e.playerName.toLowerCase().includes(q)) ||
        (e.timeStr && e.timeStr.includes(q)) ||
        (e.playerId && e.playerId.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOrder === 'desc') return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });

    return list;
  }, [match.events, filterType, filterSanction, filterTeam, searchTerm, sortOrder]);

  // Statistics from current match events
  const stats = useMemo(() => {
    let hGoals = 0;
    let aGoals = 0;
    let yellows = 0;
    let twoMins = 0;
    let reds = 0;
    let blues = 0;
    let timeouts = 0;

    match.events.forEach(e => {
      if (e.type === 'GOAL') {
        if (e.team === 'home') hGoals++;
        else aGoals++;
      } else if (e.type === 'SANCTION') {
        if (e.sanctionType === SanctionType.YELLOW) yellows++;
        else if (e.sanctionType === SanctionType.TWO_MINUTES) twoMins++;
        else if (e.sanctionType === SanctionType.RED) reds++;
        else if (e.sanctionType === SanctionType.BLUE) blues++;
      } else if (e.type === 'TIMEOUT') {
        timeouts++;
      }
    });

    return { hGoals, aGoals, yellows, twoMins, reds, blues, timeouts, total: match.events.length };
  }, [match.events]);

  // Handle Event Deletion
  const handleDeleteEvent = (eventId: string) => {
    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من حذف هذا الحدث؟ ستتم إعادة حساب النتيجة والإحصائيات تلقائياً.' 
      : 'Confirmer la suppression de cet événement ? Le score sera recalculé.';
    if (!window.confirm(confirmMsg)) return;

    const remainingEvents = match.events.filter(e => e.id !== eventId);
    const updated = recalculateMatchFromEvents(match, remainingEvents, 'replace');
    onUpdateMatch(updated);
  };

  // Handle Manual Add Event
  const handleAddManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSecs = (Number(manualTimeMinutes) || 0) * 60 + (Number(manualTimeSeconds) || 0);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    let playerObj = manualTeamPlayers.find(p => p.id === manualPlayerId);

    const newEvt: MatchEvent = {
      id: Math.random().toString(36).substring(2, 12) + Date.now().toString(36),
      type: manualType,
      timestamp: totalSecs,
      timeStr,
      team: manualTeam,
      playerId: playerObj?.id,
      playerName: playerObj ? `#${playerObj.number} ${playerObj.name}` : undefined
    };

    if (manualType === 'GOAL') {
      newEvt.goalType = manualGoalType;
    } else if (manualType === 'SANCTION') {
      newEvt.sanctionType = manualSanctionType;
    }

    const updatedEvents = [newEvt, ...match.events];
    const updated = recalculateMatchFromEvents(match, updatedEvents, 'replace');
    onUpdateMatch(updated);

    setActiveTab('timeline');
  };

  // Handle File Upload for Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      const res = validateAndParseEvents(content);
      setValidationResult(res);
      setImportStatus(null);
    };
    reader.readAsText(file);
  };

  // Validate Pasted JSON
  const handleValidateJSON = () => {
    if (!jsonText.trim()) {
      setValidationResult({
        valid: false,
        events: [],
        errors: [lang === 'ar' ? 'يرجى لصق كود JSON أو تحميل ملف أولاً.' : 'Veuillez coller le JSON ou charger un fichier.'],
        stats: { totalEvents: 0, homeGoals: 0, awayGoals: 0, yellowCards: 0, twoMinutes: 0, redCards: 0, blueCards: 0, timeoutsHome: 0, timeoutsAway: 0 }
      });
      return;
    }
    const res = validateAndParseEvents(jsonText);
    setValidationResult(res);
    setImportStatus(null);
  };

  // Perform Import
  const handleConfirmImport = () => {
    if (!validationResult || !validationResult.valid) return;

    try {
      const updatedMatch = recalculateMatchFromEvents(match, validationResult.events, importMode);
      onUpdateMatch(updatedMatch);
      setImportStatus({
        success: true,
        message: lang === 'ar'
          ? `تم استيراد ${validationResult.events.length} حدث بنجاح وتحديث نتيجة المباراة إلى (${updatedMatch.score.home} - ${updatedMatch.score.away})!`
          : `Importation réussie de ${validationResult.events.length} événements !`
      });
      setTimeout(() => {
        setActiveTab('timeline');
      }, 1500);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: lang === 'ar' ? `حدث خطأ أثناء الاستيراد: ${err?.message}` : 'Erreur lors de l\'importation.'
      });
    }
  };

  // Copy events JSON to clipboard
  const handleCopyJSON = async () => {
    const exportData = {
      app: 'HandballScore PRO',
      formatVersion: '1.0',
      exportedAt: new Date().toISOString(),
      matchId: match.id,
      matchDetails: {
        numRencontre: match.details?.numRencontre || '',
        category: match.details?.categorie || '',
        date: match.details?.date || '',
        venue: match.details?.lieu || '',
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        finalScore: `${match.score.home} - ${match.score.away}`
      },
      eventsCount: match.events.length,
      events: match.events
    };
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[2.5rem] border-2 shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <History size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">
                  {lang === 'ar' ? 'سجل أحداث المقابلة' : 'Journal des Événements'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {match.events.length} {lang === 'ar' ? 'حدث' : 'événements'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.homeTeam.color }} />
                <span>{match.homeTeam.name}</span>
                <span className="font-black text-slate-900 dark:text-white">({match.score.home})</span>
                <span>-</span>
                <span className="font-black text-slate-900 dark:text-white">({match.score.away})</span>
                <span>{match.awayTeam.name}</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.awayTeam.color }} />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 sm:px-6 gap-2 shrink-0 overflow-x-auto ${
          isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History size={16} />
            <span>{lang === 'ar' ? 'سجل الأحداث الزمني' : 'Chronologie'}</span>
          </button>

          <button
            onClick={() => setActiveTab('import_export')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import_export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload size={16} />
            <span>{lang === 'ar' ? 'استيراد وتصدير (JSON)' : 'Import / Export'}</span>
          </button>

          <button
            onClick={() => setActiveTab('add_event')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add_event'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus size={16} />
            <span>{lang === 'ar' ? 'إضافة حدث يدوياً' : 'Ajouter manuellement'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              {/* Stats KPI Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-500">{lang === 'ar' ? 'أهداف المضيف' : 'Buts Domicile'}</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.hGoals}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-500">{lang === 'ar' ? 'أهداف الضيف' : 'Buts Extérieur'}</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.aGoals}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400">{lang === 'ar' ? 'إنذارات (أصفر)' : 'Jaunes'}</div>
                  <div className="text-xl font-black text-yellow-600 dark:text-yellow-400">{stats.yellows}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">{lang === 'ar' ? 'إيقاف 2 دقائق' : '2 min'}</div>
                  <div className="text-xl font-black text-orange-600 dark:text-orange-400">{stats.twoMins}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">{lang === 'ar' ? 'طرد (أحمر)' : 'Rouges'}</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.reds}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">{lang === 'ar' ? 'تقرير (أزرق)' : 'Bleues'}</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.blues}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">{lang === 'ar' ? 'وقت مستقطع' : 'Timeouts'}</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">{stats.timeouts}</div>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={16} className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={lang === 'ar' ? 'بحث عن لاعب أو توقيت...' : 'Recherche joueur ou minute...'}
                    className={`w-full py-2 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} rounded-xl text-xs font-bold border outline-none transition-all ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-white border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => { setFilterType('all'); setFilterSanction('all'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {lang === 'ar' ? 'الكل' : 'Tous'}
                  </button>

                  <button
                    onClick={() => { setFilterType('GOAL'); setFilterSanction('all'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'GOAL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>⚽</span>
                    <span>{lang === 'ar' ? 'الأهداف' : 'Buts'}</span>
                  </button>

                  <button
                    onClick={() => { setFilterType('SANCTION'); setFilterSanction('all'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'SANCTION'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>⚠️</span>
                    <span>{lang === 'ar' ? 'العقوبات' : 'Sanctions'}</span>
                  </button>

                  <button
                    onClick={() => { setFilterType('TIMEOUT'); setFilterSanction('all'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'TIMEOUT'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>⏱️</span>
                    <span>{lang === 'ar' ? 'المستقطع' : 'Timeouts'}</span>
                  </button>

                  {/* Team Toggle */}
                  <select
                    value={filterTeam}
                    onChange={(e: any) => setFilterTeam(e.target.value)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">{lang === 'ar' ? 'جميع الفرق' : 'Toutes équipes'}</option>
                    <option value="home">{match.homeTeam.name}</option>
                    <option value="away">{match.awayTeam.name}</option>
                  </select>

                  {/* Sort Order Toggle */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className={`p-1.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                    title={sortOrder === 'desc' ? (lang === 'ar' ? 'الترتيب: الأحدث أولاً' : 'Plus récents') : (lang === 'ar' ? 'الترتيب: الأقدم أولاً' : 'Plus anciens')}
                  >
                    <ArrowUpDown size={15} />
                  </button>
                </div>
              </div>

              {/* Events List */}
              {filteredEvents.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border-2 border-dashed ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
                }`}>
                  <History size={40} className="mx-auto text-slate-400 mb-3" />
                  <p className="font-black text-sm text-slate-500">
                    {lang === 'ar' ? 'لا توجد أحداث مطابقة للفلتر المحدد.' : 'Aucun événement correspondant.'}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    {lang === 'ar' ? 'يمكنك تسجيل الأهداف والعقوبات أثناء المباراة أو استيرادها من ملف JSON.' : 'Enregistrez les buts et sanctions ou importez un fichier JSON.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const isHome = event.team === 'home';
                    const teamColor = isHome ? match.homeTeam.color : match.awayTeam.color;
                    const teamName = isHome ? match.homeTeam.name : match.awayTeam.name;

                    let badgeColor = 'bg-slate-500 text-white';
                    let typeLabel = '';
                    let icon = null;

                    if (event.type === 'GOAL') {
                      badgeColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
                      typeLabel = event.goalType === '7M' ? (lang === 'ar' ? 'هدف 7 أمتار' : 'But 7m') : (lang === 'ar' ? 'هدف' : 'But');
                      icon = <span className="text-sm">⚽</span>;
                    } else if (event.type === 'SANCTION') {
                      if (event.sanctionType === SanctionType.YELLOW) {
                        badgeColor = 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
                        typeLabel = lang === 'ar' ? 'إنذار (بطاقة صفراء)' : 'Carton Jaune';
                        icon = <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm inline-block shadow-sm" />;
                      } else if (event.sanctionType === SanctionType.TWO_MINUTES) {
                        badgeColor = 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30';
                        typeLabel = lang === 'ar' ? 'إيقاف دقيقتين (2min)' : 'Exclusion 2 min';
                        icon = <span className="text-xs font-black">⏳</span>;
                      } else if (event.sanctionType === SanctionType.RED) {
                        badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
                        typeLabel = lang === 'ar' ? 'استبعاد (بطاقة حمراء)' : 'Carton Rouge';
                        icon = <span className="w-2.5 h-3.5 bg-rose-600 rounded-sm inline-block shadow-sm" />;
                      } else if (event.sanctionType === SanctionType.BLUE) {
                        badgeColor = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
                        typeLabel = lang === 'ar' ? 'تقرير (بطاقة زرقاء)' : 'Carton Bleu';
                        icon = <span className="w-2.5 h-3.5 bg-blue-600 rounded-sm inline-block shadow-sm" />;
                      }
                    } else if (event.type === 'TIMEOUT') {
                      badgeColor = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
                      typeLabel = lang === 'ar' ? 'وقت مستقطع' : 'Temps Mort';
                      icon = <Timer size={14} />;
                    }

                    return (
                      <div
                        key={event.id}
                        className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all hover:scale-[1.01] ${
                          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {/* Time & Team indicator */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Time badge */}
                          <div className={`px-2.5 py-1 rounded-xl font-mono text-xs font-black shrink-0 ${
                            isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {event.timeStr}
                          </div>

                          {/* Team dot & Event info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/20"
                                style={{ backgroundColor: teamColor }}
                              />
                              <span className="text-xs font-black truncate text-slate-700 dark:text-slate-300">
                                {teamName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-black ${badgeColor}`}>
                                {icon}
                                <span>{typeLabel}</span>
                              </span>

                              {event.playerName && (
                                <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                                  {event.playerName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={lang === 'ar' ? 'حذف هذا الحدث' : 'Supprimer'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT / EXPORT */}
          {activeTab === 'import_export' && (
            <div className="space-y-6">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Status Banner */}
              {importStatus && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                  importStatus.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}>
                  {importStatus.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-xs sm:text-sm font-black">{importStatus.message}</span>
                </div>
              )}

              {/* Export Section */}
              <div className={`p-6 rounded-3xl border-2 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Download size={20} className="text-blue-600" />
                    <h3 className="text-base font-black">
                      {lang === 'ar' ? 'تصدير وحفظ أحداث المباراة الحالية' : 'Exporter les événements'}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {match.events.length} {lang === 'ar' ? 'حدث مسجل' : 'enregistrés'}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                  {lang === 'ar'
                    ? 'يمكنك تنزيل ملف JSON يحتوي على سجل جميع الأهداف والعقوبات والأوقات المستقطعة مع التوقيت واللاعبين، لاستخدامه في أجهزة أخرى أو أرشفته.'
                    : 'Téléchargez un fichier JSON contenant la chronologie complète des événements.'}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => exportEventsAsJSON(match)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>{lang === 'ar' ? 'تنزيل ملف أحداث (JSON)' : 'Télécharger JSON'}</span>
                  </button>

                  <button
                    onClick={handleCopyJSON}
                    className={`px-5 py-2.5 rounded-xl border font-black text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                      copiedJSON
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDarkMode ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {copiedJSON ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedJSON ? (lang === 'ar' ? 'تم النسخ!' : 'Copié !') : (lang === 'ar' ? 'نسخ كود JSON' : 'Copier JSON')}</span>
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className={`p-6 rounded-3xl border-2 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Upload size={20} className="text-emerald-600" />
                  <h3 className="text-base font-black">
                    {lang === 'ar' ? 'استيراد سجل أحداث جديد إلى المباراة' : 'Importer des événements'}
                  </h3>
                </div>

                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                  {lang === 'ar'
                    ? 'اختر ملف JSON أو الصق محتواه بالأسفل. سيتم فحص الأحداث والتأكد من صحتها، ثم إعادة احتساب النتيجة الرسمية وإحصائيات اللاعبين بدقة تلقائياً.'
                    : 'Chargez un fichier JSON ou collez le contenu ci-dessous pour reconstruire le match.'}
                </p>

                {/* File picker button & Paste box */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Upload size={16} />
                      <span>{lang === 'ar' ? 'اختيار ملف أحداث من الجهاز (.json)' : 'Choisir un fichier (.json)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleValidateJSON}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      {lang === 'ar' ? 'فحص ومعاينة البيانات' : 'Valider'}
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={jsonText}
                    onChange={(e) => {
                      setJsonText(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder={lang === 'ar' ? 'أو الصق كود JSON للأحداث هنا مباشرة...' : 'Ou collez le JSON ici...'}
                    className={`w-full p-3 rounded-2xl font-mono text-xs border outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Validation Preview Card */}
                {validationResult && (
                  <div className={`p-4 rounded-2xl border-2 mb-4 animate-in fade-in ${
                    validationResult.valid 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}>
                    {validationResult.valid ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">
                          <CheckCircle2 size={18} />
                          <span>{lang === 'ar' ? 'تم فحص البيانات بنجاح، تم العثور على أحداث صالحة للاستيراد:' : 'Données valides :'}</span>
                        </div>

                        {/* Quick preview stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                            <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الأحداث:' : 'Total :'} </span>
                            <span className="font-black text-emerald-600">{validationResult.stats.totalEvents}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                            <span className="text-slate-500">{lang === 'ar' ? 'النتيجة المتوقعة:' : 'Score :'} </span>
                            <span className="font-black text-blue-600">{validationResult.stats.homeGoals} - {validationResult.stats.awayGoals}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                            <span className="text-slate-500">{lang === 'ar' ? 'العقوبات:' : 'Sanctions :'} </span>
                            <span className="font-black text-amber-600">
                              {validationResult.stats.yellowCards + validationResult.stats.twoMinutes + validationResult.stats.redCards + validationResult.stats.blueCards}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20">
                            <span className="text-slate-500">{lang === 'ar' ? 'المستقطع:' : 'Timeouts :'} </span>
                            <span className="font-black text-purple-600">{validationResult.stats.timeoutsHome + validationResult.stats.timeoutsAway}</span>
                          </div>
                        </div>

                        {/* Import Mode Radio Choice */}
                        <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                          <label className="text-xs font-black block text-slate-700 dark:text-slate-300">
                            {lang === 'ar' ? 'كيف ترغب في تطبيق الأحداث المستوردة؟' : 'Mode d\'importation :'}
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                              <input
                                type="radio"
                                name="importMode"
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                                className="accent-emerald-600"
                              />
                              <span>{lang === 'ar' ? 'استبدال الأحداث الحالية بالكامل وإعادة حساب النتيجة (موصى به)' : 'Remplacer entièrement'}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                              <input
                                type="radio"
                                name="importMode"
                                value="merge"
                                checked={importMode === 'merge'}
                                onChange={() => setImportMode('merge')}
                                className="accent-emerald-600"
                              />
                              <span>{lang === 'ar' ? 'دمج مع الأحداث الحالية دون تكرار' : 'Fusionner sans doublons'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Confirm Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleConfirmImport}
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={18} />
                            <span>{lang === 'ar' ? 'تأكيد واستيراد الأحداث إلى المباراة الآن' : 'Confirmer l\'importation'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-rose-600 dark:text-rose-400">
                        <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                          <AlertCircle size={18} />
                          <span>{lang === 'ar' ? 'فشل فحص البيانات:' : 'Erreur de validation :'}</span>
                        </div>
                        <ul className="list-disc list-inside text-xs font-bold space-y-1">
                          {validationResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADD EVENT MANUALLY */}
          {activeTab === 'add_event' && (
            <form onSubmit={handleAddManualEvent} className="max-w-xl mx-auto space-y-4">
              <div className={`p-6 rounded-3xl border-2 space-y-4 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Plus size={20} className="text-purple-600" />
                  <span>{lang === 'ar' ? 'إضافة حدث يدوياً لسجل المباراة' : 'Ajouter un événement manuellement'}</span>
                </h3>

                {/* Team Selection */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    {lang === 'ar' ? 'الفريق المعني' : 'Équipe'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setManualTeam('home')}
                      className={`p-3 rounded-2xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        manualTeam === 'home'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: match.homeTeam.color }} />
                      <span className="truncate">{match.homeTeam.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualTeam('away')}
                      className={`p-3 rounded-2xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        manualTeam === 'away'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: match.awayTeam.color }} />
                      <span className="truncate">{match.awayTeam.name}</span>
                    </button>
                  </div>
                </div>

                {/* Time Input */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {lang === 'ar' ? 'الدقيقة' : 'Minute'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={manualTimeMinutes}
                      onChange={(e) => setManualTimeMinutes(parseInt(e.target.value) || 0)}
                      className={`w-full p-2.5 rounded-xl border text-center font-black text-sm outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {lang === 'ar' ? 'الثانية' : 'Seconde'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={manualTimeSeconds}
                      onChange={(e) => setManualTimeSeconds(parseInt(e.target.value) || 0)}
                      className={`w-full p-2.5 rounded-xl border text-center font-black text-sm outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    {lang === 'ar' ? 'نوع الحدث' : 'Type d\'événement'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualType('GOAL')}
                      className={`p-2.5 rounded-xl border font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        manualType === 'GOAL'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span>⚽</span>
                      <span>{lang === 'ar' ? 'هدف' : 'But'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType('SANCTION')}
                      className={`p-2.5 rounded-xl border font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        manualType === 'SANCTION'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span>⚠️</span>
                      <span>{lang === 'ar' ? 'عقوبة' : 'Sanction'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType('TIMEOUT')}
                      className={`p-2.5 rounded-xl border font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        manualType === 'TIMEOUT'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span>⏱️</span>
                      <span>{lang === 'ar' ? 'مستقطع' : 'Timeout'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-type specifics */}
                {manualType === 'GOAL' && (
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {lang === 'ar' ? 'نوع الهدف' : 'Type de but'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setManualGoalType('NORMAL')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          manualGoalType === 'NORMAL' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                        }`}
                      >
                        {lang === 'ar' ? 'هدف عادي' : 'But normal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualGoalType('7M')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          manualGoalType === '7M' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                        }`}
                      >
                        {lang === 'ar' ? 'رمية 7 أمتار (7m)' : 'Jet de 7m'}
                      </button>
                    </div>
                  </div>
                )}

                {manualType === 'SANCTION' && (
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {lang === 'ar' ? 'نوع العقوبة' : 'Type de sanction'}
                    </label>
                    <select
                      value={manualSanctionType}
                      onChange={(e: any) => setManualSanctionType(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-black outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value={SanctionType.YELLOW}>{lang === 'ar' ? 'إنذار (بطاقة صفراء)' : 'Carton Jaune'}</option>
                      <option value={SanctionType.TWO_MINUTES}>{lang === 'ar' ? 'إيقاف مؤقت دقيقتين (2 min)' : 'Exclusion 2 minutes'}</option>
                      <option value={SanctionType.RED}>{lang === 'ar' ? 'طرد واستبعاد (بطاقة حمراء)' : 'Carton Rouge'}</option>
                      <option value={SanctionType.BLUE}>{lang === 'ar' ? 'تقرير تحكيمي (بطاقة زرقاء)' : 'Carton Bleu'}</option>
                    </select>
                  </div>
                )}

                {/* Player Selection (For Goal or Sanction) */}
                {manualType !== 'TIMEOUT' && (
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {lang === 'ar' ? 'اللاعب المعني (اختياري)' : 'Joueur concerné'}
                    </label>
                    <select
                      value={manualPlayerId}
                      onChange={(e) => setManualPlayerId(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-black outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="">{lang === 'ar' ? '-- بدون تحديد لاعب معين --' : '-- Aucun joueur spécifique --'}</option>
                      {manualTeamPlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <Plus size={18} />
                  <span>{lang === 'ar' ? 'إضافة الحدث للسجل وتحديث النتيجة' : 'Enregistrer l\'événement'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
