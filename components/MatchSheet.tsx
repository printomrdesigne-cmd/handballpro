import React, { useEffect, useState, useRef } from 'react';
import { MatchState, SanctionType, Player, Team, MatchEvent, MatchPeriod, AppLanguage } from '../types.ts';
import { Printer, Download, PenTool, Edit2, X, Save, Globe, MessageCircle, Share2, Copy, Check, Image as ImageIcon, Loader2, Smartphone, Maximize2, ZoomIn, ZoomOut, Upload, FileText, Paperclip, Trash2, ExternalLink } from 'lucide-react';
import { generateMatchSheetPDF } from '../utils/pdfGenerator.ts';
import { captureElementAsImage, shareMatchSheetImage, downloadImageFile, copyImageToClipboard } from '../utils/imageGenerator.ts';
import { SignaturePad } from './SignaturePad.tsx';
import { translations } from '../utils/translations.ts';

import { SheetSettings, getSheetSettings } from '../utils/sheetSettings.ts';
import { SettingsModal } from './SettingsModal.tsx';
import { Settings as SettingsIcon } from 'lucide-react';

// Force load fonts
const ensureFonts = () => {
  if (!document.querySelector('link[href*="Cairo"]')) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};

interface SheetHeaderProps {
  details: any;
  lang: AppLanguage;
  sheetSettings?: SheetSettings;
  onOpenSettings?: () => void;
}

