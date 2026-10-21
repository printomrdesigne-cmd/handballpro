import React, { useState, useEffect } from 'react';
import { Officials, MatchDetails, ScheduledMatch } from '../types.ts';
import { Palette, Link, Crown, Shield } from 'lucide-react';

interface PlayerInput {
  number: string;
  name: string;
  licence: string; // New field
  isCaptain: boolean;
  isGoalkeeper: boolean;
}

interface SetupFormProps {
  onStart: (
    h: string, hcoach: string, hast: string, hplayers: PlayerInput[], hcolor: string,
    a: string, acoach: string, aast: string, aplayers: PlayerInput[], acolor: string,
    halfDur: number, otDur: number, suspensionDur: number, off: Officials, det: MatchDetails
  ) => void;
  isDarkMode?: boolean;
  schedule?: ScheduledMatch[];
  initialMatch?: ScheduledMatch | null;
  initialDetails?: MatchDetails; // New prop for full details restoration
  // Props for restoring state when going back to settings
  initialHomePlayers?: PlayerInput[];
  initialAwayPlayers?: PlayerInput[];
  initialHomeCoach?: string;
  initialAwayCoach?: string;
  initialHomeAst?: string;
  initialAwayAst?: string;
  initialHomeColor?: string;
  initialAwayColor?: string;
  lang?: import('../types.ts').AppLanguage;
}

const PRESET_COLORS = [
  { name: 'Bleu Pro', hex: '#1d4ed8' },
  { name: 'Rouge Intense', hex: '#b91c1c' },
  { name: 'Vert Forêt', hex: '#15803d' },
  { name: 'Jaune Or', hex: '#eab308' },
  { name: 'Noir Pur', hex: '#0f172a' },
  { name: 'Orange Feu', hex: '#ea580c' },
  { name: 'Violet Royal', hex: '#7e22ce' },
  { name: 'Gris Béton', hex: '#4b5563' },
];

