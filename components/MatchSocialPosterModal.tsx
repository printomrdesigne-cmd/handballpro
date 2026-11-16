import React, { useState, useRef, useMemo } from 'react';
import { MatchState, SanctionType, AppLanguage } from '../types.ts';
import { toPng } from 'html-to-image';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  MapPin, 
  Sliders, 
  Hash, 
  Eye,
  Trophy
} from 'lucide-react';
import { copyImageToClipboard } from '../utils/imageGenerator.ts';
import { getContrastTextColor } from '../utils/colorContrast.ts';

interface MatchSocialPosterModalProps {
  match: MatchState;
  onClose: () => void;
  lang?: AppLanguage;
  isDarkMode?: boolean;
}

type PosterTheme = 'stadium' | 'handball_court' | 'golden' | 'midnight';
type PosterAspect = 'square' | 'portrait';

const THEME_CONFIG: Record<PosterTheme, {
  bg: string;
  bgColor: string;
  border: string;
  accentGlow1: string;
  accentGlow2: string;
  capsuleBorder: string;
  statsBg: string;
  statsBorder: string;
  ribbonClass: string;
}> = {
  stadium: {
    bg: `linear-gradient(to bottom, rgba(5, 12, 38, 0.65), rgba(5, 12, 38, 0.90)), url('/stadium_match_bg.jpg')`,
    bgColor: '#050c26',
    border: 'border-blue-500/40',
    accentGlow1: 'bg-cyan-400/20',
    accentGlow2: 'bg-amber-400/20',
    capsuleBorder: 'border-blue-400/70 shadow-blue-500/30',
    statsBg: 'from-blue-950/85 via-indigo-950/90 to-blue-950/85',
    statsBorder: 'border-cyan-400/40',
    ribbonClass: 'from-blue-600 via-indigo-600 to-blue-600 border-blue-300/30 shadow-blue-500/40'
  },
  handball_court: {
    bg: `linear-gradient(to bottom, rgba(6, 16, 36, 0.72), rgba(5, 10, 26, 0.92)), url('/handball_ball_court.jpg')`,
    bgColor: '#061024',
    border: 'border-emerald-400/40',
    accentGlow1: 'bg-emerald-400/20',
    accentGlow2: 'bg-amber-400/20',
    capsuleBorder: 'border-emerald-400/70 shadow-emerald-500/30',
    statsBg: 'from-slate-900/90 via-emerald-950/85 to-slate-900/90',
    statsBorder: 'border-emerald-400/40',
    ribbonClass: 'from-emerald-600 via-teal-600 to-emerald-600 border-emerald-300/30 shadow-emerald-500/40'
  },
  golden: {
    bg: `radial-gradient(circle at top center, rgba(217, 119, 6, 0.35), rgba(15, 10, 4, 0.96) 75%), url('/handball_ball_court.jpg')`,
    bgColor: '#120b03',
    border: 'border-amber-400/50',
    accentGlow1: 'bg-amber-400/25',
    accentGlow2: 'bg-yellow-300/20',
    capsuleBorder: 'border-amber-400/80 shadow-amber-500/30',
    statsBg: 'from-stone-950/90 via-amber-950/80 to-stone-950/90',
    statsBorder: 'border-amber-400/45',
    ribbonClass: 'from-amber-600 via-yellow-600 to-amber-600 border-amber-300/40 shadow-amber-500/40'
  },
  midnight: {
    bg: `radial-gradient(circle at top right, rgba(99, 102, 241, 0.35), rgba(6, 9, 20, 0.97) 70%), linear-gradient(to bottom, #070b19, #050711)`,
    bgColor: '#060914',
    border: 'border-indigo-400/45',
    accentGlow1: 'bg-indigo-500/25',
    accentGlow2: 'bg-rose-500/20',
    capsuleBorder: 'border-indigo-400/75 shadow-indigo-500/30',
    statsBg: 'from-slate-950/90 via-indigo-950/85 to-slate-950/90',
    statsBorder: 'border-indigo-400/40',
    ribbonClass: 'from-indigo-600 via-purple-600 to-indigo-600 border-indigo-300/35 shadow-indigo-500/40'
  }
};