const SheetHeader = ({ details, lang, sheetSettings, onOpenSettings }: SheetHeaderProps) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const effective = sheetSettings || getSheetSettings();

  const logoSrc = effective.logoUrl || '/logo_frmss.png';
  const mainTitleAr = effective.mainTitleAr || 'الجامعة الملكية المغربية\nللرياضة المدرسية';
  const mainTitleFr = effective.mainTitleFr || 'FÉDÉRATION ROYALE MAROCAINE\nDU SPORT SCOLAIRE';

  // Helper to clean empty or placeholder '-' values
  const cleanValue = (val?: string) => {
    if (!val) return '';
    const trimmed = String(val).trim();
    if (trimmed === '-' || trimmed === '—' || trimmed === '--') return '';
    return trimmed;
  };

  // If the user has saved custom settings, the sheet strictly adheres to what was entered in settings!
  const hasCustomSettings = typeof window !== 'undefined' && Boolean(localStorage.getItem('handball_sheet_custom_settings'));

  // Discard stale hardcoded values from old demo match state if they ever leak
  const rawAref = details.aref === 'عصبة الرباط سلا القنيطرة' ? '' : details.aref;
  const rawDirection = details.direction === 'الجامعة الملكية المغربية لكرة اليد' ? '' : details.direction;

  const leagueName = cleanValue(effective.league) || (!hasCustomSettings ? cleanValue(details.ligue) : '');
  const academyName = cleanValue(effective.academy) || (!hasCustomSettings ? cleanValue(rawAref) : '');
  const directionName = cleanValue(effective.direction) || (!hasCustomSettings ? cleanValue(rawDirection) : '');
  const competitionName = cleanValue(effective.competition) || cleanValue(details.competition) || t.sheetCompetition;

  const hasLeague = Boolean(leagueName);
  const hasAcademy = Boolean(academyName);
  const hasDirection = Boolean(directionName);
  const hasAnyRegionalInfo = hasLeague || hasAcademy || hasDirection;

  return (
    <div className="border-2 border-black mb-1 font-sans text-black relative group" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Quick edit button for header (hidden in print) */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          data-html2canvas-ignore="true"
          className="absolute -top-3.5 left-2 px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-md shadow flex items-center gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          title="تعديل الشعار والعناوين"
        >
          <SettingsIcon size={11} />
          <span>تعديل الشعار والعناوين</span>
        </button>
      )}

      {/* LOGOS & TITLES */}
      <div className="flex border-b-2 border-black h-20">
        {/* Side 1: Arabic Title */}
        <div className={`w-1/3 flex items-center justify-center text-center p-1 bg-white ${isRtl ? 'border-l-2' : 'border-r-2'} border-black`}>
          <h1 className="text-sm font-black leading-tight text-green-900 whitespace-pre-line" style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: 'normal' }}>
            {mainTitleAr}
          </h1>
        </div>

        {/* Center: Official or Custom Logo */}
        <div className="w-1/3 flex items-center justify-center p-1 bg-white overflow-hidden">
          <img
            src={logoSrc}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.weserv.nl/?url=https://tibuafrica.org/wp-content/uploads/2023/07/FRMSS.png&w=200&output=png';
            }}
            alt="Logo"
            className="h-16 max-w-full object-contain"
          />
        </div>

        {/* Side 2: French / International Title */}
        <div className={`w-1/3 flex items-center justify-center text-center p-1 bg-white ${isRtl ? 'border-r-2' : 'border-l-2'} border-black`}>
          <h2 className="text-[8px] font-black uppercase leading-relaxed text-green-900 whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: 'normal' }}>
            {mainTitleFr}
          </h2>
        </div>
      </div>

      {/* COMPETITION INFO BAR */}
      <div className="flex min-h-8 border-black text-white">
        {!hasAnyRegionalInfo ? (
          /* When neither League, Academy, nor Directorate is specified, stretch banner cleanly across full width without '-' */
          <div className="w-full flex items-center justify-center bg-green-700 print:bg-green-700 py-1.5 px-3 text-center">
            <span className="font-black text-xs sm:text-sm text-white drop-shadow-sm" style={{ letterSpacing: 'normal' }}>
              {competitionName} {details.categorie ? `— ${details.categorie}` : ''}
            </span>
          </div>
        ) : (
          <>
            {/* Info Box: Only show fields that are actually specified (No '-' dashes!) */}
            <div className={`w-[45%] flex flex-col justify-center px-2 py-0.5 text-[9px] font-bold bg-white text-black leading-tight gap-0.5 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black`} style={{ letterSpacing: 'normal' }}>
              {hasLeague && (
                <div className={`flex justify-between items-center ${hasAcademy || hasDirection ? 'border-b border-gray-300 pb-0.5' : ''}`}>
                  <span className="text-gray-700 font-bold">{t.league}:</span>
                  <span className="font-black uppercase truncate text-black">{leagueName}</span>
                </div>
              )}
              {hasAcademy && (
                <div className={`flex justify-between items-center ${hasDirection ? 'border-b border-gray-300 pb-0.5' : ''}`}>
                  <span className="text-gray-700 font-bold">{t.academy}:</span>
                  <span className="font-black uppercase truncate text-black">{academyName}</span>
                </div>
              )}
              {hasDirection && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-bold">{t.direction}:</span>
                  <span className="font-black uppercase truncate text-black">{directionName}</span>
                </div>
              )}
            </div>

            {/* Championship & Category Banner */}
            <div className="flex-1 flex items-center justify-center bg-green-700 print:bg-green-700 px-2 text-center">
              <span className="font-black text-xs sm:text-sm text-white drop-shadow-sm" style={{ letterSpacing: 'normal' }}>
                {competitionName} {details.categorie ? `— ${details.categorie}` : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MatchInfo = ({ details, lang }: { details: any; lang: AppLanguage }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="border-x-2 border-b-2 border-black mb-1 bg-white text-[9px] font-bold text-black" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex h-6 items-center divide-x divide-black text-center">
        <div className="flex-1 px-2 truncate flex items-center justify-center gap-1.5">
          <span className="underline text-blue-900 font-black">{t.venue}:</span> 
          <span className="text-black font-extrabold text-[10px]">{details.lieu || '-'}</span>
        </div>
        <div className="w-24 border-black flex flex-col justify-center bg-gray-50 print:bg-gray-50 h-full">
          <span className="leading-none text-black font-black">{details.date || '-'}</span>
        </div>
        <div className="w-16 border-black flex flex-col justify-center bg-gray-50 print:bg-gray-50 h-full">
          <span className="leading-none text-black font-black">{details.time || '-'}</span>
        </div>
        <div className="w-24 px-1 bg-yellow-400 print:bg-yellow-400 text-black font-black flex items-center justify-center h-full border-black text-xs">
          {t.matchNumber}: {details.numRencontre || '1'}
        </div>
      </div>
    </div>
  );
};

const ScoreTable = ({ match, lang }: { match: MatchState; lang: AppLanguage }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const hP1 = match.score.homeP1 > 0 ? match.score.homeP1 : (match.period !== MatchPeriod.FIRST_HALF ? match.score.homeP1 : '-');
  const aP1 = match.score.awayP1 > 0 ? match.score.awayP1 : (match.period !== MatchPeriod.FIRST_HALF ? match.score.awayP1 : '-');
  const hFT = match.score.homeFullTime !== undefined ? match.score.homeFullTime : (match.period === MatchPeriod.SECOND_HALF || match.period === MatchPeriod.FIRST_HALF ? match.score.home : '-');
  const aFT = match.score.awayFullTime !== undefined ? match.score.awayFullTime : (match.period === MatchPeriod.SECOND_HALF || match.period === MatchPeriod.FIRST_HALF ? match.score.away : '-');
  const isInOT = [MatchPeriod.OT1_H1, MatchPeriod.OT1_H2, MatchPeriod.OT2_H1, MatchPeriod.OT2_H2].includes(match.period);
  const hOT = match.score.homeOT !== undefined ? match.score.homeOT : (isInOT ? match.score.home : '-');
  const aOT = match.score.awayOT !== undefined ? match.score.awayOT : (isInOT ? match.score.away : '-');
  const isInOT2 = [MatchPeriod.OT2_H1, MatchPeriod.OT2_H2].includes(match.period);
  const hOT2 = match.score.homeOT2 !== undefined ? match.score.homeOT2 : (isInOT2 ? match.score.home : '-');
  const aOT2 = match.score.awayOT2 !== undefined ? match.score.awayOT2 : (isInOT2 ? match.score.away : '-');

  return (
    <div className="mb-1 w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      <table className="w-full border-2 border-black text-[9px] text-center table-fixed border-collapse bg-white shadow-sm">
        <thead>
          <tr className="h-5 text-white">
            <th rowSpan={2} className="border border-black w-24 bg-black print:bg-black text-center align-middle font-black">{t.teams}</th>
            <th colSpan={2} className="border border-black bg-black print:bg-black text-center align-middle">{t.half1}</th>
            <th colSpan={2} className="border border-black bg-black print:bg-black text-center align-middle">{t.finalScore}</th>
            <th colSpan={2} className="border border-black bg-black print:bg-black text-center align-middle">{t.extra1}</th>
            <th colSpan={2} className="border border-black bg-black print:bg-black text-center align-middle">{t.extra2}</th>
            <th colSpan={2} className="border border-black bg-black print:bg-black text-center align-middle">{t.sevenMeters}</th>
            <th colSpan={2} className="border border-black bg-blue-700 text-white w-20 print:bg-blue-700 text-center align-middle font-black">{t.totalScore}</th>
          </tr>
          <tr className="h-5 text-black font-black bg-gray-100 print:bg-gray-100">
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
            <th className="border border-black text-center align-middle">A</th>
            <th className="border border-black text-center align-middle">B</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-8 font-black text-xs text-black">
            <td className="border border-black text-[9px] bg-yellow-100 print:bg-yellow-100 text-black text-center align-middle">{t.scoreRow}</td>
            <td className="border border-black text-black text-center align-middle">{hP1}</td> 
            <td className="border border-black text-black text-center align-middle">{aP1}</td>
            <td className="border border-black text-black text-center align-middle">{hFT}</td> 
            <td className="border border-black text-black text-center align-middle">{aFT}</td>
            <td className="border border-black text-black text-center align-middle">{hOT}</td> 
            <td className="border border-black text-black text-center align-middle">{aOT}</td>
            <td className="border border-black text-black text-center align-middle">{hOT2}</td> 
            <td className="border border-black text-black text-center align-middle">{aOT2}</td>
            <td className="border border-black text-black text-center align-middle">{match.score.homePenalties > 0 || match.score.awayPenalties > 0 ? match.score.homePenalties : '-'}</td> 
            <td className="border border-black text-black text-center align-middle">{match.score.homePenalties > 0 || match.score.awayPenalties > 0 ? match.score.awayPenalties : '-'}</td>
            <td className="border border-black bg-yellow-300 print:bg-yellow-300 text-sm text-black text-center align-middle">{match.score.home + match.score.homePenalties}</td>
            <td className="border border-black bg-yellow-300 print:bg-yellow-300 text-sm text-black text-center align-middle">{match.score.away + match.score.awayPenalties}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

interface TeamRosterProps {
  team: Team;
  letter: string;
  onSign: (role: 'captain' | 'coach') => void;
  matchEvents: MatchEvent[];
  teamSide: 'home' | 'away';
  onEditReservation: () => void;
  suspensionDuration: number;
  lang: AppLanguage;
}

const TeamRoster = ({
  team,
  letter,
  onSign,
  matchEvents,
  teamSide,
  onEditReservation,
  suspensionDuration,
  lang
}: TeamRosterProps) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const hasSanction = (p: Player, type: SanctionType) => p.sanctions.some(s => s.type === type);
  const MIN_ROWS = 14;
  const filledPlayers = [...team.players];
  while (filledPlayers.length < MIN_ROWS) {
    filledPlayers.push(null as any);
  }

  const timeouts = matchEvents
    .filter(e => e.type === 'TIMEOUT' && e.team === teamSide)
    .sort((a, b) => a.timestamp - b.timestamp);

  const getTimeoutTime = (index: number) => {
    if (timeouts[index]) return timeouts[index].timeStr;
    return '';
  };

  const suspensionLabel = suspensionDuration === 60 ? "1'" : "2'";
  const timeoutAbbr = isRtl ? 'و.م' : 'TM';

  const rows = filledPlayers.map((p, i) => {
    return (
      <tr key={i} className="h-[28.5px] text-center leading-none text-black hover:bg-gray-50 transition-colors">
        <td className="border-l border-b border-black font-black text-xs bg-gray-50 print:bg-gray-50 text-black text-center align-middle" style={{ letterSpacing: 'normal' }}>
          {p?.number || ''}
        </td>
        <td className="border-l border-b border-black font-sans text-[8.5px] font-bold text-black text-center align-middle truncate px-0.5" style={{ letterSpacing: 'normal' }}>
          {p?.licence || ''}
        </td>
        {/* PLAYER NAME CELL: Generously wide, bold font, intact cursive script */}
        <td 
          className={`border-l border-b border-black px-1.5 font-bold text-black align-middle ${isRtl ? 'text-right' : 'text-left'}`}
          style={{ letterSpacing: 'normal', fontFamily: "'Cairo', 'Inter', sans-serif" }}
        >
          {p ? (
            <div className="flex items-center justify-between w-full gap-1 min-w-0">
              <span 
                className="truncate flex-1 font-extrabold text-[11px] leading-tight text-black" 
                style={{ 
                  letterSpacing: 'normal', 
                  fontFamily: "'Cairo', 'Inter', sans-serif" 
                }} 
                title={p.name}
              >
                {p.name}
              </span>
              <div className="flex gap-0.5 shrink-0">
                {p.isCaptain && <span className="font-black text-[8px] bg-black text-white px-1 py-0.5 rounded-sm" title="Capitaine">C</span>}
                {p.isGoalkeeper && <span className="font-black text-[8px] border border-black px-1 py-0.5 rounded-sm" title="Gardien">G</span>}
              </div>
            </div>
          ) : ''}
        </td>
        <td className="border-l border-b border-black font-black text-xs bg-gray-50 print:bg-gray-50 text-black text-center align-middle" style={{ letterSpacing: 'normal' }}>
          {p && p.goals > 0 ? p.goals : ''}
        </td>
        <td className="border-l border-b border-black font-black text-black text-center align-middle">
          {p && hasSanction(p, SanctionType.YELLOW) ? 'X' : ''}
        </td>
        <td className="border-l border-b border-black text-[9px] font-bold text-black text-center align-middle" style={{ letterSpacing: 'normal' }}>
          {(() => {
            const count = p?.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length || 0;
            return count > 0 ? (<div className="font-black text-xs text-black">{count}*{suspensionLabel}</div>) : null;
          })()}
        </td>
        <td className="border-l border-b border-black font-black text-black text-center align-middle">
          {p && hasSanction(p, SanctionType.RED) ? 'X' : ''}
        </td>
        <td className="border-b border-black font-black text-black text-center align-middle">
          {p && hasSanction(p, SanctionType.BLUE) ? 'X' : ''}
        </td>
      </tr>
    );
  });

  return (
    <div className="w-1/2 flex flex-col h-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Team Header & Timeouts */}
      <div 
        className="flex items-center justify-between border-2 border-black px-2 h-[36px] mb-0.5"
        style={{ backgroundColor: team.color }}
      >
        <div className="font-black text-base flex items-center gap-2 flex-1 min-w-0 pr-1">
          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs border-2 border-black shadow-sm flex-shrink-0 font-bold">{letter}</div>
          <span className="truncate flex-1 text-white mix-blend-difference drop-shadow-md text-sm sm:text-base" style={{ letterSpacing: 'normal' }}>{team.name}</span>
        </div>
        <div className="flex border border-black bg-white text-black text-[8.5px] h-7 shadow-sm items-center flex-shrink-0 rounded-sm overflow-hidden font-bold" style={{ letterSpacing: 'normal' }}>
          <div className="px-1 border-r border-black flex items-center bg-gray-100 font-black text-black h-full">{timeoutAbbr} 1</div>
          <div className="w-7 border-r border-black flex items-center justify-center font-bold text-blue-900 h-full text-[9.5px]">{getTimeoutTime(0)}</div>
          <div className="px-1 border-r border-black flex items-center bg-gray-100 font-black text-black h-full">{timeoutAbbr} 2</div>
          <div className="w-7 border-r border-black flex items-center justify-center font-bold text-blue-900 h-full text-[9.5px]">{getTimeoutTime(1)}</div>
          <div className="px-1 border-r border-black flex items-center bg-gray-100 font-black text-black h-full">{timeoutAbbr} 3</div>
          <div className="w-7 flex items-center justify-center font-bold text-blue-900 h-full text-[9.5px]">{getTimeoutTime(2)}</div>
        </div>
      </div>

      {/* Roster Table with Defined Column Allocation */}
      <div className="flex-1 border-2 border-black bg-white overflow-hidden">
        <table className="w-full border-collapse table-fixed h-full" style={{ letterSpacing: 'normal' }}>
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '49%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '5.5%' }} />
          </colgroup>
          <thead className="bg-gray-100 print:bg-gray-100 text-[8.5px] uppercase font-black text-black" style={{ letterSpacing: 'normal' }}>
            <tr className="h-[28.5px] border-b-2 border-black">
              <th className="border-l border-black text-black text-center align-middle">{isRtl ? 'رقم' : 'N°'}</th>
              <th className="border-l border-black text-black text-center align-middle">{isRtl ? 'رخصة' : 'Licence'}</th>
              <th className={`border-l border-black text-black align-middle px-2 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'الاسم الكامل للّاعب' : 'Nom & Prénom du Joueur'}</th>
              <th className="border-l border-black text-black text-center align-middle">{isRtl ? 'أهداف' : 'Buts'}</th>
              <th className="border-l border-black bg-yellow-200 print:bg-yellow-200 text-black text-center align-middle">{isRtl ? 'إنذار' : 'Avert.'}</th>
              <th className="border-l border-black text-black text-center align-middle">{isRtl ? '2 د' : '2 min'}</th>
              <th className="border-l border-black bg-red-200 print:bg-red-200 text-black text-center align-middle">{isRtl ? 'طرد' : 'Disq.'}</th>
              <th className="bg-blue-200 print:bg-blue-200 text-black text-center align-middle">{isRtl ? 'تقرير' : 'Rapp.'}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      {/* Protests / Reservations Row */}
      <div 
        className="mt-0.5 border-2 border-black bg-white text-black flex items-stretch group cursor-pointer relative" 
        style={{ height: '38px' }} 
        onClick={onEditReservation}
      >
        <div className={`w-20 bg-gray-100 print:bg-gray-100 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black flex items-center justify-center font-black text-[9px] text-black shrink-0`}>
          {t.protests}
        </div>
        <div className="flex-1 px-2 py-1 font-mono text-[9px] whitespace-pre-wrap leading-tight overflow-hidden">
          {team.reservations || t.noProtests}
        </div>
        <div data-html2canvas-ignore="true" className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 bottom-0 w-8 flex items-center justify-center bg-blue-500/5 hover:bg-blue-500/10 transition-opacity print:hidden`}>
          <Edit2 size={12} className="text-blue-600 opacity-50 hover:opacity-100" />
        </div>
      </div>

      {/* Team Official / Coach Row */}
      <div 
        className="mt-0.5 border-2 border-black bg-white text-black h-[36px] flex items-center group cursor-pointer" 
        onClick={() => onSign('coach')}
      >
        <div className={`w-20 bg-blue-50 print:bg-blue-50 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black h-full flex items-center justify-center font-black text-[9px] text-blue-900 no-underline shrink-0`}>
          {t.teamOfficial}
        </div>
        <div className={`flex-1 px-2 font-bold text-[10px] truncate ${isRtl ? 'border-l-2' : 'border-r-2'} border-black text-center flex items-center justify-center gap-2 relative h-full min-w-0`}>
          <span className="truncate">{team.coach.name || '-'}</span>
          {team.signatures?.coach && (
            <img src={team.signatures.coach} alt="Coach Sig" className={`absolute ${isRtl ? 'left-1' : 'right-1'} top-0 h-full w-auto opacity-80 mix-blend-multiply`} />
          )}
          <div data-html2canvas-ignore="true" className="absolute inset-0 bg-blue-500/5 hover:bg-blue-500/10 transition-opacity print:hidden flex items-center justify-center">
            <PenTool size={14} className="text-blue-600 opacity-50 hover:opacity-100" />
          </div>
        </div>
        <div className="w-[8.5%] border-l border-black h-full flex items-center justify-center font-black text-xs bg-gray-50 shrink-0"></div>
        <div className="w-[5.5%] border-l border-black h-full flex items-center justify-center font-black text-xs bg-yellow-100 print:bg-yellow-100 shrink-0">
          {team.coach.sanctions.some(s => s.type === SanctionType.YELLOW) ? 'X' : ''}
        </div>
        <div className="w-[6%] border-l border-black h-full flex items-center justify-center text-xs font-bold shrink-0">
          {team.coach.sanctions.some(s => s.type === SanctionType.TWO_MINUTES) ? suspensionLabel : ''}
        </div>
        <div className="w-[5.5%] border-l border-black h-full flex items-center justify-center font-black text-xs bg-red-100 print:bg-red-100 shrink-0">
          {team.coach.sanctions.some(s => s.type === SanctionType.RED) ? 'X' : ''}
        </div>
        <div className="w-[5.5%] h-full flex items-center justify-center font-black text-xs bg-blue-100 print:bg-blue-100 shrink-0">
          {team.coach.sanctions.some(s => s.type === SanctionType.BLUE) ? 'X' : ''}
        </div>
      </div>
    </div>
  );
};

const GoalsLog = ({ team, events, side, lang }: { team: Team; events: MatchEvent[]; side: 'home' | 'away'; lang: AppLanguage }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const goals = events.filter(e => e.type === 'GOAL' && e.team === side).sort((a, b) => a.timestamp - b.timestamp);
  const getPlayerNumber = (playerId?: string) => {
    if (!playerId) return '';
    return team.players.find(p => p.id === playerId)?.number || '';
  };

  return (
    <div className="mt-0.5 flex border-2 border-black bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex-1">
        <table className="w-full h-full border-collapse table-fixed">
          <tbody>
            {[0, 1, 2, 3, 4].map(row => (
              <tr key={row} className="h-[25px]">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(col => {
                  const goalIndex = row * 12 + col;
                  const goal = goals[goalIndex];
                  return (
                    <td key={col} className="border border-black text-center align-middle relative p-0 h-[25px]">
                      <span className={`absolute top-[0.5px] ${isRtl ? 'left-[1px]' : 'right-[1px]'} text-[5px] text-gray-400 font-sans leading-none z-0`}>{goalIndex + 1}</span>
                      <span className="relative z-10 text-[10px] font-black leading-none text-black w-full h-full flex items-center justify-center">
                        {goal ? getPlayerNumber(goal.playerId) : ''}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`w-12 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black flex items-center justify-center bg-gray-50 print:bg-gray-50`}>
        <div className="text-[7.5px] font-black text-center leading-tight -rotate-90 whitespace-nowrap">
          {t.goalsSequence}
        </div>
      </div>
    </div>
  );
};

export const MatchSheet: React.FC<{
  match: MatchState;
  onUpdate: (m: MatchState) => void;
  lang?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  isAccountActive?: boolean;
}> = ({ match, onUpdate, lang = 'ar', onLanguageChange, isAccountActive = false }) => {
  useEffect(() => { ensureFonts(); }, []);

  const [currentLang, setCurrentLang] = useState<AppLanguage>(lang);
  useEffect(() => { setCurrentLang(lang); }, [lang]);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const [signatureModal, setSignatureModal] = useState<{ open: boolean; title: string; onSave: (data: string) => void; }>({ open: false, title: '', onSave: () => {} });
  const [reservationModal, setReservationModal] = useState<{ open: boolean; team: 'home' | 'away' | null; text: string; }>({ open: false, team: null, text: '' });
  const [reportModal, setReportModal] = useState<{ open: boolean; text: string; }>({ open: false, text: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{ blob: Blob; dataUrl: string; filename: string } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const cleanHome = match.homeTeam.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim();
  const cleanAway = match.awayTeam.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim();
  const imageFileName = `ورقة_مباراة_${cleanHome}_ضد_${cleanAway}.png`;

  const winnerName = match.score.home + match.score.homePenalties > match.score.away + match.score.awayPenalties
    ? match.homeTeam.name 
    : match.score.away + match.score.awayPenalties > match.score.home + match.score.homePenalties
    ? match.awayTeam.name 
    : t.matchDraw;

  // Viewport & Mobile Auto-Scale State
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => 
    typeof window !== 'undefined' ? window.innerWidth : 800
  );
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const [customScale, setCustomScale] = useState<number | null>(null);

  // Custom Logo and Titles Settings
  const [sheetSettings, setSheetSettings] = useState<SheetSettings>(() => getSheetSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSheetSettings(e.detail);
      } else {
        setSheetSettings(getSheetSettings());
      }
    };
    window.addEventListener('sheet-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('sheet-settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        setContainerWidth(viewportRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SHEET_BASE_WIDTH = 794;
  const SHEET_BASE_HEIGHT = 1123;

  // Available width on screen (accounting for padding on phone)
  const availableWidth = Math.max(280, containerWidth - (containerWidth < 640 ? 4 : 16));
  const autoFitScale = availableWidth < SHEET_BASE_WIDTH ? availableWidth / SHEET_BASE_WIDTH : 1;
  
  // Effective scale factor for on-screen viewport
  const effectiveScale = 
    customScale !== null 
    ? customScale 
    : zoomMode === 'fit' 
    ? autoFitScale 
    : 1;

  const isScaledDown = effectiveScale < 0.99;

  const handleEditReservation = (team: 'home' | 'away') => {
    const currentText = team === 'home' ? match.homeTeam.reservations : match.awayTeam.reservations;
    setReservationModal({ open: true, team, text: currentText || '' });
  };

  const saveReservation = () => {
    if (reservationModal.team) {
      const newMatch = { ...match };
      if (reservationModal.team === 'home') newMatch.homeTeam.reservations = reservationModal.text;
      else newMatch.awayTeam.reservations = reservationModal.text;
      onUpdate(newMatch);
      setReservationModal({ ...reservationModal, open: false });
    }
  };

  const saveReport = () => {
    const newMatch = { ...match };
    newMatch.report = reportModal.text;
    onUpdate(newMatch);
    setReportModal({ ...reportModal, open: false });
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await document.fonts.ready;
      await generateMatchSheetPDF('match-sheet-content', match.homeTeam.name, match.awayTeam.name, currentLang);
    } catch (e) {
      console.error('PDF generation error', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsAppImage = async () => {
    try {
      setIsCapturingImage(true);
      const res = await captureElementAsImage('match-sheet-content');
      if (!res) {
        alert(currentLang === 'ar' ? 'تعذر إنشاء صورة ورقة المباراة، يرجى المحاولة مرة أخرى' : 'Impossible de générer l\'image');
        return;
      }
      setCapturedImage({ blob: res.blob, dataUrl: res.dataUrl, filename: imageFileName });

      // Attempt native Web Share API (opens WhatsApp directly on mobile if supported)
      const didShare = await shareMatchSheetImage({
        imageBlob: res.blob,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        scoreHome: match.score.home + match.score.homePenalties,
        scoreAway: match.score.away + match.score.awayPenalties,
        winnerName,
        date: match.details?.date,
        lang: currentLang
      });

      // Always open modal to allow downloading, copying, or re-sharing
      setShowWhatsAppModal(true);
    } catch (err) {
      console.error('Error capturing image for WhatsApp', err);
      alert(currentLang === 'ar' ? 'حدث خطأ أثناء إعداد صورة ورقة المباراة' : 'Erreur lors de la capture de l\'image');
    } finally {
      setIsCapturingImage(false);
    }
  };

  const handleDownloadDirectImage = async () => {
    try {
      setIsCapturingImage(true);
      await document.fonts.ready;
      const res = await captureElementAsImage('match-sheet-content');
      if (res) {
        downloadImageFile(res.blob, imageFileName);
      } else {
        alert(currentLang === 'ar' ? 'تعذر إنشاء الصورة، يرجى المحاولة مرة أخرى' : 'Échec de la capture');
      }
    } catch (e) {
      console.error('Direct image download failed', e);
    } finally {
      setIsCapturingImage(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedDoc, setAttachedDoc] = useState<{ name: string; type: 'image' | 'pdf'; dataUrl: string; size: string } | null>(() => {
    try {
      const stored = localStorage.getItem(`match_doc_${match.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showDocModal, setShowDocModal] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert(currentLang === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 15 ميغابايت)' : 'Fichier trop volumineux (max 15 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const doc = {
        name: file.name,
        type: (file.type.includes('pdf') || file.name.endsWith('.pdf')) ? ('pdf' as const) : ('image' as const),
        dataUrl,
        size: sizeStr
      };
      setAttachedDoc(doc);
      try {
        localStorage.setItem(`match_doc_${match.id}`, JSON.stringify(doc));
      } catch (err) {
        console.warn('Could not persist doc to localStorage', err);
      }
      setShowDocModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = () => {
    setAttachedDoc(null);
    try {
      localStorage.removeItem(`match_doc_${match.id}`);
    } catch {}
    setShowDocModal(false);
  };

  const handleDownloadCapturedImage = () => {
    if (!capturedImage) return;
    downloadImageFile(capturedImage.blob, capturedImage.filename);
  };

  const handleCopyCapturedImage = async () => {
    if (!capturedImage) return;
    const ok = await copyImageToClipboard(capturedImage.blob);
    if (ok) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } else {
      alert(currentLang === 'ar' ? 'متصفحك لا يدعم نسخ الصور مباشرة، يمكنك استخدام زر التحميل أو المشاركة' : 'La copie directe n\'est pas supportée par ce navigateur');
    }
  };

  const handleOpenWhatsAppTextSummary = () => {
    const summaryText = currentLang === 'ar'
      ? `🤾‍♂️ *ورقة التحكيم الرسمية لمباراة كرة اليد*\n🏆 *${match.homeTeam.name}* (${match.score.home + match.score.homePenalties}) 🆚 (${match.score.away + match.score.awayPenalties}) *${match.awayTeam.name}*\n🥇 النتيجة / الفائز: *${winnerName}*\n📅 التاريخ: ${match.details?.date || 'اليوم'}\n🏟️ القاعة / الملعب: ${match.details?.lieu || 'غير محدد'}\n🏷️ الفئة: ${match.details?.categorie || 'عام'}\n\n📄 تم توثيق ورقة المباراة الرسمية FRMSS بنجاح عبر تطبيق *HandballScore Pro*.`
      : `🤾‍♂️ *Feuille de Match Officielle - Handball*\n🏆 *${match.homeTeam.name}* (${match.score.home + match.score.homePenalties}) 🆚 (${match.score.away + match.score.awayPenalties}) *${match.awayTeam.name}*\n🥇 Résultat: *${winnerName}*\n📅 Date: ${match.details?.date || 'Aujourd\'hui'}\n🏟️ Lieu: ${match.details?.lieu || '-'}\n🏷️ Catégorie: ${match.details?.categorie || '-'}\n\n📄 Feuille de match officielle générée par *HandballScore Pro*.`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  const openSignature = (title: string, onSave: (data: string) => void) => {
    setSignatureModal({ open: true, title, onSave });
  };

  const handleTeamSign = (team: 'home' | 'away', role: 'captain' | 'coach') => {
    const teamName = team === 'home' ? match.homeTeam.name : match.awayTeam.name;
    const roleName = role === 'captain' ? t.captain : t.coach;
    openSignature(`${t.signatureOf} ${roleName} — ${teamName}`, (data) => {
      const newMatch = { ...match };
      const target = team === 'home' ? newMatch.homeTeam : newMatch.awayTeam;
      if (!target.signatures) target.signatures = {};
      target.signatures[role] = data;
      onUpdate(newMatch);
    });
  };

  const handleOfficialSign = (role: 'referee1' | 'referee2' | 'timer' | 'secretary') => {
    let roleName = '';
    if (role === 'referee1') roleName = t.referee1;
    if (role === 'referee2') roleName = t.referee2;
    if (role === 'timer') roleName = t.timekeeper;
    if (role === 'secretary') roleName = t.scorekeeper;
    openSignature(`${t.signatureOf} ${roleName}`, (data) => {
      const newMatch = { ...match };
      if (!newMatch.officials.signatures) newMatch.officials.signatures = {};
      newMatch.officials.signatures[role] = data;
      onUpdate(newMatch);
    });
  };

  const toggleLanguage = (newLang: AppLanguage) => {
    setCurrentLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
  };

  return (
    <div className="bg-slate-200 min-h-screen p-1.5 sm:p-4 font-sans text-black print:p-0 print:bg-white flex flex-col items-center">
      {/* Hidden file input for uploading match sheet as image or PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Controls Bar (hidden during printing/exporting) */}
      <div className="w-full max-w-5xl mb-2 flex flex-wrap justify-between items-center gap-2 print:hidden px-1">
        <div></div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Dedicated Match Sheet & Logo Settings Button */}
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs sm:text-sm flex gap-1.5 items-center shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 border border-blue-400/30"
            title={currentLang === 'ar' ? 'إعدادات ورقة المباراة، الشعار، الأكاديمية والمديرية' : 'Paramètres feuille & Logo'}
          >
            <SettingsIcon size={16} />
            <span>{currentLang === 'ar' ? 'إعدادات ورقة التحكيم والشعار' : 'Paramètres'}</span>
          </button>

          {/* 2. Direct Download as Image (PNG) */}
          <button 
            onClick={handleDownloadDirectImage} 
            disabled={isCapturingImage}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs sm:text-sm flex gap-1.5 items-center shadow-lg shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            title="تحميل ورقة المباراة كصورة PNG عالية الدقة"
          >
            {isCapturingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            <span>{currentLang === 'ar' ? 'حفظ كصورة' : 'Image PNG'}</span>
          </button>



          {/* 4. Send via WhatsApp / Image Share */}
          <button 
            onClick={handleShareWhatsAppImage} 
            disabled={isCapturingImage}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm flex gap-1.5 items-center shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            title="إرسال ورقة المباراة كصورة عبر واتساب"
          >
            <MessageCircle size={16} />
            <span>{currentLang === 'ar' ? 'مشاركة واتساب' : 'WhatsApp'}</span>
          </button>

          {/* 5. Upload external paper sheet or signed document (Image or PDF) */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs sm:text-sm flex gap-1.5 items-center shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="رفع ورقة مباراة أو وثيقة موقعة (صورة أو PDF) وإرفاقها بالمباراة"
          >
            <Upload size={15} />
            <span>{attachedDoc ? (currentLang === 'ar' ? 'تغيير الوثيقة المرفقة' : 'Changer doc') : (currentLang === 'ar' ? 'رفع وثيقة (صورة/PDF)' : 'Téléverser doc')}</span>
          </button>

          {attachedDoc && (
            <button 
              onClick={() => setShowDocModal(true)} 
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex gap-1.5 items-center shadow-md transition-all cursor-pointer animate-pulse"
              title="معاينة الوثيقة المرفقة"
            >
              <Paperclip size={15} />
              <span>{currentLang === 'ar' ? 'عرض المرفق' : 'Voir doc'}</span>
            </button>
          )}

          {/* 6. Print Button */}
          <button 
            onClick={handlePrint} 
            className="px-3 py-2 bg-black hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm flex gap-1.5 items-center shadow-lg transition-all cursor-pointer hover:scale-105"
            title="طباعة ورقة المباراة A4"
          >
            <Printer size={16}/> {t.printBtn}
          </button>

          {/* Language Switcher on Sheet Toolbar */}
          <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-sm text-xs font-bold">
            <Globe size={14} className="text-slate-500 mx-1.5" />
            <button
              onClick={() => toggleLanguage('ar')}
              className={`px-2 py-1 rounded-lg transition-all ${currentLang === 'ar' ? 'bg-blue-600 text-white font-black' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              العربية
            </button>
            <button
              onClick={() => toggleLanguage('fr')}
              className={`px-2 py-1 rounded-lg transition-all ${currentLang === 'fr' ? 'bg-blue-600 text-white font-black' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              FR
            </button>
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-2 py-1 rounded-lg transition-all ${currentLang === 'en' ? 'bg-blue-600 text-white font-black' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fit & Zoom Controls Bar */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-800 px-3 py-2 rounded-2xl shadow-sm mb-3 print:hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Smartphone size={15} className="text-blue-600" />
            <span>{currentLang === 'ar' ? 'عرض شاشة الهاتف:' : 'Affichage mobile:'}</span>
          </span>

          <button
            onClick={() => { setZoomMode('fit'); setCustomScale(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              zoomMode === 'fit' && customScale === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title="ملاءمة ورقة المباراة كاملة في حدود جوانب شاشة الهاتف"
          >
            <Maximize2 size={13} />
            <span>{currentLang === 'ar' ? 'ملاءمة الشاشة (كاملة)' : 'Ajuster à l\'écran'}</span>
          </button>

          <button
            onClick={() => { setZoomMode('actual'); setCustomScale(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              (zoomMode === 'actual' || customScale === 1)
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title="عرض بالحجم الفعلي 100% مع إمكانية التمرير"
          >
            <ZoomIn size={13} />
            <span>{currentLang === 'ar' ? 'الحجم الفعلي (100%)' : 'Taille réelle (100%)'}</span>
          </button>
        </div>

        {/* Zoom adjuster */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = Math.max(0.35, effectiveScale - 0.1);
              setCustomScale(parseFloat(next.toFixed(2)));
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
            title="تصغير"
          >
            <ZoomOut size={14} />
          </button>

          <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg min-w-[42px] text-center">
            {Math.round(effectiveScale * 100)}%
          </span>

          <button
            onClick={() => {
              const next = Math.min(1.5, effectiveScale + 0.1);
              setCustomScale(parseFloat(next.toFixed(2)));
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
            title="تكبير"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* A4 Sheet Container with Mobile Viewport Scaler */}
      <div 
        ref={viewportRef}
        className="w-full flex flex-col items-center justify-start print:block print:w-auto overflow-hidden print:overflow-visible"
      >
        <div 
          className="sheet-viewport-wrapper relative transition-all duration-200 print:w-[210mm] print:h-[297mm] print:overflow-visible print:m-0"
          style={
            isScaledDown
              ? {
                  width: `${Math.round(SHEET_BASE_WIDTH * effectiveScale)}px`,
                  height: `${Math.round(SHEET_BASE_HEIGHT * effectiveScale)}px`,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  margin: '0 auto',
                }
              : effectiveScale > 1 || zoomMode === 'actual'
              ? {
                  maxWidth: '100%',
                  overflowX: 'auto',
                  margin: '0 auto',
                }
              : {
                  margin: '0 auto',
                }
          }
        >
          <div 
            id="match-sheet-content" 
            ref={sheetRef}
            className="w-[210mm] min-h-[296mm] max-w-[210mm] bg-white p-[5mm] shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] box-border flex flex-col relative justify-between border border-slate-300 print:border-none print:transform-none shrink-0"
            style={{ 
              fontFamily: currentLang === 'ar' ? "'Cairo', sans-serif" : "'Inter', -apple-system, sans-serif",
              transform: isScaledDown ? `scale(${effectiveScale})` : undefined,
              transformOrigin: 'top center',
            }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
        <div>
          <SheetHeader details={match.details} lang={currentLang} sheetSettings={sheetSettings} onOpenSettings={() => setShowSettingsModal(true)} />
          <MatchInfo details={match.details} lang={currentLang} />
          <ScoreTable match={match} lang={currentLang} />

          <div className="flex gap-1 mb-0.5 w-full">
            <TeamRoster 
              team={match.homeTeam} 
              letter="A" 
              teamSide="home" 
              matchEvents={match.events} 
              onSign={(role) => handleTeamSign('home', role)} 
              onEditReservation={() => handleEditReservation('home')} 
              suspensionDuration={match.config.suspensionDuration} 
              lang={currentLang}
            />
            <TeamRoster 
              team={match.awayTeam} 
              letter="B" 
              teamSide="away" 
              matchEvents={match.events} 
              onSign={(role) => handleTeamSign('away', role)} 
              onEditReservation={() => handleEditReservation('away')} 
              suspensionDuration={match.config.suspensionDuration} 
              lang={currentLang}
            />
          </div>

          <div className="flex gap-1 mb-0.5 w-full">
            <div className="flex-1"><GoalsLog team={match.homeTeam} events={match.events} side="home" lang={currentLang} /></div>
            <div className="flex-1"><GoalsLog team={match.awayTeam} events={match.events} side="away" lang={currentLang} /></div>
          </div>
        </div>

        {/* Bottom Section: Officials, Winner, and Report */}
        <div className="flex flex-col">
          <div className="border-2 border-black flex h-16 mb-0.5 bg-white flex-shrink-0">
            {/* Table Officials: Scorekeeper & Timer */}
            <div className={`flex-1 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black p-1 flex flex-col justify-between text-[8px] text-black`}>
              <div>
                <span className="font-black underline mb-1 block text-blue-900">{t.officials}</span>
                <div className="flex justify-between border-b border-dotted border-gray-400 mb-1 cursor-pointer group" onClick={() => handleOfficialSign('secretary')}>
                  <span className="truncate text-black font-bold">{t.scorekeeper}: {match.officials.secretary || '-'}</span> 
                  <span className="text-gray-600 italic relative w-12 text-center">
                    {match.officials.signatures?.secretary ? (
                      <img src={match.officials.signatures.secretary} className="absolute top-1/2 -translate-y-1/2 left-0 h-5 mix-blend-multiply" alt="Sig" />
                    ) : '(Sign)'}
                  </span>
                </div>
                <div className="flex justify-between cursor-pointer group" onClick={() => handleOfficialSign('timer')}>
                  <span className="truncate text-black font-bold">{t.timekeeper}: {match.officials.timer || '-'}</span> 
                  <span className="text-gray-600 italic relative w-12 text-center">
                    {match.officials.signatures?.timer ? (
                      <img src={match.officials.signatures.timer} className="absolute top-1/2 -translate-y-1/2 left-0 h-5 mix-blend-multiply" alt="Sig" />
                    ) : '(Sign)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Referees */}
            <div className={`flex-1 ${isRtl ? 'border-l-2' : 'border-r-2'} border-black p-1 flex flex-col justify-between text-[8px] text-black`}>
              <div>
                <span className="font-black underline mb-1 block text-blue-900">{t.referees}</span>
                <div className="flex justify-between border-b border-dotted border-gray-400 mb-1 cursor-pointer group" onClick={() => handleOfficialSign('referee1')}>
                  <span className="truncate text-black font-bold">1. {match.officials.referee1 || '-'}</span> 
                  <span className="text-gray-600 italic relative w-12 text-center">
                    {match.officials.signatures?.referee1 ? (
                      <img src={match.officials.signatures.referee1} className="absolute top-1/2 -translate-y-1/2 left-0 h-5 mix-blend-multiply" alt="Sig" />
                    ) : '(Sign)'}
                  </span>
                </div>
                <div className="flex justify-between cursor-pointer group" onClick={() => handleOfficialSign('referee2')}>
                  <span className="truncate text-black font-bold">2. {match.officials.referee2 || '-'}</span> 
                  <span className="text-gray-600 italic relative w-12 text-center">
                    {match.officials.signatures?.referee2 ? (
                      <img src={match.officials.signatures.referee2} className="absolute top-1/2 -translate-y-1/2 left-0 h-5 mix-blend-multiply" alt="Sig" />
                    ) : '(Sign)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Winner Box */}
            <div className="w-28 p-1 flex flex-col items-center justify-center bg-yellow-50 print:bg-yellow-50 shrink-0">
              <div className="bg-black text-white px-2 py-0.5 font-black mb-1 text-[8px] rounded-sm shadow-sm">
                {t.winningTeam}
              </div>
              <div className="flex items-center justify-center w-full h-full text-black">
                <span className="text-xs font-black text-center">{winnerName}</span>
              </div>
            </div>
          </div>

          {/* Report / Remarks Box */}
          <div 
            className="border-2 border-black bg-white relative group cursor-pointer min-h-[58px] h-auto flex flex-col" 
            onClick={() => setReportModal({ open: true, text: match.report || '' })}
          >
            <div className="bg-green-700 print:bg-green-700 text-white border-b border-black px-2 py-0.5 font-black text-[8px] flex-shrink-0">
              {t.refereeReport}
            </div>
            <div className="p-1 text-[9px] font-mono leading-tight whitespace-pre-wrap text-black flex-1">
              {match.report || t.nothingToReport}
            </div>
            <div data-html2canvas-ignore="true" className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 bottom-0 w-8 flex items-center justify-center bg-blue-500/5 hover:bg-blue-500/10 transition-opacity print:hidden`}>
              <Edit2 size={12} className="text-blue-600 opacity-50 hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          * { letter-spacing: normal !important; }
          .sheet-viewport-wrapper { width: 210mm !important; height: 297mm !important; max-width: none !important; overflow: visible !important; margin: 0 !important; display: block !important; }
          #match-sheet-content { position: static !important; width: 210mm !important; height: 297mm !important; max-width: none !important; transform: none !important; box-shadow: none !important; margin: 0 !important; padding: 5mm !important; }
          .diagonal-strike { background: linear-gradient(to top right, transparent 48%, black 49%, black 51%, transparent 52%); }
        }
      `}</style>

      {/* Signature Modal */}
      {signatureModal.open && (
        <SignaturePad 
          title={signatureModal.title} 
          onSave={signatureModal.onSave} 
          onClose={() => setSignatureModal(prev => ({ ...prev, open: false }))} 
        />
      )}

      {/* Team Protests / Reservations Modal */}
      {reservationModal.open && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-xl text-black">
                {t.editProtests}: {reservationModal.team === 'home' ? match.homeTeam.name : match.awayTeam.name}
              </h3>
              <button onClick={() => setReservationModal({ ...reservationModal, open: false })} className="p-2 hover:bg-slate-100 rounded-full text-black">
                <X size={24} />
              </button>
            </div>
            <textarea 
              autoFocus 
              className="w-full h-44 p-4 rounded-xl border-2 border-slate-200 outline-none text-base font-bold resize-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors" 
              placeholder={t.protests} 
              value={reservationModal.text} 
              onChange={e => setReservationModal({ ...reservationModal, text: e.target.value })}
            />
            <div className="flex gap-3">
              <button onClick={saveReservation} className="flex-1 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                <Save size={18} /> {t.saveProtests}
              </button>
              <button onClick={() => setReservationModal({ ...reservationModal, open: false })} className="py-3.5 px-6 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 border-2 border-slate-200">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Referee Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-xl text-black">{t.editReport}</h3>
              <button onClick={() => setReportModal({ ...reportModal, open: false })} className="p-2 hover:bg-slate-100 rounded-full text-black">
                <X size={24} />
              </button>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 font-bold border border-blue-100">
              {t.refereeReport}
            </div>
            <textarea 
              autoFocus 
              className="w-full h-44 p-4 rounded-xl border-2 border-slate-200 outline-none text-base font-bold resize-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors" 
              placeholder={t.refereeReport} 
              value={reportModal.text} 
              onChange={e => setReportModal({ ...reportModal, text: e.target.value })}
            />
            <div className="flex gap-3">
              <button onClick={saveReport} className="flex-1 py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                <Save size={18} /> {t.saveReport}
              </button>
              <button onClick={() => setReportModal({ ...reportModal, open: false })} className="py-3.5 px-6 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 border-2 border-slate-200">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Image Sharing Modal */}
      {showWhatsAppModal && capturedImage && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-xl max-h-[92vh] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {currentLang === 'ar' ? 'إرسال ورقة المباراة عبر واتساب' : 'Partager la Feuille de Match WhatsApp'}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500">
                    {match.homeTeam.name} ({match.score.home + match.score.homePenalties}) - ({match.score.away + match.score.awayPenalties}) {match.awayTeam.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Copied Toast Banner */}
            {copiedToast && (
              <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-3 rounded-2xl text-xs font-black flex items-center gap-2 animate-in zoom-in-95">
                <Check size={18} className="text-emerald-600 flex-shrink-0" />
                <span>{t.imageCopied}</span>
              </div>
            )}

            {/* Image Preview Box */}
            <div className="flex-1 overflow-y-auto bg-slate-100 rounded-2xl p-2 border border-slate-200 flex flex-col items-center">
              <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <ImageIcon size={12} />
                <span>{currentLang === 'ar' ? 'معاينة صورة ورقة المباراة الرسمية FRMSS عالية الدقة:' : 'Aperçu de la feuille de match officielle HD:'}</span>
              </div>
              <img 
                src={capturedImage.dataUrl} 
                alt="Aperçu Feuille de Match" 
                className="w-full max-h-[46vh] object-contain rounded-xl shadow-md border border-slate-300 bg-white"
              />
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 flex-shrink-0">
              {/* Button 1: Direct WhatsApp Native Share */}
              <button
                onClick={() => shareMatchSheetImage({
                  imageBlob: capturedImage.blob,
                  homeTeam: match.homeTeam.name,
                  awayTeam: match.awayTeam.name,
                  scoreHome: match.score.home + match.score.homePenalties,
                  scoreAway: match.score.away + match.score.awayPenalties,
                  winnerName,
                  date: match.details?.date,
                  lang: currentLang
                })}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Share2 size={16} />
                <span>{currentLang === 'ar' ? 'مشاركة الصورة عبر واتساب مباشرة' : 'Partager l\'image sur WhatsApp'}</span>
              </button>

              {/* Button 2: Copy image to clipboard */}
              <button
                onClick={handleCopyCapturedImage}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Copy size={16} />
                <span>{t.copyImage}</span>
              </button>

              {/* Button 3: Download PNG file */}
              <button
                onClick={handleDownloadCapturedImage}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={16} />
                <span>{t.downloadImage}</span>
              </button>

              {/* Button 4: Send text report via WhatsApp */}
              <button
                onClick={handleOpenWhatsAppTextSummary}
                className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle size={16} className="text-emerald-600" />
                <span>{currentLang === 'ar' ? 'إرسال تقرير المباراة نصياً' : 'Envoyer résumé texte WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal for Match Sheet & Custom Logo */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        lang={currentLang}
        isDarkMode={false}
        onSettingsSaved={(newSettings) => {
          setSheetSettings(newSettings);
          if (onUpdate && match) {
            onUpdate({
              ...match,
              details: {
                ...match.details,
                ligue: newSettings.league || '',
                aref: newSettings.academy || '',
                direction: newSettings.direction || '',
                competition: newSettings.competition || match.details.competition
              }
            });
          }
          setShowSettingsModal(false);
        }}
      />

      {/* Uploaded External Match Sheet Document Modal (Image or PDF) */}
      {showDocModal && attachedDoc && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  {attachedDoc.type === 'pdf' ? <FileText size={20} className="text-red-400" /> : <ImageIcon size={20} className="text-blue-400" />}
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {currentLang === 'ar' ? 'الوثيقة المرفقة بورقة المباراة' : 'Document joint'}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 truncate max-w-xs sm:max-w-md">
                    {attachedDoc.name} ({attachedDoc.size})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDocModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content view: PDF iframe or Image */}
            <div className="flex-1 overflow-auto bg-slate-100 rounded-2xl p-2 border border-slate-200 flex items-center justify-center min-h-[300px]">
              {attachedDoc.type === 'pdf' ? (
                <iframe 
                  src={attachedDoc.dataUrl} 
                  title="PDF Viewer" 
                  className="w-full h-[55vh] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <img 
                  src={attachedDoc.dataUrl} 
                  alt={attachedDoc.name} 
                  className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                />
              )}
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t flex-shrink-0">
              <button
                onClick={handleRemoveDoc}
                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={16} />
                <span>{currentLang === 'ar' ? 'حذف الوثيقة المرفقة' : 'Supprimer'}</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={attachedDoc.dataUrl}
                  download={attachedDoc.name}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Download size={16} />
                  <span>{currentLang === 'ar' ? 'تحميل الملف' : 'Télécharger'}</span>
                </a>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  {currentLang === 'ar' ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
