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
  RefreshCw,
  BarChart3,
  FileSpreadsheet,
  Award,
  TrendingUp,
  Zap,
  Clock,
  ShieldCheck,
  Share2,
  MessageCircle,
  Sparkles,
  PieChart,
  Loader2,
  Printer,
  Bot,
  Target,
  Lightbulb,
  CheckCheck
} from 'lucide-react';
import { 
  recalculateMatchFromEvents
} from '../utils/eventsManager.ts';
import { exportMatchToExcel } from '../utils/excelExporter.ts';
import { analyzeMatch, MatchAnalysisReport } from '../utils/matchAnalysis.ts';
import { generateAnalysisPDF } from '../utils/analysisPdfGenerator.ts';
import { requestAIMatchAnalysis, AIMatchAnalysis } from '../utils/aiAnalysisService.ts';

interface MatchEventsModalProps {
  match: MatchState;
  onUpdateMatch: (updated: MatchState) => void;
  onClose: () => void;
  isDarkMode: boolean;
  lang?: AppLanguage;
  initialTab?: 'timeline' | 'analysis' | 'import_export' | 'add_event';
}

export const MatchEventsModal: React.FC<MatchEventsModalProps> = ({
  match,
  onUpdateMatch,
  onClose,
  isDarkMode,
  lang = 'ar',
  initialTab = 'timeline'
}) => {
  const activeLang: AppLanguage = (lang as AppLanguage) || 'ar';
  const isRtl = activeLang === 'ar';
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis' | 'import_export' | 'add_event'>(initialTab);

  // Filter & Search states for timeline
  const [filterType, setFilterType] = useState<'all' | 'GOAL' | 'SANCTION' | 'TIMEOUT'>('all');
  const [filterSanction, setFilterSanction] = useState<'all' | SanctionType>('all');
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Export states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // AI Analysis states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIMatchAnalysis | null>(match.aiAnalysis || null);
  const [copiedAI, setCopiedAI] = useState(false);

  // Manual Add Event states
  const [manualTimeMinutes, setManualTimeMinutes] = useState(Math.floor(match.timer / 60));
  const [manualTimeSeconds, setManualTimeSeconds] = useState(match.timer % 60);
  const [manualTeam, setManualTeam] = useState<'home' | 'away'>('home');
  const [manualType, setManualType] = useState<'GOAL' | 'SANCTION' | 'TIMEOUT'>('GOAL');
  const [manualGoalType, setManualGoalType] = useState<'NORMAL' | '7M'>('NORMAL');
  const [manualSanctionType, setManualSanctionType] = useState<SanctionType>(SanctionType.YELLOW);
  const [manualPlayerId, setManualPlayerId] = useState<string>('');

  const manualTeamPlayers = manualTeam === 'home' ? match.homeTeam.players : match.awayTeam.players;

  // Filtered Events for Timeline
  const filteredEvents = useMemo(() => {
    let list = [...match.events];

    if (filterType !== 'all') {
      list = list.filter(e => e.type === filterType);
    }
    if (filterType === 'SANCTION' && filterSanction !== 'all') {
      list = list.filter(e => e.sanctionType === filterSanction);
    }
    if (filterTeam !== 'all') {
      list = list.filter(e => e.team === filterTeam);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(e => 
        (e.playerName && e.playerName.toLowerCase().includes(q)) ||
        (e.timeStr && e.timeStr.includes(q)) ||
        (e.playerId && e.playerId.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortOrder === 'desc') return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });

    return list;
  }, [match.events, filterType, filterSanction, filterTeam, searchTerm, sortOrder]);

  // Statistical & Tactical Analysis
  const analysis: MatchAnalysisReport = useMemo(() => {
    return analyzeMatch(match, activeLang);
  }, [match, activeLang]);

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

    const playerObj = manualTeamPlayers.find(p => p.id === manualPlayerId);

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

  // Export Excel
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      exportMatchToExcel(match, activeLang);
    } catch (e) {
      console.error('Failed to export Excel', e);
      alert(activeLang === 'ar' ? 'تعذر تصدير ملف الإكسل' : 'Échec de l\'exportation Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const ok = await generateAnalysisPDF('match-analysis-printable-report', match, activeLang);
      if (!ok) {
        alert(activeLang === 'ar' ? 'تعذر إنشاء تقرير PDF، يرجى المحاولة مرة أخرى.' : 'Échec de la génération du PDF.');
      }
    } catch (e) {
      console.error('Failed to export PDF', e);
      alert(activeLang === 'ar' ? 'حدث خطأ أثناء إعداد تقرير PDF' : 'Erreur lors de l\'export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Share WhatsApp Analysis
  const handleShareWhatsAppAnalysis = () => {
    const text = isRtl
      ? `🤾‍♂️ *تقرير وتحليل مباراة كرة اليد الرسمية*\n🏆 *${match.homeTeam.name}* (${analysis.finalScore.home}) 🆚 (${analysis.finalScore.away}) *${match.awayTeam.name}*\n🥇 الفائز: *${analysis.winner}*\n\n📊 *أبرز مؤشرات الأداء:*\n• الشوط الأول: ${analysis.firstHalf.home} - ${analysis.firstHalf.away}\n• الشوط الثاني: ${analysis.secondHalf.home} - ${analysis.secondHalf.away}\n• هداف المباراة: ${analysis.mvpPlayer ? `${analysis.mvpPlayer.name} (#${analysis.mvpPlayer.number}) - ${analysis.mvpPlayer.goals} أهداف` : '-'}\n• عقوبات دقيقتين: ${analysis.twoMinuteImpact.homeSuspensions} للمضيف مقابل ${analysis.twoMinuteImpact.awaySuspensions} للضيف\n\n📝 *الخلاصة الفنية والتحليلية:*\n${analysis.narrativeSummaryAr}\n\n📄 تم التوثيق والتحليل بواسطة تطبيق *HandballScore PRO*.`
      : `🤾‍♂️ *Rapport & Analyse du Match - Handball*\n🏆 *${match.homeTeam.name}* (${analysis.finalScore.home}) 🆚 (${analysis.finalScore.away}) *${match.awayTeam.name}*\n🥇 Vainqueur: *${analysis.winner}*\n\n📊 *Statistiques Clés:*\n• 1ère Mi-temps: ${analysis.firstHalf.home} - ${analysis.firstHalf.away}\n• 2ème Mi-temps: ${analysis.secondHalf.home} - ${analysis.secondHalf.away}\n• Meilleur buteur: ${analysis.mvpPlayer ? `${analysis.mvpPlayer.name} - ${analysis.mvpPlayer.goals} buts` : '-'}\n\n📝 *Analyse Technique:*\n${analysis.narrativeSummaryFr}\n\n📄 Généré par *HandballScore PRO*.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Generate AI Tactical Match Analysis via Gemini
  const handleGenerateAIAnalysis = async () => {
    try {
      setIsGeneratingAI(true);
      setAiError(null);
      const res = await requestAIMatchAnalysis(match, analysis, activeLang);
      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
        onUpdateMatch({
          ...match,
          aiAnalysis: res.analysis
        });
      } else {
        setAiError(res.error || (activeLang === 'ar' ? 'تعذر توليد التحليل التكتيكي الذكي' : 'Échec de l\'analyse IA'));
      }
    } catch (e: any) {
      console.error('AI generation failed', e);
      setAiError(e?.message || (activeLang === 'ar' ? 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي' : 'Erreur de connexion'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Copy AI Analysis text
  const handleCopyAIAnalysis = async () => {
    if (!aiAnalysis) return;
    const text = isRtl
      ? `🤖 *التحليل التكتيكي الذكي لمباراة كرة اليد (Gemini AI)*\n🏆 *${match.homeTeam.name}* ضد *${match.awayTeam.name}* (${analysis.finalScore.home} - ${analysis.finalScore.away})\n\n📌 *العنوان:* ${aiAnalysis.title}\n💬 *الخلاصة:* ${aiAnalysis.headline}\n\n📖 *قراءة فنية لمجريات اللقاء:*\n${aiAnalysis.narrativeOverview}\n\n🎯 *أهم نقاط التحول التكتيكية:*\n${aiAnalysis.turningPoints.map(p => `• ${p}`).join('\n')}\n\n⚡ *المنظومة الهجومية:* ${aiAnalysis.offensiveAnalysis}\n🛡️ *المنظومة الدفاعية:* ${aiAnalysis.defensiveAnalysis}\n\n🥇 *رجل المباراة (MVP):* ${aiAnalysis.mvpEvaluation.playerName} (${aiAnalysis.mvpEvaluation.rating}) - ${aiAnalysis.mvpEvaluation.verdict}\n\n📋 *توصية لـ ${match.homeTeam.name}:* ${aiAnalysis.homeTeamAnalysis.coachAdvice}\n📋 *توصية لـ ${match.awayTeam.name}:* ${aiAnalysis.awayTeamAnalysis.coachAdvice}\n\n📄 صادر بواسطة تطبيق *HandballScore PRO*.`
      : `🤖 *Analyse Tactique IA - Match Handball (Gemini)*\n🏆 *${match.homeTeam.name}* vs *${match.awayTeam.name}* (${analysis.finalScore.home} - ${analysis.finalScore.away})\n\n📌 *Titre:* ${aiAnalysis.title}\n💬 *Résumé:* ${aiAnalysis.headline}\n\n📖 *Vue d'ensemble:*\n${aiAnalysis.narrativeOverview}\n\n🎯 *Tournants tactiques:*\n${aiAnalysis.turningPoints.map(p => `• ${p}`).join('\n')}\n\n🥇 *MVP:* ${aiAnalysis.mvpEvaluation.playerName} (${aiAnalysis.mvpEvaluation.rating}) - ${aiAnalysis.mvpEvaluation.verdict}\n\n📋 *Conseil ${match.homeTeam.name}:* ${aiAnalysis.homeTeamAnalysis.coachAdvice}\n📋 *Conseil ${match.awayTeam.name}:* ${aiAnalysis.awayTeamAnalysis.coachAdvice}\n\n📄 Généré par *HandballScore PRO*.`;
    await navigator.clipboard.writeText(text);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-5xl max-h-[94vh] flex flex-col rounded-[2.5rem] border-2 shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">
                  {lang === 'ar' ? 'سجل أحداث وتحليل المقابلة' : 'Journal & Analyse du Match'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {match.events.length} {lang === 'ar' ? 'حدث' : 'événements'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: match.homeTeam.color }} />
                <span>{match.homeTeam.name}</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">({analysis.finalScore.home})</span>
                <span>-</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">({analysis.finalScore.away})</span>
                <span>{match.awayTeam.name}</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: match.awayTeam.color }} />
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
          {/* Tab 1: Analysis */}
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>{lang === 'ar' ? '📊 تحليل المقابلة المتقدم' : 'Analyse du Match'}</span>
          </button>

          {/* Tab 2: Timeline */}
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History size={16} />
            <span>{lang === 'ar' ? '⏱️ سجل الأحداث الزمني' : 'Chronologie'}</span>
          </button>

          {/* Tab 3: Export */}
          <button
            onClick={() => setActiveTab('import_export')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import_export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download size={16} />
            <span>{activeLang === 'ar' ? '📥 تصدير البيانات (Excel / PDF)' : 'Export (Excel / PDF)'}</span>
          </button>

          {/* Tab 4: Add Manual */}
          <button
            onClick={() => setActiveTab('add_event')}
            className={`py-3 px-4 font-black text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add_event'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus size={16} />
            <span>{lang === 'ar' ? '➕ إضافة حدث يدوياً' : 'Ajouter manuellement'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ======================================================== */}
          {/* TAB: MATCH ANALYSIS (NEW ADVANCED FEATURE) */}
          {/* ======================================================== */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              
              {/* Quick Actions Bar */}
              <div className={`p-4 rounded-3xl border-2 flex flex-wrap items-center justify-between gap-3 shadow-sm ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span className="font-black text-xs sm:text-sm">
                    {lang === 'ar' ? 'خيارات التقرير والتحليل المفصل:' : 'Options du Rapport:'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* AI Analysis Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAIAnalysis}
                    disabled={isGeneratingAI}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={activeLang === 'ar' ? 'تحليل تكتيكي عميق بالذكاء الاصطناعي (Gemini)' : 'Analyse Tactique IA'}
                  >
                    {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                    <span>
                      {isGeneratingAI 
                        ? (activeLang === 'ar' ? 'جارٍ تحليل اللقاء بالذكاء الاصطناعي...' : 'Analyse IA en cours...') 
                        : (activeLang === 'ar' ? '🤖 تحليل تكتيكي ذكي (AI)' : 'Analyse IA')}
                    </span>
                  </button>

                  {/* Export Excel */}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={lang === 'ar' ? 'تصدير البيانات كملف إكسل منسق مع الألوان' : 'Exporter en Excel'}
                  >
                    <FileSpreadsheet size={16} />
                    <span>{lang === 'ar' ? 'تصدير إكسل (Excel .xls)' : 'Excel (.xls)'}</span>
                  </button>

                  {/* Export PDF */}
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={lang === 'ar' ? 'تصدير تقرير التحليل كملف PDF رسمي ومنسق' : 'Télécharger Rapport PDF'}
                  >
                    {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    <span>{isExportingPDF ? (lang === 'ar' ? 'جارٍ الإنشاء...' : 'Génération...') : (lang === 'ar' ? 'تحميل تقرير PDF' : 'Rapport PDF')}</span>
                  </button>

                  {/* WhatsApp Summary */}
                  <button
                    type="button"
                    onClick={handleShareWhatsAppAnalysis}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    title={lang === 'ar' ? 'مشاركة ملخص التحليل عبر واتساب' : 'Partager sur WhatsApp'}
                  >
                    <MessageCircle size={16} />
                    <span>{lang === 'ar' ? 'مشاركة واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs font-black">
                  <AlertCircle size={18} />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Printable / Visual Analysis Container */}
              <div id="match-analysis-printable-report" className={`p-6 sm:p-8 rounded-[2.5rem] border-2 space-y-6 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                
                {/* 1. Match Result Banner */}
                <div className={`p-6 rounded-3xl border-2 relative overflow-hidden shadow-lg ${
                  isDarkMode ? 'bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border-slate-800' : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border-indigo-200'
                }`}>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-center md:text-start">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center md:items-start">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.homeTeam.color }} />
                        <span>{lang === 'ar' ? 'المضيف' : 'Domicile'}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black">{match.homeTeam.name}</h3>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'ar' ? 'الشوط الأول:' : 'MT1:'} <strong className="text-slate-900 dark:text-white">{analysis.firstHalf.home}</strong> | {lang === 'ar' ? 'الشوط الثاني:' : 'MT2:'} <strong className="text-slate-900 dark:text-white">{analysis.secondHalf.home}</strong>
                        {analysis.penalties.home > 0 && ` | 7m: ${analysis.penalties.home}`}
                      </div>
                    </div>

                    {/* Central Score */}
                    <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-white dark:bg-slate-950 border shadow-md">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                        {lang === 'ar' ? 'النتيجة النهائية' : 'Score Final'}
                      </span>
                      <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                        {analysis.finalScore.home} - {analysis.finalScore.away}
                      </div>
                      <span className="mt-2 text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {lang === 'ar' ? 'الفائز:' : 'Vainqueur:'} {analysis.winner}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center md:items-end">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.awayTeam.color }} />
                        <span>{lang === 'ar' ? 'الضيف' : 'Extérieur'}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black">{match.awayTeam.name}</h3>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'ar' ? 'الشوط الأول:' : 'MT1:'} <strong className="text-slate-900 dark:text-white">{analysis.firstHalf.away}</strong> | {lang === 'ar' ? 'الشوط الثاني:' : 'MT2:'} <strong className="text-slate-900 dark:text-white">{analysis.secondHalf.away}</strong>
                        {analysis.penalties.away > 0 && ` | 7m: ${analysis.penalties.away}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Highlights Strip (MVP, Biggest Run, Pace) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Highlight 1: MVP Player */}
                  <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/50 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
                      <Award size={24} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wide block">
                        {lang === 'ar' ? 'أفضل لاعب وهداف المقابلة' : 'Homme du Match (MVP)'}
                      </span>
                      <h4 className="text-sm font-black truncate text-slate-900 dark:text-white">
                        {analysis.mvpPlayer ? `#${analysis.mvpPlayer.number} ${analysis.mvpPlayer.name}` : (lang === 'ar' ? 'لا يوجد هداف محدد' : 'Non déterminé')}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        {analysis.mvpPlayer ? `${analysis.mvpPlayer.goals} ${lang === 'ar' ? 'أهداف' : 'buts'} (تقييم: ${analysis.mvpPlayer.impactScore} نقطة)` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Highlight 2: Biggest Scoring Run */}
                  <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/50 border-blue-500/30' : 'bg-blue-50/60 border-blue-200'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                      <TrendingUp size={24} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wide block">
                        {lang === 'ar' ? 'أكبر سلسلة أهداف دون رد' : 'Meilleure Série'}
                      </span>
                      <h4 className="text-sm font-black truncate text-slate-900 dark:text-white">
                        {analysis.largestRun ? `${analysis.largestRun.goalsCount} ${lang === 'ar' ? 'أهداف متتالية لـ' : 'buts pour'} ${analysis.largestRun.teamName}` : (lang === 'ar' ? 'تبادل مستمر للأهداف' : 'Équilibré')}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        {analysis.largestRun ? `${lang === 'ar' ? 'الفترة:' : 'Période:'} ${analysis.largestRun.startTimeStr} - ${analysis.largestRun.endTimeStr}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Highlight 3: Rhythm & Changes */}
                  <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-950/50 border-purple-500/30' : 'bg-purple-50/60 border-purple-200'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                      <Clock size={24} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wide block">
                        {lang === 'ar' ? 'إيقاع المقابلة وتقلبات النتيجة' : 'Rythme & Changements'}
                      </span>
                      <h4 className="text-sm font-black truncate text-slate-900 dark:text-white">
                        {analysis.scoringPaceMinutesPerGoal > 0 ? `${lang === 'ar' ? 'هدف كل' : '1 but /'} ${analysis.scoringPaceMinutesPerGoal} ${lang === 'ar' ? 'دقيقة' : 'min'}` : '-'}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        {analysis.leadChanges} {lang === 'ar' ? 'مرات تبدّل فيها المتصدر' : 'changements de leader'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Comparative Technical Bars */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-base font-black flex items-center gap-2">
                    <PieChart size={18} className="text-blue-600" />
                    <span>{lang === 'ar' ? 'مقارنة فنية مباشرة بين الفريقين' : 'Comparaison Technique Directe'}</span>
                  </h3>

                  <div className="space-y-3 text-xs font-bold">
                    {/* Goals Bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{match.homeTeam.name}: <strong>{analysis.finalScore.home}</strong></span>
                        <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الأهداف' : 'Total Buts'}</span>
                        <span>{match.awayTeam.name}: <strong>{analysis.finalScore.away}</strong></span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full transition-all" 
                          style={{ 
                            width: `${analysis.finalScore.home + analysis.finalScore.away > 0 ? (analysis.finalScore.home / (analysis.finalScore.home + analysis.finalScore.away)) * 100 : 50}%`,
                            backgroundColor: match.homeTeam.color 
                          }} 
                        />
                        <div 
                          className="h-full transition-all" 
                          style={{ 
                            width: `${analysis.finalScore.home + analysis.finalScore.away > 0 ? (analysis.finalScore.away / (analysis.finalScore.home + analysis.finalScore.away)) * 100 : 50}%`,
                            backgroundColor: match.awayTeam.color 
                          }} 
                        />
                      </div>
                    </div>

                    {/* 7m Penalties Bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{match.homeTeam.name}: <strong>{analysis.sevenMeterGoals.home}</strong></span>
                        <span className="text-slate-500">{lang === 'ar' ? 'رميات 7 أمتار المسجلة' : 'Jets 7m réussis'}</span>
                        <span>{match.awayTeam.name}: <strong>{analysis.sevenMeterGoals.away}</strong></span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500 transition-all" 
                          style={{ 
                            width: `${(analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away > 0) ? (analysis.sevenMeterGoals.home / (analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away)) * 100 : 50}%` 
                          }} 
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all" 
                          style={{ 
                            width: `${(analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away > 0) ? (analysis.sevenMeterGoals.away / (analysis.sevenMeterGoals.home + analysis.sevenMeterGoals.away)) * 100 : 50}%` 
                          }} 
                        />
                      </div>
                    </div>

                    {/* 2-Min Suspensions Bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{match.homeTeam.name}: <strong>{analysis.twoMinuteImpact.homeSuspensions} ({analysis.twoMinuteImpact.homePenaltyMinutes} د)</strong></span>
                        <span className="text-slate-500">{lang === 'ar' ? 'الإيقافات المؤقتة (2 دقيقة)' : 'Exclusions 2 min'}</span>
                        <span>{match.awayTeam.name}: <strong>{analysis.twoMinuteImpact.awaySuspensions} ({analysis.twoMinuteImpact.awayPenaltyMinutes} د)</strong></span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full bg-orange-500 transition-all" 
                          style={{ 
                            width: `${(analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions > 0) ? (analysis.twoMinuteImpact.homeSuspensions / (analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions)) * 100 : 50}%` 
                          }} 
                        />
                        <div 
                          className="h-full bg-rose-500 transition-all" 
                          style={{ 
                            width: `${(analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions > 0) ? (analysis.twoMinuteImpact.awaySuspensions / (analysis.twoMinuteImpact.homeSuspensions + analysis.twoMinuteImpact.awaySuspensions)) * 100 : 50}%` 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Timeouts Used */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{match.homeTeam.name}: <strong>{analysis.timeoutsEffectiveness.homeTimeouts} / 3</strong></span>
                        <span className="text-slate-500">{lang === 'ar' ? 'الأوقات المستقطعة' : 'Temps Morts'}</span>
                        <span>{match.awayTeam.name}: <strong>{analysis.timeoutsEffectiveness.awayTimeouts} / 3</strong></span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full bg-purple-500 transition-all" 
                          style={{ 
                            width: `${(analysis.timeoutsEffectiveness.homeTimeouts + analysis.timeoutsEffectiveness.awayTimeouts > 0) ? (analysis.timeoutsEffectiveness.homeTimeouts / (analysis.timeoutsEffectiveness.homeTimeouts + analysis.timeoutsEffectiveness.awayTimeouts)) * 100 : 50}%` 
                          }} 
                        />
                        <div 
                          className="h-full bg-indigo-500 transition-all" 
                          style={{ 
                            width: `${(analysis.timeoutsEffectiveness.homeTimeouts + analysis.timeoutsEffectiveness.awayTimeouts > 0) ? (analysis.timeoutsEffectiveness.awayTimeouts / (analysis.timeoutsEffectiveness.homeTimeouts + analysis.timeoutsEffectiveness.awayTimeouts)) * 100 : 50}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Top Scorers Podium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Home Scorers */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.homeTeam.color }} />
                      <span>{lang === 'ar' ? `أبرز هدافي ${match.homeTeam.name}` : `Buteurs ${match.homeTeam.name}`}</span>
                    </h4>
                    {analysis.topHomeScorers.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'لم يسجل أي لاعب بعد' : 'Aucun buteur'}</p>
                    ) : (
                      <div className="space-y-2">
                        {analysis.topHomeScorers.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px]">
                                {idx + 1}
                              </span>
                              <span>#{p.number} {p.name}</span>
                            </div>
                            <span className="font-black text-blue-600 dark:text-blue-400">
                              {p.goals} {lang === 'ar' ? 'أهداف' : 'buts'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Away Scorers */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.awayTeam.color }} />
                      <span>{lang === 'ar' ? `أبرز هدافي ${match.awayTeam.name}` : `Buteurs ${match.awayTeam.name}`}</span>
                    </h4>
                    {analysis.topAwayScorers.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'لم يسجل أي لاعب بعد' : 'Aucun buteur'}</p>
                    ) : (
                      <div className="space-y-2">
                        {analysis.topAwayScorers.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[10px]">
                                {idx + 1}
                              </span>
                              <span>#{p.number} {p.name}</span>
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {p.goals} {lang === 'ar' ? 'أهداف' : 'buts'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4.5. GEMINI AI TACTICAL MATCH ANALYSIS SECTION */}
                {aiAnalysis && (
                  <div className={`p-6 sm:p-7 rounded-3xl border-2 shadow-lg space-y-5 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 border-indigo-500/40' 
                      : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-purple-50/70 border-indigo-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                          <Bot size={26} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {aiAnalysis.title}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              Gemini AI Pro
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {aiAnalysis.headline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyAIAnalysis}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition cursor-pointer ${
                            copiedAI 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {copiedAI ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedAI ? (activeLang === 'ar' ? 'تم النسخ!' : 'Copié!') : (activeLang === 'ar' ? 'نسخ التقرير' : 'Copier')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Narrative Overview */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>{activeLang === 'ar' ? 'قراءة فنية وسردية شاملة' : 'Synthèse Narrative'}</span>
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {aiAnalysis.narrativeOverview}
                      </p>
                    </div>

                    {/* Turning points */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Target size={14} />
                        <span>{activeLang === 'ar' ? 'نقاط التحول التكتيكية والحاسمة' : 'Tournants Tactiques'}</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aiAnalysis.turningPoints.map((point, idx) => (
                          <div key={idx} className={`p-3 rounded-2xl border text-xs font-bold flex items-start gap-2 ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white/80 border-indigo-100 text-slate-800'
                          }`}>
                            <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MVP AI Verdict */}
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                      isDarkMode ? 'bg-slate-900/80 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
                        <Award size={24} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wide block">
                          {activeLang === 'ar' ? 'تقييم الذكاء الاصطناعي لرجل المباراة (MVP)' : 'Verdict MVP (AI)'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {aiAnalysis.mvpEvaluation.playerName} <span className="text-xs font-bold text-amber-600">({aiAnalysis.mvpEvaluation.rating})</span>
                        </h4>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                          {aiAnalysis.mvpEvaluation.verdict}
                        </p>
                      </div>
                    </div>

                    {/* Coach Advice for both teams */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                        <h5 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                          <Lightbulb size={14} />
                          <span>{activeLang === 'ar' ? `توصية مدرب ${match.homeTeam.name}` : `Conseil Coach ${match.homeTeam.name}`}</span>
                        </h5>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                          {aiAnalysis.homeTeamAnalysis.coachAdvice}
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                        <h5 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                          <Lightbulb size={14} />
                          <span>{activeLang === 'ar' ? `توصية مدرب ${match.awayTeam.name}` : `Conseil Coach ${match.awayTeam.name}`}</span>
                        </h5>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                          {aiAnalysis.awayTeamAnalysis.coachAdvice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Tactical Observations & Summary Paragraph */}
                <div className={`p-5 rounded-2xl border-2 space-y-3 ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <FileText size={16} />
                    <span>{lang === 'ar' ? 'التقرير الفني والتكتيكي المفصل للمباراة' : 'Rapport Tactique & Technique'}</span>
                  </h4>

                  {/* Bullet Insights */}
                  <div className="space-y-1.5">
                    {(isRtl ? analysis.tacticalInsightsAr : analysis.tacticalInsightsFr).map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Narrative paragraph */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isRtl ? analysis.narrativeSummaryAr : analysis.narrativeSummaryFr}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: TIMELINE */}
          {/* ======================================================== */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              {/* Stats KPI Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-500">{lang === 'ar' ? 'أهداف المضيف' : 'Buts Domicile'}</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">{analysis.finalScore.home}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-500">{lang === 'ar' ? 'أهداف الضيف' : 'Buts Extérieur'}</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{analysis.finalScore.away}</div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400">{lang === 'ar' ? 'إنذارات (أصفر)' : 'Jaunes'}</div>
                  <div className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                    {match.events.filter(e => e.type === 'SANCTION' && e.sanctionType === SanctionType.YELLOW).length}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">{lang === 'ar' ? 'إيقاف 2 دقائق' : '2 min'}</div>
                  <div className="text-xl font-black text-orange-600 dark:text-orange-400">
                    {match.events.filter(e => e.type === 'SANCTION' && e.sanctionType === SanctionType.TWO_MINUTES).length}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">{lang === 'ar' ? 'طرد (أحمر)' : 'Rouges'}</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {match.events.filter(e => e.type === 'SANCTION' && e.sanctionType === SanctionType.RED).length}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">{lang === 'ar' ? 'تقرير (أزرق)' : 'Bleues'}</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {match.events.filter(e => e.type === 'SANCTION' && e.sanctionType === SanctionType.BLUE).length}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">{lang === 'ar' ? 'وقت مستقطع' : 'Timeouts'}</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                    {match.events.filter(e => e.type === 'TIMEOUT').length}
                  </div>
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
                    {activeLang === 'ar' ? 'يمكنك تسجيل الأهداف والعقوبات أثناء سير المباراة أو إضافتها يدوياً.' : 'Enregistrez les buts et sanctions pendant le match ou manuellement.'}
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

          {/* ======================================================== */}
          {/* TAB: IMPORT / EXPORT (ENHANCED WITH EXCEL & PDF OPTIONS) */}
          {/* ======================================================== */}
          {activeTab === 'import_export' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className={`p-6 sm:p-7 rounded-3xl border-2 shadow-sm ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Download size={24} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {activeLang === 'ar' ? 'تصدير وحفظ بيانات المباراة والتقارير' : 'Exporter les données et rapports du match'}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {activeLang === 'ar' 
                          ? 'تصدير منظم وملون بصيغة Excel أو PDF عالي الدقة جاهز للطباعة والأرشفة' 
                          : 'Exportations enrichies et stylisées aux formats Excel et PDF de haute qualité.'}
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full border border-blue-500/20">
                    {match.events.length} {activeLang === 'ar' ? 'حدث مسجل بالمباراة' : 'événements enregistrés'}
                  </span>
                </div>

                {/* 2 Focused Export Cards (Excel & PDF) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* CARD 1: EXCEL EXPORT */}
                  <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                  }`}>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                          <FileSpreadsheet size={24} />
                        </div>
                        <span className="text-xs uppercase font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                          EXCEL (.XLS)
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                          {activeLang === 'ar' ? 'تصدير ملف إكسل منسق بالألوان' : 'Export Excel (.xls) Stylisé'}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                          {activeLang === 'ar'
                            ? 'ورقة عمل إكسل كاملة تضم بطاقة اللقاء، ترويسات ملونة بهوية الفريقين، إحصائيات اللاعبين، وسجل زمني مفصل لجميع الأحداث.'
                            : 'Feuille Excel complète avec couleurs des équipes, statistiques par joueur et historique chronologique des événements.'}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'جداول ملونة ومنسقة تدعم اللغة العربية (RTL)' : 'Mise en page bilingue et couleurs'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'إحصائيات تفصيلية للأهداف، رميات 7م، والعقوبات' : 'Statistiques détaillées des joueurs'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'متوافق تماماً مع Microsoft Excel و Google Sheets' : 'Compatible Excel & Google Sheets'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={isExportingExcel}
                      className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <FileSpreadsheet size={18} />
                      <span>{activeLang === 'ar' ? 'تحميل ملف الإكسل (.xls)' : 'Télécharger le fichier Excel (.xls)'}</span>
                    </button>
                  </div>

                  {/* CARD 2: PDF REPORT */}
                  <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/90 border-rose-500/30 hover:border-rose-500/50' 
                      : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  }`}>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                          {isExportingPDF ? <Loader2 size={24} className="animate-spin" /> : <FileText size={24} />}
                        </div>
                        <span className="text-xs uppercase font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-500/30">
                          PDF A4
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                          {activeLang === 'ar' ? 'تقرير تحليلي وفني مفصل (PDF)' : 'Rapport Analytique Officiel (PDF)'}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                          {activeLang === 'ar'
                            ? 'تقرير فني رسمي عالي الدقة يشمل النتيجة، تحليل الأشواط، بطاقة رجل المباراة (MVP)، أطول سلسلة أهداف، ومقارنات فنية جاهزة للطباعة.'
                            : 'Rapport officiel au format A4 avec analyse tactique, MVP du match, momentum des séries de buts et comparatifs techniques.'}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'تقرير منسق A4 عالي الدقة بالألوان والخطوط الرسمية' : 'Format A4 haute résolution'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'بطاقة رجل المباراة (MVP) وقائمة أبرز الهدافين' : 'Carte MVP et meilleurs buteurs'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{activeLang === 'ar' ? 'فقرة تحليل فني سردية متكاملة لمجريات المقابلة' : 'Synthèse narrative et analyse tactique'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="w-full py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>
                        {isExportingPDF 
                          ? (activeLang === 'ar' ? 'جارٍ إعداد ملف PDF...' : 'Génération en cours...') 
                          : (activeLang === 'ar' ? 'تحميل تقرير PDF الرسمي' : 'Télécharger le Rapport PDF')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: ADD EVENT MANUALLY */}
          {/* ======================================================== */}
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