const getTeamMonogram = (name: string): string => {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'HB';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
};

export const MatchSocialPosterModal: React.FC<MatchSocialPosterModalProps> = ({
  match,
  onClose,
  lang = 'ar',
  isDarkMode = false
}) => {
  const isRtl = lang === 'ar';
  const posterRef = useRef<HTMLDivElement>(null);

  // Customization state
  const [slogan, setSlogan] = useState<string>(isRtl ? '#معاً_نحو_الأفضل' : '#Ensemble_Plus_Loin');
  const [motto, setMotto] = useState<string>(isRtl ? 'عزيمة • انضباط • طموح' : 'Courage • Discipline • Ambition');
  const [competitionTitle, setCompetitionTitle] = useState<string>(
    match.details?.competition || (isRtl ? 'بطولة القسم الرسمي لكرة اليد' : 'Championnat Officiel de Handball')
  );
  const [roundAndDate, setRoundAndDate] = useState<string>(
    `${match.details?.categorie ? `${match.details.categorie}` : (isRtl ? 'مباراة رسمية' : 'Match Officiel')} | ${match.details?.date || new Date().toLocaleDateString(isRtl ? 'ar-MA' : 'fr-FR')}`
  );
  const [venue, setVenue] = useState<string>(
    match.details?.lieu || (isRtl ? 'القاعة الرياضية المغطاة' : 'Salle Omnisports')
  );
  const [templateTheme, setTemplateTheme] = useState<PosterTheme>('stadium');
  const [aspectRatio, setAspectRatio] = useState<PosterAspect>('square');
  const [ballType, setBallType] = useState<'court' | 'outdoor'>('court');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  const theme = THEME_CONFIG[templateTheme];

  // Safe accessible team colors
  const homeColor = (!match.homeTeam.color || match.homeTeam.color.toLowerCase() === '#000000' || match.homeTeam.color.toLowerCase() === '#ffffff')
    ? '#2563eb'
    : match.homeTeam.color;

  const awayColor = (!match.awayTeam.color || match.awayTeam.color.toLowerCase() === '#000000' || match.awayTeam.color.toLowerCase() === '#ffffff')
    ? '#059669'
    : match.awayTeam.color;

  const homeBadgeText = getContrastTextColor(homeColor);
  const awayBadgeText = getContrastTextColor(awayColor);

  const homeWon = match.score.home > match.score.away;
  const awayWon = match.score.away > match.score.home;

  // Extract statistics
  const stats = useMemo(() => {
    let yellowCount = 0;
    let redCount = 0;
    let twoMinCount = 0;

    const homeGoalsList: { text: string; time: string; minute: number }[] = [];
    const awayGoalsList: { text: string; time: string; minute: number }[] = [];

    if (match.events && match.events.length > 0) {
      match.events.forEach((ev) => {
        if (ev.type === 'SANCTION') {
          if (ev.sanctionType === SanctionType.YELLOW) yellowCount++;
          if (ev.sanctionType === SanctionType.RED || ev.sanctionType === SanctionType.BLUE) redCount++;
          if (ev.sanctionType === SanctionType.TWO_MINUTES) twoMinCount++;
        }
        if (ev.type === 'GOAL') {
          const min = Math.floor((ev.timestamp || 0) / 60) || 1;
          const timeText = ev.timeStr ? `${isRtl ? 'د' : "'"}${ev.timeStr.split(':')[0] || min}` : `${min}'`;
          const goalItem = {
            text: ev.playerName ? `${ev.playerName}` : (isRtl ? 'هدف' : 'But'),
            time: timeText,
            minute: min
          };
          if (ev.team === 'home') {
            homeGoalsList.push(goalItem);
          } else {
            awayGoalsList.push(goalItem);
          }
        }
      });
    }

    const totalGoals = match.score.home + match.score.away;

    return {
      yellowCount,
      redCount,
      twoMinCount,
      totalGoals,
      homeGoals: match.score.home,
      awayGoals: match.score.away,
      homeGoalsList: homeGoalsList.slice(0, 4),
      awayGoalsList: awayGoalsList.slice(0, 4)
    };
  }, [match, isRtl]);

  // Helper: robust poster capture avoiding cross-origin font stylesheet parsing
  const capturePoster = async (ratio: number = 2.4): Promise<string | null> => {
    if (!posterRef.current) return null;
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }

    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: ratio,
        quality: 1,
        backgroundColor: theme.bgColor,
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: '',
        filter: (node: HTMLElement) => {
          if (node.tagName === 'LINK' || node.tagName === 'SCRIPT') return false;
          return true;
        },
        style: {
          transform: 'none',
          boxShadow: 'none'
        }
      });
      if (dataUrl && dataUrl.startsWith('data:image/png')) {
        return dataUrl;
      }
    } catch (toPngErr) {
      console.warn('toPng skipped or threw error, trying html2canvas fallback:', toPngErr);
    }

    try {
      const html2canvasFn = (window as any).html2canvas;
      if (html2canvasFn && posterRef.current) {
        const canvas = await html2canvasFn(posterRef.current, {
          scale: ratio,
          useCORS: true,
          backgroundColor: theme.bgColor,
          logging: false
        });
        return canvas.toDataURL('image/png', 0.98);
      }
    } catch (h2cErr) {
      console.warn('html2canvas fallback failed:', h2cErr);
    }

    return null;
  };

  const handleDownloadImage = async () => {
    if (!posterRef.current) return;
    try {
      setFeedbackMessage(null);
      setIsExporting(true);
      const dataUrl = await capturePoster(2.5);
      if (!dataUrl) {
        throw new Error('Failed to generate poster dataUrl');
      }

      const cleanHome = match.homeTeam.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Home';
      const cleanAway = match.awayTeam.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Away';
      const fileName = `HandballScore_${cleanHome}_vs_${cleanAway}_Poster.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedbackMessage({
        type: 'success',
        text: isRtl ? 'تم تحميل البوستر بجودة عالية بنجاح!' : 'Affiche HD téléchargée avec succès !'
      });
      setTimeout(() => setFeedbackMessage(null), 2500);
    } catch (err) {
      console.error('Failed to export poster image', err);
      setFeedbackMessage({
        type: 'error',
        text: isRtl ? 'تعذر تحميل الصورة عالية الدقة' : 'Échec du téléchargement'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!posterRef.current) return;
    try {
      setFeedbackMessage(null);
      setIsExporting(true);
      const dataUrl = await capturePoster(2);
      if (!dataUrl) {
        throw new Error('Failed to generate poster dataUrl');
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ok = await copyImageToClipboard(blob);
      if (ok) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      } else {
        setFeedbackMessage({
          type: 'info',
          text: isRtl ? 'تم تجهيز الصورة، يرجى استخدام زر التحميل المباشر' : 'Image prête, utilisez le téléchargement'
        });
      }
    } catch (err) {
      console.error('Copy failed', err);
      setFeedbackMessage({
        type: 'error',
        text: isRtl ? 'تعذر نسخ الصورة، يرجى استخدام زر التحميل المباشر' : 'Échec de copie, utilisez le téléchargement'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const resultLine = homeWon
      ? `${isRtl ? 'فوز' : 'Victoire'} ${match.homeTeam.name}`
      : awayWon
        ? `${isRtl ? 'فوز' : 'Victoire'} ${match.awayTeam.name}`
        : (isRtl ? 'تعادل' : 'Match nul');

    const text = `🏆 *${competitionTitle}*\n\n🤾‍♂️ *${match.homeTeam.name}* (${match.score.home}) 🆚 (${match.score.away}) *${match.awayTeam.name}*\n🥇 ${isRtl ? 'النتيجة النهائية:' : 'Résultat final:'} ${resultLine}\n📍 ${venue}\n📅 ${roundAndDate}\n\n${slogan}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const panelSurface = isDarkMode
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-slate-50 border-slate-200 text-slate-900';

  const inputSurface = isDarkMode
    ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600';

  const labelText = isDarkMode ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className={`relative w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Modal Header */}
        <div className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b backdrop-blur z-20 shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-slate-50/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span>{isRtl ? 'بوستر ملخص المباراة الاحترافي' : 'Affiche Officielle du Match'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDarkMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  HD Social Ready
                </span>
              </h2>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRtl
                  ? 'جاهز للنشر على فيسبوك، إنستغرام وستوري واتساب بتنسيق احترافي لكرة اليد'
                  : 'Prêt pour Facebook, Instagram et WhatsApp Status'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {feedbackMessage && (
          <div className={`mx-4 mt-3 px-4 py-2.5 rounded-2xl border text-xs font-black flex items-center justify-between gap-2 shrink-0 ${
            feedbackMessage.type === 'error'
              ? (isDarkMode ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700')
              : feedbackMessage.type === 'success'
                ? (isDarkMode ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700')
                : (isDarkMode ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700')
          }`}>
            <span>{feedbackMessage.text}</span>
            <button type="button" onClick={() => setFeedbackMessage(null)} className="p-1 rounded-lg hover:bg-black/10 cursor-pointer"><X size={14} /></button>
          </div>
        )}

        {/* Main Body: Preview & Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Center: THE POSTER CANVAS PREVIEW */}
          <div className={`lg:col-span-7 flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl border ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            
            {/* The Actual Poster Element (Always rich dark sports card for max contrast & social engagement) */}
            <div 
              ref={posterRef}
              id="match-social-poster-render"
              className={`relative w-full max-w-[520px] ${
                aspectRatio === 'portrait' ? 'aspect-[4/5]' : 'aspect-square'
              } rounded-2xl overflow-hidden shadow-2xl select-none text-white font-sans flex flex-col justify-between p-5 border ${theme.border}`}
              style={{
                backgroundImage: theme.bg,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: theme.bgColor,
              }}
            >
              {/* Floodlight Glow Overlays */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent pointer-events-none" />
              <div className={`absolute top-4 left-6 w-28 h-28 ${theme.accentGlow1} rounded-full blur-3xl pointer-events-none`} />
              <div className={`absolute top-4 right-6 w-28 h-28 ${theme.accentGlow2} rounded-full blur-3xl pointer-events-none`} />

              {/* 1. Header: Trophy, Tournament, Round & Venue */}
              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 text-amber-300 font-black text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  <Trophy size={18} color="#fcd34d" strokeWidth={2.4} />
                  <span className="tracking-wide">{competitionTitle}</span>
                </div>
                
                <div className="text-white/95 font-bold text-[11px] sm:text-xs mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                  {roundAndDate}
                </div>

                <div className="inline-flex items-center gap-1.5 text-white/85 text-[10px] sm:text-[11px] font-semibold mt-0.5">
                  <MapPin size={12} color="#f87171" className="shrink-0" />
                  <span>{venue}</span>
                </div>
              </div>

              {/* 2. Hero Scoreboard: Dynamic Handball Badges + Score Capsule */}
              <div className="relative z-10 my-auto py-2">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  
                  {/* Home Team Shield & Banner */}
                  <div className="flex-1 flex items-center justify-end">
                    <div
                      className={`relative flex items-center rounded-xl px-2.5 py-2 shadow-xl w-full max-w-[175px] min-h-[54px] border ${
                        homeWon ? 'ring-2 ring-amber-400/80 border-amber-300' : 'border-white/25'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${homeColor}e6, #0f172a)`
                      }}
                    >
                      <div
                        className="w-10 h-11 shrink-0 rounded-lg border-2 border-white/80 shadow-md flex flex-col items-center justify-center text-center p-0.5 mr-1.5"
                        style={{ backgroundColor: homeColor, color: homeBadgeText }}
                      >
                        <span className="text-[9px] font-black tracking-tight leading-none">
                          {getTeamMonogram(match.homeTeam.name)}
                        </span>
                        <span className="text-xs leading-tight">🤾‍♂️</span>
                        {homeWon && <span className="text-[8px] leading-none">👑</span>}
                      </div>
                      <div className="flex-1 text-center min-w-0 pr-1">
                        <span className="text-[9px] font-bold text-white/80 block leading-tight">
                          {isRtl ? 'المضيف' : 'Domicile'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white truncate leading-tight drop-shadow">
                          {match.homeTeam.name}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Center Score Capsule */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 ${theme.capsuleBorder} rounded-2xl px-4 sm:px-5 py-2 shadow-2xl flex items-center justify-center min-w-[100px]`}>
                      <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white drop-shadow-[0_2px_8px_rgba(37,99,235,0.85)]">
                        {match.score.home} - {match.score.away}
                      </div>
                    </div>
                    <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-950/90 border border-white/25 text-[9px] font-black text-slate-200 tracking-wider shadow">
                      {isRtl ? 'النتيجة النهائية' : 'SCORE FINAL'}
                    </div>
                  </div>

                  {/* Away Team Shield & Banner */}
                  <div className="flex-1 flex items-center justify-start">
                    <div
                      className={`relative flex items-center rounded-xl px-2.5 py-2 shadow-xl w-full max-w-[175px] min-h-[54px] border ${
                        awayWon ? 'ring-2 ring-amber-400/80 border-amber-300' : 'border-white/25'
                      }`}
                      style={{
                        background: `linear-gradient(225deg, ${awayColor}e6, #0f172a)`
                      }}
                    >
                      <div className="flex-1 text-center min-w-0 pl-1">
                        <span className="text-[9px] font-bold text-white/80 block leading-tight">
                          {isRtl ? 'الضيف' : 'Extérieur'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white truncate leading-tight drop-shadow">
                          {match.awayTeam.name}
                        </h4>
                      </div>
                      <div
                        className="w-10 h-11 shrink-0 rounded-lg border-2 border-white/80 shadow-md flex flex-col items-center justify-center text-center p-0.5 ml-1.5"
                        style={{ backgroundColor: awayColor, color: awayBadgeText }}
                      >
                        <span className="text-[9px] font-black tracking-tight leading-none">
                          {getTeamMonogram(match.awayTeam.name)}
                        </span>
                        <span className="text-xs leading-tight">🤾‍♂️</span>
                        {awayWon && <span className="text-[8px] leading-none">👑</span>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. Goalscorers & Timeline Section */}
              <div className="relative z-10 px-4 py-1.5">
                <div className="grid grid-cols-2 gap-4 relative">
                  <div className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />

                  {/* Home Team Scorers */}
                  <div className="space-y-1 text-right pr-2">
                    {stats.homeGoalsList.length > 0 ? (
                      stats.homeGoalsList.map((g, idx) => (
                        <div key={idx} className="flex items-center justify-end gap-1.5 text-[10px] sm:text-[11px] font-black text-white drop-shadow">
                          <span className="truncate">{g.text}</span>
                          <span className="text-cyan-300 text-[10px] font-bold shrink-0">({g.time})</span>
                          <span className="text-xs shrink-0">🤾</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-white/50 text-right">—</div>
                    )}
                  </div>

                  {/* Away Team Scorers */}
                  <div className="space-y-1 text-left pl-2" dir="ltr">
                    {stats.awayGoalsList.length > 0 ? (
                      stats.awayGoalsList.map((g, idx) => (
                        <div key={idx} className="flex items-center justify-start gap-1.5 text-[10px] sm:text-[11px] font-black text-white drop-shadow">
                          <span className="text-xs shrink-0">🤾</span>
                          <span className="truncate">{g.text}</span>
                          <span className="text-amber-300 text-[10px] font-bold shrink-0">({g.time})</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-white/50 text-left">—</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Match Key Statistics Bar */}
              <div className="relative z-10 my-2">
                <div className={`bg-gradient-to-r ${theme.statsBg} backdrop-blur-md border ${theme.statsBorder} rounded-2xl p-2.5 shadow-2xl`}>
                  <div className="grid grid-cols-5 text-center divide-x divide-white/10 divide-x-reverse">
                    <div className="px-1">
                      <div className="flex justify-center mb-1">
                        <div className="w-3.5 h-4 rounded-[2px] bg-amber-400 shadow-sm shadow-amber-400/50" />
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono block leading-none">{stats.yellowCount}</span>
                      <span className="text-[8px] font-bold text-slate-300 block mt-0.5">{isRtl ? 'صفراء' : 'Jaunes'}</span>
                    </div>

                    <div className="px-1">
                      <div className="flex justify-center mb-1 text-sm leading-none">
                        <span>⏱️</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono block leading-none">{stats.twoMinCount + stats.redCount}</span>
                      <span className="text-[8px] font-bold text-slate-300 block mt-0.5">{isRtl ? 'إيقاف 2د' : '2 min / R'}</span>
                    </div>

                    <div className="px-1">
                      <div className="flex justify-center mb-1 text-sm leading-none">
                        <span>🤾</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono block leading-none text-cyan-300">{stats.totalGoals}</span>
                      <span className="text-[8px] font-bold text-cyan-200 block mt-0.5">{isRtl ? 'إجمالي الأهداف' : 'Total Buts'}</span>
                    </div>

                    <div className="px-1">
                      <div className="flex justify-center mb-1 text-sm leading-none">
                        <span>🥅</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono block leading-none">{stats.awayGoals}</span>
                      <span className="text-[8px] font-bold text-slate-300 block mt-0.5 truncate">{match.awayTeam.name.split(' ')[0]}</span>
                    </div>

                    <div className="px-1">
                      <div className="flex justify-center mb-1 text-sm leading-none">
                        <span>🥅</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono block leading-none">{stats.homeGoals}</span>
                      <span className="text-[8px] font-bold text-slate-300 block mt-0.5 truncate">{match.homeTeam.name.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Slogan Hashtag Ribbon */}
              <div className="relative z-10 flex justify-center -mb-2">
                <div className={`relative px-5 py-1 rounded-lg bg-gradient-to-r ${theme.ribbonClass} text-white font-black text-xs sm:text-sm tracking-wide shadow-lg border`}>
                  {slogan}
                </div>
              </div>

              {/* 6. Bottom Hero Section */}
              <div className="relative z-10 mt-auto pt-2 flex items-end justify-between">
                <div className="text-left font-black tracking-tight" dir="ltr">
                  <span className="italic text-sm sm:text-base block leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">
                    Handball
                  </span>
                  <span className="italic text-base sm:text-lg block leading-none text-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif -mt-0.5">
                    Spirit
                  </span>
                </div>

                {/* Center 3D Sports Ball */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 -mb-2 relative shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-2xl shadow-black ring-2 ring-white/40">
                    <img
                      src={ballType === 'court' ? '/handball_ball_court.jpg' : '/sports_ball_grass.jpg'}
                      alt="Handball"
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black/60 rounded-full blur-sm -z-10" />
                </div>

                {/* Right Team Motto Tag */}
                <div className="text-right">
                  <div className="bg-white/95 text-slate-950 px-3 py-1 rounded-md shadow-lg border border-slate-300 font-black text-right">
                    <span className="block text-[11px] sm:text-xs text-blue-900 leading-tight">
                      {homeWon ? match.homeTeam.name : awayWon ? match.awayTeam.name : match.homeTeam.name}
                    </span>
                    <span className="block text-[8px] sm:text-[9px] text-slate-700 leading-tight font-bold">
                      {motto}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Poster Resolution Tag */}
            <div className={`text-xs mt-3 font-mono flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Eye size={13} className="text-blue-500" />
              <span>
                {aspectRatio === 'portrait'
                  ? (isRtl ? 'الأبعاد: 1200×1500px (4:5 إنستغرام / فيسبوك)' : 'Format : 1200×1500px (4:5 Portrait)')
                  : (isRtl ? 'الأبعاد: 1200×1200px (1:1 مربع احترافي)' : 'Format : 1200×1200px (1:1 Carré)')}
              </span>
            </div>
          </div>

          {/* Right: CUSTOMIZATION & ACTION CONTROLS */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Quick Actions Panel */}
            <div className={`p-4 rounded-2xl border space-y-3 ${panelSurface}`}>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>
                <Download size={14} />
                <span>{isRtl ? 'خيارات التصدير والمشاركة السريعة' : 'Exportation & Partage Rapide'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isRtl ? 'تحميل بوستر HD PNG' : 'Télécharger HD PNG'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={isExporting}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                  }`}
                >
                  {copiedSuccess ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  <span>{copiedSuccess ? (isRtl ? 'تم النسخ بنجاح!' : 'Copié !') : (isRtl ? 'نسخ الصورة' : 'Copier l’image')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Share2 size={15} />
                <span>{isRtl ? 'مشاركة النتيجة مع نص رسمي عبر واتساب' : 'Partager sur WhatsApp'}</span>
              </button>
            </div>

            {/* Customization Inputs */}
            <div className={`p-4 rounded-2xl border space-y-3.5 ${panelSurface}`}>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <Sliders size={14} />
                <span>{isRtl ? 'تخصيص نصوص وتصميم البوستر' : 'Personnalisation de l’Affiche'}</span>
              </h3>

              {/* Aspect Ratio Toggle */}
              <div>
                <label className={`text-[11px] font-bold block mb-1.5 ${labelText}`}>
                  {isRtl ? 'مقاس البوستر:' : 'Format d’image :'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('square')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                      aspectRatio === 'square'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    1:1 {isRtl ? 'مربع قياسي' : 'Carré'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('portrait')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                      aspectRatio === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    4:5 {isRtl ? 'عمودي سوشيال' : 'Portrait IG'}
                  </button>
                </div>
              </div>

              {/* Hashtag / Slogan */}
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                  {isRtl ? 'الهاشتاغ / الشعار الرئيسي:' : 'Hashtag / Slogan :'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${inputSurface}`}
                    placeholder="#معاً_نحو_الأفضل"
                  />
                  <Hash size={13} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>

              {/* Motto */}
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                  {isRtl ? 'شعار النادي / التوقيع:' : 'Devise de l’équipe :'}
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${inputSurface}`}
                />
              </div>

              {/* Competition & Round */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                    {isRtl ? 'اسم البطولة:' : 'Compétition :'}
                  </label>
                  <input
                    type="text"
                    value={competitionTitle}
                    onChange={(e) => setCompetitionTitle(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${inputSurface}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                    {isRtl ? 'الفئة والتاريخ:' : 'Catégorie & Date :'}
                  </label>
                  <input
                    type="text"
                    value={roundAndDate}
                    onChange={(e) => setRoundAndDate(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${inputSurface}`}
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                  {isRtl ? 'القاعة المغطاة / الملعب:' : 'Salle / Terrain :'}
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${inputSurface}`}
                />
              </div>

              {/* Theme & Ball Selector */}
              <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                    {isRtl ? 'قالب الخلفية:' : 'Thème :'}
                  </label>
                  <select
                    value={templateTheme}
                    onChange={(e) => setTemplateTheme(e.target.value as PosterTheme)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${inputSurface}`}
                  >
                    <option value="stadium">{isRtl ? 'أضواء القاعة الليلية' : 'Stadium Night'}</option>
                    <option value="handball_court">{isRtl ? 'باركيه كرة اليد' : 'Parquet Handball'}</option>
                    <option value="golden">{isRtl ? 'ذهبي فاخر (بطولات)' : 'Golden Champions'}</option>
                    <option value="midnight">{isRtl ? 'نيون منتصف الليل' : 'Midnight Cyber'}</option>
                  </select>
                </div>
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${labelText}`}>
                    {isRtl ? 'نوع الكرة والملعب:' : 'Terrain :'}
                  </label>
                  <select
                    value={ballType}
                    onChange={(e) => setBallType(e.target.value as 'court' | 'outdoor')}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${inputSurface}`}
                  >
                    <option value="court">{isRtl ? 'كرة اليد — قاعة الباركيه' : 'Handball — Parquet'}</option>
                    <option value="outdoor">{isRtl ? 'كرة اليد — ملعب خارجي' : 'Handball — Extérieur'}</option>
                  </select>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