export const SetupForm: React.FC<SetupFormProps> = ({ 
  onStart, 
  isDarkMode = false, 
  schedule = [], 
  initialMatch = null,
  initialDetails,
  initialHomePlayers,
  initialAwayPlayers,
  initialHomeCoach,
  initialAwayCoach,
  initialHomeAst,
  initialAwayAst,
  initialHomeColor,
  initialAwayColor,
  lang = 'ar'
}) => {
  const isRtl = lang === 'ar';
  const tSetup = {
    ar: {
      title: 'إعداد المباراة',
      tabDetails: 'المقابلة',
      tabTeamA: 'فريق A',
      tabTeamB: 'فريق B',
      tabOfficials: 'الحكام',
      aref: 'الأكاديمية الجهوية (AREF)',
      direction: 'المديرية الإقليمية',
      matchNum: 'رقم اللقاء',
      stage: 'المرحلة (Etape)',
      category: 'الفئة',
      halfDuration: 'مدة الشوط (د)',
      otDuration: 'الشوط الإضافي (د)',
      suspensionTime: 'زمن المخالفة (الإقصاء المؤقت)',
      oneMin: '1 دقيقة',
      twoMin: '2 دقائق (Standard)',
      venue: 'مركز التباري',
      date: 'التاريخ',
      time: 'التوقيت',
      matchLink: 'رابط المقابلة (Live Stream/Video)',
      teamColor: 'لون الفريق (للخلفية في ورقة المباراة)',
      teamName: 'اسم الفريق',
      headCoach: 'المدرب الرئيسي',
      astCoach: 'مساعد المدرب',
      playerCount: 'العدد',
      ref1: 'الحكم 1',
      ref2: 'الحكم 2',
      timer: 'الميقاتي',
      secretary: 'المسجل',
      saveAndStart: 'حفظ وتوجه للملعب'
    },
    fr: {
      title: 'Configuration du Match',
      tabDetails: 'Match',
      tabTeamA: 'Équipe A',
      tabTeamB: 'Équipe B',
      tabOfficials: 'Officiels',
      aref: 'Académie Régionale (AREF)',
      direction: 'Direction Provinciale',
      matchNum: 'N° de Rencontre',
      stage: 'Étape de Compétition',
      category: 'Catégorie',
      halfDuration: 'Mi-temps (min)',
      otDuration: 'Prolongation (min)',
      suspensionTime: "Durée d'exclusion temporaire",
      oneMin: '1 minute',
      twoMin: '2 minutes (Standard)',
      venue: 'Lieu de la Rencontre',
      date: 'Date',
      time: 'Heure',
      matchLink: 'Lien Diffusion Direct / Vidéo',
      teamColor: "Couleur de l'équipe (feuille de match)",
      teamName: "Nom de l'équipe",
      headCoach: 'Entraîneur Principal',
      astCoach: 'Entraîneur Adjoint',
      playerCount: 'Effectif',
      ref1: 'Arbitre 1',
      ref2: 'Arbitre 2',
      timer: 'Chronométreur',
      secretary: 'Secrétaire',
      saveAndStart: 'Enregistrer et Aller au Terrain'
    },
    en: {
      title: 'Match Configuration',
      tabDetails: 'Match',
      tabTeamA: 'Team A',
      tabTeamB: 'Team B',
      tabOfficials: 'Officials',
      aref: 'Regional Academy (AREF)',
      direction: 'Provincial Directorate',
      matchNum: 'Match Number',
      stage: 'Competition Stage',
      category: 'Category',
      halfDuration: 'Half Duration (min)',
      otDuration: 'Extra Time (min)',
      suspensionTime: 'Suspension Duration',
      oneMin: '1 minute',
      twoMin: '2 minutes (Standard)',
      venue: 'Match Venue',
      date: 'Date',
      time: 'Time',
      matchLink: 'Live Stream / Video URL',
      teamColor: 'Team Color (Match Sheet)',
      teamName: 'Team Name',
      headCoach: 'Head Coach',
      astCoach: 'Assistant Coach',
      playerCount: 'Roster Count',
      ref1: 'Referee 1',
      ref2: 'Referee 2',
      timer: 'Timekeeper',
      secretary: 'Scorekeeper',
      saveAndStart: 'Save & Go to Court'
    }
  }[lang];
  // Initialisation avec des valeurs par défaut extraites de la feuille de match ou des props de restauration
  const [home, setHome] = useState(initialMatch?.homeTeam || 'اعدادية وادزا');
  const [homeCoach, setHomeCoach] = useState(initialHomeCoach || 'حسن بوقدير');
  const [homeAst, setHomeAst] = useState(initialHomeAst || 'عمر حماني');
  const [homeColor, setHomeColor] = useState(initialHomeColor || PRESET_COLORS[4].hex); // Noir
  const [homeCount, setHomeCount] = useState(initialHomePlayers ? initialHomePlayers.length : 14);
  const [homePlayers, setHomePlayers] = useState<PlayerInput[]>(initialHomePlayers || [
    { number: '3', name: 'رشيد المنصوري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '4', name: 'حمزة السعيدي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '7', name: 'يوسف البقالي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '9', name: 'ياسين الحضيكي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '14', name: 'سليمان الدبوزي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '18', name: 'نبيل الفاسي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '19', name: 'عدنان الزروالي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '21', name: 'عادل الصقلي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '25', name: 'أنس الرماح', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '27', name: 'فؤاد الكتاني', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '30', name: 'مصطفى البصري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '32', name: 'كمال بنموسى', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '33', name: 'خالد التازي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '36', name: 'طارق الحراق', licence: '', isCaptain: false, isGoalkeeper: false },
  ]);
  
  const [away, setAway] = useState(initialMatch?.awayTeam || 'إعدادية بدر');
  const [awayCoach, setAwayCoach] = useState(initialAwayCoach || 'سعيد الفكرود');
  const [awayAst, setAwayAst] = useState(initialAwayAst || 'زكرياء شرقي');
  const [awayColor, setAwayColor] = useState(initialAwayColor || PRESET_COLORS[2].hex); // Vert
  const [awayCount, setAwayCount] = useState(initialAwayPlayers ? initialAwayPlayers.length : 14);
  const [awayPlayers, setAwayPlayers] = useState<PlayerInput[]>(initialAwayPlayers || [
    { number: '3', name: 'وليد الطاهري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '5', name: 'عبد الإله الوردي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '6', name: 'رياض الشرقاوي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '8', name: 'عمر بوعزة', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '11', name: 'هشام العلوي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '12', name: 'مراد بنصالح', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '15', name: 'أشرف المرزوقي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '17', name: 'يوسف الناصري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '20', name: 'مروان الزموري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '22', name: 'أمين الشمسي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '23', name: 'نور الدين الأنصاري', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '29', name: 'إسماعيل الخرافي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '31', name: 'سفيان العلمي', licence: '', isCaptain: false, isGoalkeeper: false },
    { number: '34', name: 'سليم أمزيل', licence: '', isCaptain: false, isGoalkeeper: false },
  ]);

  const [halfDur, setHalfDur] = useState(20); 
  const [otDur, setOtDur] = useState(5);
  const [suspensionDur, setSuspensionDur] = useState(2); // 2 minutes or 1 minute
  const [activeTab, setActiveTab] = useState<'details' | 'teamA' | 'teamB' | 'officials'>('details');

  const [details, setDetails] = useState<MatchDetails>(initialDetails || {
    direction: '', 
    aref: '', 
    categorie: initialMatch?.category || 'ذكور U15 - البطولة المدرسية',
    ville: 'تاوريرت', 
    lieu: initialMatch?.lieu || 'القاعة المغطاة (تاوريرت)', 
    sexe: 'M', 
    numRencontre: '1',
    etape: '', 
    date: initialMatch?.date || new Date().toISOString().split('T')[0], 
    time: initialMatch?.time || '15:00',
    matchLink: ''
  });

  const [officials, setOfficials] = useState<Officials>({
    referee1: initialMatch?.officials.referee1 || 'رضوان الكوت', 
    referee2: initialMatch?.officials.referee2 || 'فريد بنقدور', 
    timer: initialMatch?.officials.timer || '', 
    secretary: initialMatch?.officials.secretary || '', 
    chefCentre: initialMatch?.officials.chefCentre || ''
  });

  // Ensure player lists update if counts change manually
  useEffect(() => {
    setHomePlayers(prev => {
      const next = [...prev];
      if (next.length < homeCount) {
        for (let i = next.length; i < homeCount; i++) {
            next.push({ number: '', name: '', licence: '', isCaptain: false, isGoalkeeper: false });
        }
      } else {
        return next.slice(0, homeCount);
      }
      return next;
    });
  }, [homeCount]);

  useEffect(() => {
    setAwayPlayers(prev => {
      const next = [...prev];
      if (next.length < awayCount) {
        for (let i = next.length; i < awayCount; i++) {
            next.push({ number: '', name: '', licence: '', isCaptain: false, isGoalkeeper: false });
        }
      } else {
        return next.slice(0, awayCount);
      }
      return next;
    });
  }, [awayCount]);

  const validateNumbers = (players: PlayerInput[], teamName: string) => {
    const numbers = new Set<string>();
    const filledPlayers = players.filter(p => p.number.trim() !== '');
    
    // Check minimum players
    if (filledPlayers.length < 5) {
        alert(`تنبيه: عدد اللاعبين المسجلين في فريق ${teamName} أقل من الحد الأدنى (5). المرجو إضافة لاعبين.`);
        return false;
    }

    for (const p of filledPlayers) {
      if (numbers.has(p.number)) {
        alert(`خطأ: الرقم ${p.number} مكرر في فريق ${teamName}. \n\nيجب تغيير رقم القميص لأحد اللاعبين.`);
        return false;
      }
      numbers.add(p.number);
    }
    return true;
  };

  const handleStart = () => {
    if (!validateNumbers(homePlayers, home)) return;
    if (!validateNumbers(awayPlayers, away)) return;
    onStart(home, homeCoach, homeAst, homePlayers, homeColor, away, awayCoach, awayAst, awayPlayers, awayColor, halfDur, otDur, suspensionDur, officials, details);
  };

  const inputStyle = `w-full p-2 border rounded-xl text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`;
  const labelStyle = `block text-[9px] font-black uppercase mb-1 mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`;

  const renderColorPicker = (currentColor: string, onSelect: (color: string) => void) => (
    <div className="space-y-1 mt-2">
      <label className={labelStyle}>لون الفريق (للخلفية في ورقة المباراة)</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onSelect(c.hex)}
            className={`w-6 h-6 rounded-lg border-2 transition-all ${currentColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
        <div className={`relative w-6 h-6 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${!PRESET_COLORS.some(c => c.hex === currentColor) ? 'border-white scale-110 shadow-lg' : 'border-slate-500/30 opacity-60 hover:opacity-100'}`} style={{ backgroundColor: !PRESET_COLORS.some(c => c.hex === currentColor) ? currentColor : 'transparent' }}>
             {!PRESET_COLORS.some(c => c.hex === currentColor) ? null : <Palette size={14} className={isDarkMode ? "text-white" : "text-black"} />}
             <input
                type="color"
                value={currentColor}
                onChange={(e) => onSelect(e.target.value)}
                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
                title="لون مخصص"
            />
        </div>
      </div>
    </div>
  );

  const handlePlayerNumberChange = (
    idx: number, 
    val: string, 
    players: PlayerInput[], 
    setter: React.Dispatch<React.SetStateAction<PlayerInput[]>>
  ) => {
    const next = [...players];
    next[idx].number = val;
    setter(next);
  };

  const handlePlayerLicenceChange = (
    idx: number, 
    val: string, 
    players: PlayerInput[], 
    setter: React.Dispatch<React.SetStateAction<PlayerInput[]>>
  ) => {
    const next = [...players];
    next[idx].licence = val;
    setter(next);
  };

  const toggleCaptain = (
      idx: number,
      players: PlayerInput[],
      setter: React.Dispatch<React.SetStateAction<PlayerInput[]>>
  ) => {
      const next = players.map((p, i) => ({
          ...p,
          isCaptain: i === idx ? !p.isCaptain : false // Ensure only one captain
      }));
      setter(next);
  };

  const renderPlayerInputs = (players: PlayerInput[], setter: React.Dispatch<React.SetStateAction<PlayerInput[]>>) => {
    // Determine duplicates
    const counts: {[key: string]: number} = {};
    players.forEach(p => {
        if(p.number.trim() !== '') {
            counts[p.number] = (counts[p.number] || 0) + 1;
        }
    });

    return (
        <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-4">
        {players.map((p, idx) => {
            const isDuplicate = p.number.trim() !== '' && counts[p.number] > 1;
            
            return (
                <div key={idx} className={`flex gap-2 items-center p-1.5 rounded-xl border ${isDuplicate ? 'bg-red-500/10 border-red-500' : (isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200')}`}>
                <div className="relative">
                    <input 
                        type="tel" 
                        pattern="[0-9]*"
                        placeholder="#"
                        className={`w-10 p-1.5 border rounded-lg text-center text-xs font-black outline-none ${isDuplicate ? 'bg-red-100 border-red-500 text-red-600' : (isDarkMode ? 'bg-slate-900 border-slate-700 text-blue-400' : 'bg-white border-slate-300 text-blue-600')}`} 
                        value={p.number} 
                        onChange={e => handlePlayerNumberChange(idx, e.target.value, players, setter)} 
                    />
                    {isDuplicate && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                </div>
                <input 
                    type="text" 
                    placeholder="رقم مسار / Licence"
                    className={`w-24 p-1.5 border rounded-lg text-center text-[10px] font-bold outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-amber-600'}`} 
                    value={p.licence} 
                    onChange={e => handlePlayerLicenceChange(idx, e.target.value, players, setter)} 
                />
                <input 
                    type="text" 
                    placeholder="اسم اللاعب"
                    className={`flex-1 p-1.5 border rounded-lg text-right text-xs font-bold outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                    value={p.name} 
                    onChange={e => {
                    const next = [...players];
                    next[idx].name = e.target.value;
                    setter(next);
                    }} 
                />
                {/* Roles Toggles - ONLY CAPTAIN */}
                <button 
                    onClick={() => toggleCaptain(idx, players, setter)}
                    className={`p-1.5 rounded-lg transition-colors border ${p.isCaptain ? 'bg-yellow-500 text-white border-yellow-600' : (isDarkMode ? 'bg-slate-800 text-slate-600 border-slate-700 hover:text-yellow-500' : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-yellow-500')}`}
                    title="عميد الفريق"
                >
                    <Crown size={14} fill={p.isCaptain ? "currentColor" : "none"} />
                </button>
                </div>
            );
        })}
        </div>
    );
  };

  return (
    <div className={`rounded-3xl shadow-xl border flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Pinned Header */}
      <div className={`p-4 text-center flex-shrink-0 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tSetup.title}</h2>
        <div className={`flex p-1 rounded-xl mt-3 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
          {(['details', 'teamA', 'teamB', 'officials'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-900 hover:bg-white/50')}`}>
              {tab === 'details' ? tSetup.tabDetails : tab === 'teamA' ? tSetup.tabTeamA : tab === 'teamB' ? tSetup.tabTeamB : tSetup.tabOfficials}
            </button>
          ))}
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
        {activeTab === 'details' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelStyle}>{tSetup.aref}</label>
              <input className={inputStyle} value={details.aref} onChange={e => setDetails({...details, aref: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className={labelStyle}>{tSetup.direction}</label>
              <input className={inputStyle} value={details.direction} onChange={e => setDetails({...details, direction: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>{tSetup.matchNum}</label>
              <input type="tel" className={inputStyle} value={details.numRencontre} onChange={e => setDetails({...details, numRencontre: e.target.value})} />
            </div>
             <div>
              <label className={labelStyle}>{tSetup.stage}</label>
              <input className={inputStyle} value={details.etape} onChange={e => setDetails({...details, etape: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className={labelStyle}>{tSetup.category}</label>
              <input className={inputStyle} value={details.categorie} onChange={e => setDetails({...details, categorie: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>{tSetup.halfDuration}</label>
              <input type="tel" pattern="[0-9]*" className={inputStyle} value={halfDur} onChange={e => setHalfDur(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelStyle}>{tSetup.otDuration}</label>
              <input type="tel" pattern="[0-9]*" className={inputStyle} value={otDur} onChange={e => setOtDur(parseInt(e.target.value) || 0)} />
            </div>
            
            {/* CONFIGURATION DUREE EXCLUSION */}
            <div className="col-span-2">
               <label className={labelStyle}>{tSetup.suspensionTime}</label>
               <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                  <button 
                    onClick={() => setSuspensionDur(1)}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${suspensionDur === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}
                  >
                    {tSetup.oneMin}
                  </button>
                  <button 
                    onClick={() => setSuspensionDur(2)}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${suspensionDur === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}
                  >
                    {tSetup.twoMin}
                  </button>
               </div>
            </div>

            <div className="col-span-2">
              <label className={labelStyle}>{tSetup.venue}</label>
              <input className={inputStyle} value={details.lieu} onChange={e => setDetails({...details, lieu: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>{tSetup.date}</label>
              <input type="date" className={inputStyle} value={details.date} onChange={e => setDetails({...details, date: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>{tSetup.time}</label>
              <input type="time" className={inputStyle} value={details.time} onChange={e => setDetails({...details, time: e.target.value})} />
            </div>
            <div className="col-span-2 mt-2">
              <label className={labelStyle}>{tSetup.matchLink}</label>
              <div className="relative">
                <Link size={14} className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500`} />
                <input className={`${inputStyle} ${isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2'}`} value={details.matchLink || ''} onChange={e => setDetails({...details, matchLink: e.target.value})} placeholder="https://..." dir="ltr" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teamA' && (
          <div className="flex flex-col h-full gap-3">
            <div className={`p-3 rounded-2xl border flex-shrink-0 ${isDarkMode ? 'bg-blue-900/10 border-blue-900/40' : 'bg-blue-900/10 border-blue-500/20'}`}>
              <div className="grid grid-cols-2 gap-2 mb-2">
                 <div className="col-span-2"><input className={inputStyle} value={home} onChange={e => setHome(e.target.value)} placeholder={tSetup.teamName} /></div>
                 <input className={inputStyle} value={homeCoach} onChange={e => setHomeCoach(e.target.value)} placeholder={tSetup.headCoach} />
                 <input className={inputStyle} value={homeAst} onChange={e => setHomeAst(e.target.value)} placeholder={tSetup.astCoach} />
              </div>
              <div className="flex items-center justify-between">
                <span className={labelStyle}>{tSetup.playerCount}: {homeCount} (Min 5 - Max 14)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setHomeCount(Math.max(5, homeCount - 1))} className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-800'}`}>-</button>
                  <button onClick={() => setHomeCount(Math.min(14, homeCount + 1))} className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-800'}`}>+</button>
                </div>
              </div>
              {renderColorPicker(homeColor, setHomeColor)}
            </div>
            {renderPlayerInputs(homePlayers, setHomePlayers)}
          </div>
        )}

        {activeTab === 'teamB' && (
          <div className="flex flex-col h-full gap-3">
             <div className={`p-3 rounded-2xl border flex-shrink-0 ${isDarkMode ? 'bg-red-900/10 border-red-900/40' : 'bg-red-900/10 border-red-500/20'}`}>
              <div className="grid grid-cols-2 gap-2 mb-2">
                 <div className="col-span-2"><input className={inputStyle} value={away} onChange={e => setAway(e.target.value)} placeholder={tSetup.teamName} /></div>
                 <input className={inputStyle} value={awayCoach} onChange={e => setAwayCoach(e.target.value)} placeholder={tSetup.headCoach} />
                 <input className={inputStyle} value={awayAst} onChange={e => setAwayAst(e.target.value)} placeholder={tSetup.astCoach} />
              </div>
              <div className="flex items-center justify-between">
                <span className={labelStyle}>{tSetup.playerCount}: {awayCount} (Min 5 - Max 14)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAwayCount(Math.max(5, awayCount - 1))} className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-800'}`}>-</button>
                  <button onClick={() => setAwayCount(Math.min(14, awayCount + 1))} className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-800'}`}>+</button>
                </div>
              </div>
              {renderColorPicker(awayColor, setAwayColor)}
            </div>
            {renderPlayerInputs(awayPlayers, setAwayPlayers)}
          </div>
        )}

        {activeTab === 'officials' && (
          <div className="space-y-3 pt-2">
            <input className={inputStyle} value={officials.referee1} onChange={e => setOfficials({...officials, referee1: e.target.value})} placeholder={tSetup.ref1} />
            <input className={inputStyle} value={officials.referee2} onChange={e => setOfficials({...officials, referee2: e.target.value})} placeholder={tSetup.ref2} />
            <input className={inputStyle} value={officials.timer} onChange={e => setOfficials({...officials, timer: e.target.value})} placeholder={tSetup.timer} />
            <input className={inputStyle} value={officials.secretary} onChange={e => setOfficials({...officials, secretary: e.target.value})} placeholder={tSetup.secretary} />
          </div>
        )}
      </div>

      {/* Pinned Footer */}
      <div className={`p-4 flex-shrink-0 border-t ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
        <button 
          onClick={handleStart}
          className="w-full py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-900/40 text-sm hover:bg-blue-500 transition-colors cursor-pointer"
        >
          {tSetup.saveAndStart}
        </button>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
    </div>
  );
};