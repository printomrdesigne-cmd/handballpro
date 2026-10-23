
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MatchState, MatchPeriod, SanctionType, Player, Officials, MatchDetails, Team, MatchEvent, ScheduledMatch, Staff, AppLanguage } from './types.ts';
import { SetupForm } from './components/SetupForm.tsx';
import { SetupChoice } from './components/SetupChoice.tsx';
import { ScoreBoard } from './components/ScoreBoard.tsx';
import { TeamControl } from './components/TeamControl.tsx';
import { ActionPanel } from './components/ActionPanel.tsx';
import { MatchSheet } from './components/MatchSheet.tsx';
import { ArchiveList } from './components/ArchiveList.tsx';
import { PenaltyShootout } from './components/PenaltyShootout.tsx';
import { ScheduleManager } from './components/ScheduleManager.tsx';
import { SubscriptionModal } from './components/SubscriptionModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { MatchEventsModal } from './components/MatchEventsModal.tsx';
import { getSubscriptionState, SubscriptionState } from './utils/subscriptionService.ts';
import { 
  subscribeToAuth, 
  fetchUserProfile, 
  assignUserProStatus, 
  adminFetchSubscriberStats,
  UserProfile, 
  CENTRAL_MANAGER_EMAIL, 
  isCentralManagerEmail 
} from './utils/firebase.ts';
import { translations, getStoredLanguage, setStoredLanguage } from './utils/translations.ts';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { HomeDashboard } from './components/HomeDashboard.tsx';
import { SplashAnimation } from './components/SplashAnimation.tsx';
import { Trophy, ClipboardList, Plus, Play, History, Sun, Moon, FileText, X, ChevronRight, ChevronLeft, Zap, CloudCheck, CloudOff, Loader2, RefreshCw, Database, Settings as SettingsIcon, Lock, Link as LinkIcon, ExternalLink, AlertTriangle, Coins, Edit2, Menu, Info, Crown, Sparkles, ShieldCheck, User, Globe, ShieldAlert, KeyRound, MessageSquare, BarChart3 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const sortPlayersByNumber = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    const numA = parseInt(a.number, 10) || 0;
    const numB = parseInt(b.number, 10) || 0;
    return numA - numB;
  });
};

const formatMMSS = (seconds: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PERIOD_ORDER = [
  MatchPeriod.FIRST_HALF,
  MatchPeriod.SECOND_HALF,
  MatchPeriod.OT1_H1,
  MatchPeriod.OT1_H2,
  MatchPeriod.OT2_H1,
  MatchPeriod.OT2_H2,
  MatchPeriod.PENALTIES
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'setup' | 'setup_choice' | 'match' | 'sheet' | 'archive' | 'admin_schedule'>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [history, setHistory] = useState<MatchState[]>([]); // Historique local de la session (undo/redo)
  
  // Archive State (Persistent LocalStorage)
  const [archive, setArchive] = useState<MatchState[]>(() => {
    try {
      const stored = localStorage.getItem('handball_archive');
      if (stored) {
        const parsed: MatchState[] = JSON.parse(stored);
        const cleaned = parsed.filter(m => !m.isDemo && m.details?.numRencontre !== 'DEMO-2026-01' && m.homeTeam?.name !== 'الوداد الرياضي (WAC)');
        localStorage.setItem('handball_archive', JSON.stringify(cleaned));
        return cleaned;
      }
      return [];
    } catch (e) {
      console.error("Failed to load archive", e);
      return [];
    }
  });

  const [selectedTarget, setSelectedTarget] = useState<{ type: 'player' | 'coach' | 'assistant-coach', team: 'home' | 'away', id?: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [timeoutTimer, setTimeoutTimer] = useState<number | null>(null);
  const [timerSpeed, setTimerSpeed] = useState(1);

  // New State for Schedule (Local Only)
  const [schedule, setSchedule] = useState<ScheduledMatch[]>(() => {
    try {
      const stored = localStorage.getItem('handball_schedule');
      if (stored) {
        const parsed: ScheduledMatch[] = JSON.parse(stored);
        const cleaned = parsed.filter(m => !m.isDemo && m.homeTeam !== 'الوداد الرياضي');
        localStorage.setItem('handball_schedule', JSON.stringify(cleaned));
        return cleaned;
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [preSelectedScheduledMatch, setPreSelectedScheduledMatch] = useState<ScheduledMatch | null>(null);
  
  // Temporary state to hold data when going back to setup
  const [editSetupData, setEditSetupData] = useState<any>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPass, setLoginPass] = useState('');

  // Center Password Verification
  const [showCenterPasswordModal, setShowCenterPasswordModal] = useState(false);
  const [centerLoginPass, setCenterLoginPass] = useState('');
  const [pendingScheduledMatch, setPendingScheduledMatch] = useState<ScheduledMatch | null>(null);

  // Penalty Setup Modal
  const [showPenaltySetup, setShowPenaltySetup] = useState(false);
  const [penaltyConfig, setPenaltyConfig] = useState<{ shots: number, starter: 'home' | 'away' | null }>({ shots: 5, starter: null });

  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Match Events Log & Analysis Modal
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [eventsTargetMatch, setEventsTargetMatch] = useState<MatchState | null>(null);
  const [eventsModalInitialTab, setEventsModalInitialTab] = useState<'timeline' | 'analysis' | 'import_export' | 'add_event'>('timeline');

  const handleOpenEventsForMatch = (
    targetMatch: MatchState | null = match,
    tab: 'timeline' | 'analysis' | 'import_export' | 'add_event' = 'timeline'
  ) => {
    if (!targetMatch) return;
    setEventsTargetMatch(targetMatch);
    setEventsModalInitialTab(tab);
    setShowEventsModal(true);
  };

  const handleOpenAnalysis = (targetMatch: MatchState | null = match) => {
    handleOpenEventsForMatch(targetMatch, 'analysis');
  };

  const handleUpdateEventsMatch = (updated: MatchState) => {
    if (match && match.id === updated.id) {
      setMatch(updated);
    }
    setEventsTargetMatch(updated);
    setArchive(prev => {
      const idx = prev.findIndex(m => m.id === updated.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return prev;
    });
  };

  // Subscription / License State
  const [subscription, setSubscription] = useState<SubscriptionState>(() => getSubscriptionState());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalTab, setSubscriptionModalTab] = useState<'activate' | 'manager'>('activate');

  // User Account (Firebase Auth) State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const isCentralManager = isCentralManagerEmail(currentUser?.email);
  // An account is active if it's the central manager OR if the user is activated and NOT blocked
  const isUserBlocked = Boolean(currentUser?.isBlocked && !isCentralManager);
  const isAccountActive = Boolean(currentUser && (isCentralManager || (currentUser.isActive && !currentUser.isBlocked)));

  // Subscriber statistics for Central Manager
  const [subscriberStats, setSubscriberStats] = useState<{ total: number; active: number; closed: number }>({ total: 0, active: 0, closed: 0 });

  const refreshSubscriberStats = useCallback(async () => {
    try {
      const stats = await adminFetchSubscriberStats();
      setSubscriberStats(stats);
    } catch (e) {
      console.warn('Could not fetch subscriber stats', e);
    }
  }, []);

  useEffect(() => {
    if (isCentralManager) {
      refreshSubscriberStats();
    }
  }, [isCentralManager, refreshSubscriberStats]);

  // Multilingual Support (ar / fr / en)
  const [lang, setLang] = useState<AppLanguage>(() => getStoredLanguage());
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const changeLanguage = (newLang: AppLanguage) => {
    setLang(newLang);
    setStoredLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Account Activation / Blocked Gate Modal
  const [showActivationGate, setShowActivationGate] = useState(false);
  const [activationGateReason, setActivationGateReason] = useState('');

  // Sync Firebase Auth on mount
  useEffect(() => {
    const unsub = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
          const active = Boolean(isCentralManagerEmail(profile.email) || (profile.isActive && !profile.isBlocked));
          setSubscription(prev => ({
            ...prev,
            isPro: active,
            planId: profile.planId || 'club_yearly',
            licenseKey: profile.licenseKey || (active ? 'ACTIVE' : 'PENDING'),
            clubName: profile.clubName
          }));
        } else {
          const isManager = isCentralManagerEmail(firebaseUser.email);
          const newProf = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'مشترك'),
            isActive: isManager,
            isPro: isManager,
            isBlocked: false
          };
          setCurrentUser(newProf);
          setSubscription(prev => ({
            ...prev,
            isPro: isManager,
            licenseKey: isManager ? 'ACTIVE' : 'PENDING'
          }));
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateSubscription = (newSub: SubscriptionState) => {
    setSubscription(newSub);
    if (newSub.isPro && currentUser?.uid) {
      assignUserProStatus(currentUser.uid, newSub.planId || 'club_yearly', newSub.licenseKey || 'PRO-KEY', currentUser.clubName);
      setCurrentUser(prev => prev ? { ...prev, isPro: true, planId: newSub.planId, licenseKey: newSub.licenseKey } : null);
    }
  };

  const matchRef = useRef<MatchState | null>(null);
  useEffect(() => { matchRef.current = match; }, [match]);
  // Prevent duplicate goal triggers: each click is strictly 1 goal
  const lastScoreEventTimeRef = useRef<{ time: number; type: string; id: string }>({ time: 0, type: '', id: '' });

  // Persist Archive when it changes
  useEffect(() => {
    try {
      localStorage.setItem('handball_archive', JSON.stringify(archive));
    } catch (e) {
      console.error("Failed to save archive", e);
    }
  }, [archive]);

  // AUTO-SAVE MATCH STATE & RECOVERY
  useEffect(() => {
    // 1. Recover match on mount if exists
    const savedMatch = localStorage.getItem('current_active_match');
    if (savedMatch && !match) {
        try {
            const parsed = JSON.parse(savedMatch);
            if (parsed.isDemo || parsed.details?.numRencontre === 'DEMO-2026-01' || parsed.homeTeam?.name === 'الوداد الرياضي (WAC)') {
              localStorage.removeItem('current_active_match');
              return;
            }
            // Clean stale demo values if present from older states
            if (parsed && parsed.details) {
              if (parsed.details.aref === 'عصبة الرباط سلا القنيطرة') {
                parsed.details.aref = '';
              }
              if (parsed.details.direction === 'الجامعة الملكية المغربية لكرة اليد') {
                parsed.details.direction = '';
              }
            }
            // Only restore if we are in initial state - Keep view on 'home' as requested
            setMatch(parsed);
        } catch (e) {
            console.error("Failed to restore match", e);
        }
    }
  }, []);

  useEffect(() => {
    // 2. Save match on every update
    if (match) {
        localStorage.setItem('current_active_match', JSON.stringify(match));
        
        // Also update the archive entry in real-time if it exists there (to ensure "local archive" is up to date)
        setArchive(prev => {
             const index = prev.findIndex(m => m.id === match.id);
             if (index !== -1) {
                 const newArchive = [...prev];
                 newArchive[index] = match;
                 return newArchive;
             }
             return prev;
        });
    }
  }, [match]);

  const saveScheduleToLocal = (newSchedule: ScheduledMatch[]) => {
      setSchedule(newSchedule);
      // Optionnel : Sauvegarder dans localStorage si besoin
  };

  const deleteFromArchive = (id: string) => {
      setArchive(prev => prev.filter(m => m.id !== id));
      if (match?.id === id) {
          setMatch(null);
          localStorage.removeItem('current_active_match'); // Clear active if deleted
          setView('setup_choice');
      }
  };

  const handleFinishMatch = () => {
    if (!match) return;
    const finishedMatch = { ...match, isFinished: true, isActive: false };
    setMatch(finishedMatch);
    
    // Save to archive (update if exists, add if new)
    setArchive(prev => {
        const exists = prev.some(m => m.id === finishedMatch.id);
        if (exists) {
            return prev.map(m => m.id === finishedMatch.id ? finishedMatch : m);
        }
        return [finishedMatch, ...prev];
    });
    // We do NOT remove 'current_active_match' here so the user can still see the result if they refresh.
    // It will be overwritten when they start a new match.
  };

  const requireActiveAccount = (actionName: string = t.newMatch): boolean => {
    // If not logged in, request login
    if (!currentUser) {
      setActivationGateReason(lang === 'ar' ? 'يرجى تسجيل الدخول بحسابك أولاً للاستفادة من التطبيق وإدارة المباريات.' : 'Veuillez vous connecter pour continuer.');
      setShowActivationGate(true);
      return false;
    }

    // If account is closed or not activated
    if (!isAccountActive) {
      setActivationGateReason(
        currentUser.blockReason || 
        (lang === 'ar' 
          ? 'حسابك مغلق أو في انتظار التفعيل من قِبل المسير المركزي. يرجى التواصل مع الإدارة لتفعيل حسابك.'
          : 'Votre compte est fermé ou en attente d\'activation par le gestionnaire.')
      );
      setShowActivationGate(true);
      return false;
    }

    return true;
  };

  const startMatch = (
    h: string, hc: string, hast: string, hplayers: any[], hcol: string,
    a: string, ac: string, aast: string, aplayers: any[], acol: string, 
    hd: number, od: number, suspensionDur: number, off: any, det: any
  ) => {
    if (!requireActiveAccount('بدء مباراة رسمية جديدة')) {
      return;
    }
    const mapPlayers = (players: any[], prefix: string): Player[] => {
      const mapped = players.map((p, i) => ({ 
        id: `${prefix}-${generateId()}-${i}`, 
        number: p.number, 
        licence: p.licence || '',
        name: p.name, 
        goals: 0, 
        sanctions: [], 
        isCaptain: p.isCaptain || false, 
        isGoalkeeper: p.isGoalkeeper || false
      }));
      return sortPlayersByNumber(mapped);
    };
    
    // Initialize Assistant Coach as a Staff object
    const homeAssistant: Staff = { name: hast, sanctions: [] };
    const awayAssistant: Staff = { name: aast, sanctions: [] };

    const newMatch: MatchState = {
      id: generateId(), details: det,
      homeTeam: { 
        name: h, color: hcol, coach: { name: hc, sanctions: [] }, assistantCoach: homeAssistant,
        players: mapPlayers(hplayers, 'home'), timeoutsUsed: 0, timeoutsThisHalf: 0, reservations: ''
      },
      awayTeam: { 
        name: a, color: acol, coach: { name: ac, sanctions: [] }, assistantCoach: awayAssistant,
        players: mapPlayers(aplayers, 'away'), timeoutsUsed: 0, timeoutsThisHalf: 0, reservations: ''
      },
      officials: off, timer: 0, isActive: false, isFinished: false, period: MatchPeriod.FIRST_HALF, report: '',
      score: { 
        home: 0, away: 0, 
        homeP1: 0, awayP1: 0, 
        homeFullTime: undefined, awayFullTime: undefined,
        homeOT: undefined, awayOT: undefined,
        homeOT2: undefined, awayOT2: undefined,
        homePenalties: 0, awayPenalties: 0 
      },
      penaltySequence: { home: [], away: [], currentTurn: 'home' },
      config: { halfDuration: hd * 60, otDuration: od * 60, penaltyShots: 5, suspensionDuration: suspensionDur * 60 },
      events: [] 
    };
    setMatch(newMatch);
    setHistory([]);
    // Clear edit data after starting
    setEditSetupData(null);
    setPreSelectedScheduledMatch(null);
    setView('match');
  };

  const handleNewMatchChoice = (matchChoice?: ScheduledMatch) => {
    if (!requireActiveAccount('بدء وإعداد مباراة رسمية جديدة')) {
      return;
    }
    setEditSetupData(null); // Clear any previous edit data
    if (matchChoice) {
      if (matchChoice.centerPassword) {
        setPendingScheduledMatch(matchChoice);
        setCenterLoginPass('');
        setShowCenterPasswordModal(true);
      } else {
        setPreSelectedScheduledMatch(matchChoice);
        setView('setup');
      }
    } else {
      setPreSelectedScheduledMatch(null);
      setView('setup');
    }
  };

  const handleBackToSetup = () => {
      if (!match) return;
      
      const confirm = window.confirm("هل أنت متأكد من العودة للإعدادات؟\nستتمكن من تعديل أسماء اللاعبين وتفاصيل المباراة، وسيتم إعادة تشغيل العداد.");
      if (!confirm) return;

      // Construct data to pre-fill SetupForm from the CURRENT match state
      const data = {
          initialMatch: {
              id: match.id,
              homeTeam: match.homeTeam.name,
              awayTeam: match.awayTeam.name,
              category: match.details.categorie,
              lieu: match.details.lieu,
              date: match.details.date,
              time: match.details.time,
              officials: match.officials,
          },
          initialDetails: match.details,
          initialHomePlayers: match.homeTeam.players.map(p => ({
              number: p.number, name: p.name, licence: p.licence, isCaptain: p.isCaptain || false, isGoalkeeper: p.isGoalkeeper || false
          })),
          initialAwayPlayers: match.awayTeam.players.map(p => ({
              number: p.number, name: p.name, licence: p.licence, isCaptain: p.isCaptain || false, isGoalkeeper: p.isGoalkeeper || false
          })),
          initialHomeCoach: match.homeTeam.coach.name,
          initialAwayCoach: match.awayTeam.coach.name,
          initialHomeAst: match.homeTeam.assistantCoach?.name || '',
          initialAwayAst: match.awayTeam.assistantCoach?.name || '',
          initialHomeColor: match.homeTeam.color,
          initialAwayColor: match.awayTeam.color
      };

      setEditSetupData(data);
      setView('setup');
  };

  const handleCenterLogin = () => {
    if (pendingScheduledMatch && centerLoginPass === pendingScheduledMatch.centerPassword) {
      setPreSelectedScheduledMatch(pendingScheduledMatch);
      setShowCenterPasswordModal(false);
      setPendingScheduledMatch(null);
      setView('setup');
    } else {
      alert("القن السري للمركز غير صحيح");
    }
  };

  const handleLogin = () => {
    if (loginPass === '3lachbghitih@') {
      localStorage.setItem('admin_authenticated', 'true');
      setView('admin_schedule');
      setShowLoginModal(false);
      setLoginPass('');
    } else {
      alert("بيانات الدخول غير صحيحة");
    }
  };

  const handleSettingsClick = () => {
    setView('admin_schedule');
  };

  const handleAddPlayer = (side: 'home' | 'away', number: string, name: string) => {
    setMatch(prev => {
      if (!prev) return null;
      const newPlayer: Player = {
        id: `${side}-${generateId()}`,
        number,
        licence: '', // Default empty license for quick added players
        name,
        goals: 0,
        sanctions: [],
        isCaptain: false,
        isGoalkeeper: false
      };
      const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
      return {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          players: sortPlayersByNumber([...prev[teamKey].players, newPlayer])
        }
      };
    });
  };

  const handleUpdatePlayer = (side: 'home' | 'away', id: string, data: Partial<Player>) => {
    setMatch(prev => {
      if (!prev) return null;
      const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
      const updatedPlayers = prev[teamKey].players.map(p => 
        p.id === id ? { ...p, ...data } : p
      );
      return {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          players: sortPlayersByNumber(updatedPlayers)
        }
      };
    });
  };

  // Function to update coach or assistant details directly from TeamControl
  const handleUpdateStaff = (side: 'home' | 'away', type: 'coach' | 'assistant-coach', name: string) => {
    setMatch(prev => {
        if (!prev) return null;
        const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
        const team = { ...prev[teamKey] };
        if (type === 'coach') {
            team.coach = { ...team.coach, name: name };
        } else if (type === 'assistant-coach' && team.assistantCoach) {
            team.assistantCoach = { ...team.assistantCoach, name: name };
        }
        return { ...prev, [teamKey]: team };
    });
  };

  const handleDeletePlayer = (side: 'home' | 'away', id: string) => {
    setMatch(prev => {
      if (!prev) return null;
      const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
      const updatedPlayers = prev[teamKey].players.filter(p => p.id !== id);
      return {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          players: updatedPlayers
        }
      };
    });
  };

  const handleTimeout = (team: 'home' | 'away') => {
    if (!match) return;
    setMatch(prev => {
      if (!prev) return null;
      const newMatch = { ...prev, isActive: false };
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      
      newMatch[teamKey] = {
        ...newMatch[teamKey],
        timeoutsUsed: newMatch[teamKey].timeoutsUsed + 1,
        timeoutsThisHalf: newMatch[teamKey].timeoutsThisHalf + 1
      };

      newMatch.events.unshift({
          id: generateId(),
          type: 'TIMEOUT',
          timestamp: prev.timer,
          timeStr: formatMMSS(prev.timer),
          team: team
      });

      return newMatch;
    });
    setTimeoutTimer(60);
  };
  
  const handleCancelTimeout = (team: 'home' | 'away') => {
    if (!match) return;
    setMatch(prev => {
        if (!prev) return null;
        const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
        if (prev[teamKey].timeoutsUsed === 0) return prev;
        
        // Decrement counts
        const newTeam = { ...prev[teamKey] };
        newTeam.timeoutsUsed = Math.max(0, newTeam.timeoutsUsed - 1);
        if (newTeam.timeoutsThisHalf > 0) newTeam.timeoutsThisHalf -= 1;

        // Remove last timeout event for this team
        const newEvents = [...prev.events];
        const evtIdx = newEvents.findIndex(e => e.type === 'TIMEOUT' && e.team === team);
        if (evtIdx > -1) newEvents.splice(evtIdx, 1);

        return { ...prev, [teamKey]: newTeam, events: newEvents };
    });
    setTimeoutTimer(null); // Also cancel timer
  };

  const handlePeriodChange = (direction: 'next' | 'prev') => {
    setMatch(prev => {
      if (!prev) return null;
      const currentIndex = PERIOD_ORDER.indexOf(prev.period);
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      // Bounds check
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= PERIOD_ORDER.length) newIndex = PERIOD_ORDER.length - 1;

      if (newIndex === currentIndex) return prev;

      const newPeriod = PERIOD_ORDER[newIndex];
      
      // RESET TIMEOUTS FOR THE NEW PERIOD if we are moving to a new half or OT
      let updateHome = { ...prev.homeTeam };
      let updateAway = { ...prev.awayTeam };
      let updatedScore = { ...prev.score };

      // SNAPSHOT HALFTIME SCORE
      if (prev.period === MatchPeriod.FIRST_HALF && newPeriod !== MatchPeriod.FIRST_HALF) {
          updatedScore.homeP1 = prev.score.home;
          updatedScore.awayP1 = prev.score.away;
      }

      // SNAPSHOT FULL TIME (60min) SCORE
      if (prev.period === MatchPeriod.SECOND_HALF && newPeriod !== MatchPeriod.SECOND_HALF && newPeriod !== MatchPeriod.FIRST_HALF) {
          updatedScore.homeFullTime = prev.score.home;
          updatedScore.awayFullTime = prev.score.away;
      }
      
      // SNAPSHOT OT SCORE (End of OT1 or OT2)
      if (prev.period === MatchPeriod.OT1_H2 && newPeriod !== MatchPeriod.OT1_H2 && newPeriod !== MatchPeriod.OT1_H1) {
           // Can snapshot here if needed
      }

      // SNAPSHOT OT2 SCORE (End of OT2)
      if (prev.period === MatchPeriod.OT2_H2 && newPeriod === MatchPeriod.PENALTIES) {
          updatedScore.homeOT = prev.score.home; // OT Score usually includes OT1 + OT2 total
          updatedScore.awayOT = prev.score.away;
          updatedScore.homeOT2 = prev.score.home; // Store specific end of OT2 score if distinct tracking needed
          updatedScore.awayOT2 = prev.score.away;
      }

      // Reset timeouts for new periods except between OT halves
      if (
          (prev.period === MatchPeriod.FIRST_HALF && newPeriod === MatchPeriod.SECOND_HALF) ||
          (prev.period === MatchPeriod.SECOND_HALF && newPeriod === MatchPeriod.OT1_H1) ||
          (prev.period === MatchPeriod.OT1_H2 && newPeriod === MatchPeriod.OT2_H1)
      ) {
          updateHome.timeoutsThisHalf = 0;
          updateAway.timeoutsThisHalf = 0;
      }
      
      return {
          ...prev,
          period: newPeriod,
          isActive: false, 
          homeTeam: updateHome,
          awayTeam: updateAway,
          score: updatedScore
      };
    });
  };

  // Wrapper for period change to intercept Penalties
  const onPeriodChangeRequest = (direction: 'next' | 'prev') => {
      if (!match) return;
      
      const currentIndex = PERIOD_ORDER.indexOf(match.period);
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < PERIOD_ORDER.length) {
          const newPeriod = PERIOD_ORDER[newIndex];
          if (newPeriod === MatchPeriod.PENALTIES) {
              setPenaltyConfig({ shots: 5, starter: null });
              setShowPenaltySetup(true);
              return; // Stop here, modal will handle the rest
          }
      }
      handlePeriodChange(direction);
  };

  const confirmPenaltySetup = () => {
      if (!match || !penaltyConfig.starter) return;
      
      setMatch(prev => {
          if (!prev) return null;
          // Apply standard period change logic + penalty config
          let updatedScore = { ...prev.score };
          
          // Assuming we came from OT2 or 2nd Half or OT1
          if (prev.period !== MatchPeriod.FIRST_HALF && prev.period !== MatchPeriod.PENALTIES) {
             // If we are coming from overtime, snapshot that
             if (prev.period === MatchPeriod.OT1_H2 || prev.period === MatchPeriod.OT2_H2) {
                 updatedScore.homeOT = prev.score.home;
                 updatedScore.awayOT = prev.score.away;
                 if (prev.period === MatchPeriod.OT2_H2) {
                      updatedScore.homeOT2 = prev.score.home;
                      updatedScore.awayOT2 = prev.score.away;
                 }
             } else if (prev.period === MatchPeriod.SECOND_HALF) {
                 updatedScore.homeFullTime = prev.score.home;
                 updatedScore.awayFullTime = prev.score.away;
             }
          }

          return {
              ...prev,
              period: MatchPeriod.PENALTIES,
              isActive: false,
              score: updatedScore,
              penaltySequence: {
                  ...prev.penaltySequence,
                  currentTurn: penaltyConfig.starter!
              },
              config: {
                  ...prev.config,
                  penaltyShots: penaltyConfig.shots
              }
          };
      });
      setShowPenaltySetup(false);
  };

  const handlePenaltyShot = (team: 'home' | 'away', playerId: string, isGoal: boolean) => {
    setMatch(prev => {
      if (!prev) return null;
      const targetScoreKey = team === 'home' ? 'homePenalties' : 'awayPenalties';
      const updatedScore = isGoal
        ? { ...prev.score, [targetScoreKey]: (prev.score[targetScoreKey] || 0) + 1 }
        : { ...prev.score };
      
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      const player = prev[teamKey].players.find(p => p.id === playerId);
      const shot = {
        playerId,
        playerName: player?.name || '',
        playerNumber: player?.number || '',
        goal: isGoal
      };
      
      return {
        ...prev,
        score: updatedScore,
        penaltySequence: {
          ...prev.penaltySequence,
          [team]: [...prev.penaltySequence[team], shot],
          currentTurn: team === 'home' ? 'away' : 'home'
        }
      };
    });
  };

  const handleAction = useCallback((type: 'goal' | '7m' | SanctionType, inc: boolean = true) => {
    if (!match || !selectedTarget) return;

    // Strict debounce: each click is strictly 1 goal, never 2 goals
    const now = Date.now();
    if (inc && (type === 'goal' || type === '7m')) {
      const targetId = selectedTarget.id || selectedTarget.team;
      if (
        now - lastScoreEventTimeRef.current.time < 450 &&
        lastScoreEventTimeRef.current.type === type &&
        lastScoreEventTimeRef.current.id === targetId
      ) {
        return;
      }
      lastScoreEventTimeRef.current = { time: now, type, id: targetId };
    }

    setMatch(prev => {
      if (!prev) return null;
      const teamSide = selectedTarget.team;
      const teamKey = teamSide === 'home' ? 'homeTeam' : 'awayTeam';
      const eventTime = prev.timer;

      // Prevent adding goal if match is finished
      if (prev.isFinished && inc) {
        return prev;
      }

      // Pure immutable cloning of score and events
      let newScore = { ...prev.score };
      let newEvents = [...prev.events];
      const team = { ...prev[teamKey] };

      if (selectedTarget.type === 'player' && selectedTarget.id) {
        const pIdx = team.players.findIndex(p => p.id === selectedTarget.id);
        if (pIdx === -1) return prev;

        const player = team.players[pIdx];
        const hasRed = player.sanctions.some(s => s.type === SanctionType.RED);
        const hasBlue = player.sanctions.some(s => s.type === SanctionType.BLUE);
        const isDisqualified = hasRed || hasBlue;

        if (inc && isDisqualified) {
          if (type === SanctionType.BLUE && hasRed && !hasBlue) {
            // Allow adding BLUE if currently RED
          } else {
            return prev;
          }
        }

        let updatedPlayer = { ...player };

        if (type === 'goal' || type === '7m') {
          const sideKey = teamSide === 'home' ? 'home' : 'away';
          if (inc) {
            updatedPlayer.goals = (player.goals || 0) + 1;
            newScore[sideKey] = (prev.score[sideKey] || 0) + 1;

            newEvents.unshift({
              id: generateId(),
              type: 'GOAL',
              timestamp: eventTime,
              timeStr: formatMMSS(eventTime),
              team: teamSide,
              playerId: player.id,
              playerName: player.name,
              goalType: type === '7m' ? '7M' : 'NORMAL'
            });
          } else {
            if (player.goals > 0) {
              updatedPlayer.goals = player.goals - 1;
              newScore[sideKey] = Math.max(0, (prev.score[sideKey] || 0) - 1);
              const evtIdx = newEvents.findIndex(e => e.type === 'GOAL' && e.playerId === player.id);
              if (evtIdx > -1) newEvents.splice(evtIdx, 1);
            }
          }
        } else {
          // Sanctions
          if (inc) {
            if (type === SanctionType.YELLOW) {
              if (player.sanctions.some(s => s.type === SanctionType.YELLOW)) return prev;
              const teamYellowCount = team.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.YELLOW).length, 0);
              if (teamYellowCount >= 3) return prev;
            }

            const s: any = { type, timestamp: eventTime };
            if (type === SanctionType.TWO_MINUTES) s.remainingTime = prev.config.suspensionDuration;
            updatedPlayer.sanctions = [...player.sanctions, s];

            newEvents.unshift({
              id: generateId(),
              type: 'SANCTION',
              timestamp: eventTime,
              timeStr: formatMMSS(eventTime),
              team: teamSide,
              playerId: player.id,
              playerName: player.name,
              sanctionType: type as SanctionType
            });

            // AUTOMATIC RED CARD FOR 3rd SUSPENSION
            if (type === SanctionType.TWO_MINUTES) {
              const twoMinCount = updatedPlayer.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length;
              if (twoMinCount === 3) {
                updatedPlayer.sanctions = [...updatedPlayer.sanctions, { type: SanctionType.RED, timestamp: eventTime }];
                newEvents.unshift({
                  id: generateId(),
                  type: 'SANCTION',
                  timestamp: eventTime,
                  timeStr: formatMMSS(eventTime),
                  team: teamSide,
                  playerId: player.id,
                  playerName: player.name,
                  sanctionType: SanctionType.RED
                });
              }
            }
          } else {
            const sIdx = player.sanctions.map(s => s.type).lastIndexOf(type as SanctionType);
            if (sIdx > -1) {
              const newSanctions = [...player.sanctions];
              newSanctions.splice(sIdx, 1);
              updatedPlayer.sanctions = newSanctions;
              const evtIdx = newEvents.findIndex(e => e.type === 'SANCTION' && e.playerId === player.id && e.sanctionType === type);
              if (evtIdx > -1) newEvents.splice(evtIdx, 1);
            }
          }
        }

        const updatedPlayers = [...team.players];
        updatedPlayers[pIdx] = updatedPlayer;
        team.players = updatedPlayers;
      } 
      else if (selectedTarget.type === 'coach') {
        const coach = { ...team.coach };
        if (type !== 'goal' && type !== '7m') {
          if (inc) {
            if (type === SanctionType.YELLOW) {
              if (coach.sanctions.some(s => s.type === SanctionType.YELLOW)) return prev;
            }
            const s: any = { type: type as SanctionType, timestamp: eventTime };
            if (type === SanctionType.TWO_MINUTES) s.remainingTime = prev.config.suspensionDuration;
            coach.sanctions = [...coach.sanctions, s];
            newEvents.unshift({
              id: generateId(),
              type: 'SANCTION',
              timestamp: eventTime,
              timeStr: formatMMSS(eventTime),
              team: teamSide,
              playerId: 'COACH',
              playerName: coach.name,
              sanctionType: type as SanctionType
            });
          } else {
            const sIdx = coach.sanctions.map(s => s.type).lastIndexOf(type as SanctionType);
            if (sIdx > -1) {
              const newSanctions = [...coach.sanctions];
              newSanctions.splice(sIdx, 1);
              coach.sanctions = newSanctions;
              const evtIdx = newEvents.findIndex(e => e.type === 'SANCTION' && e.playerId === 'COACH' && e.team === teamSide && e.sanctionType === type);
              if (evtIdx > -1) newEvents.splice(evtIdx, 1);
            }
          }
          team.coach = coach;
        }
      } 
      else if (selectedTarget.type === 'assistant-coach' && team.assistantCoach) {
        const ast = { ...team.assistantCoach };
        if (type !== 'goal' && type !== '7m') {
          if (inc) {
            if (type === SanctionType.YELLOW) {
              if (ast.sanctions.some(s => s.type === SanctionType.YELLOW)) return prev;
            }
            const s: any = { type: type as SanctionType, timestamp: eventTime };
            if (type === SanctionType.TWO_MINUTES) s.remainingTime = prev.config.suspensionDuration;
            ast.sanctions = [...ast.sanctions, s];
            newEvents.unshift({
              id: generateId(),
              type: 'SANCTION',
              timestamp: eventTime,
              timeStr: formatMMSS(eventTime),
              team: teamSide,
              playerId: 'ASSISTANT_COACH',
              playerName: ast.name,
              sanctionType: type as SanctionType
            });
          } else {
            const sIdx = ast.sanctions.map(s => s.type).lastIndexOf(type as SanctionType);
            if (sIdx > -1) {
              const newSanctions = [...ast.sanctions];
              newSanctions.splice(sIdx, 1);
              ast.sanctions = newSanctions;
              const evtIdx = newEvents.findIndex(e => e.type === 'SANCTION' && e.playerId === 'ASSISTANT_COACH' && e.team === teamSide && e.sanctionType === type);
              if (evtIdx > -1) newEvents.splice(evtIdx, 1);
            }
          }
          team.assistantCoach = ast;
        }
      }

      return {
        ...prev,
        score: newScore,
        events: newEvents,
        [teamKey]: team
      };
    });
  }, [match, selectedTarget]);

  // Toast notification for user actions (scoring, canceling goals, selection hints)
  const [matchToast, setMatchToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const matchToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMatchToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (matchToastTimerRef.current) clearTimeout(matchToastTimerRef.current);
    setMatchToast({ message, type });
    matchToastTimerRef.current = setTimeout(() => {
      setMatchToast(null);
    }, 2800);
  }, []);

  // Scoring a goal directly on the scoreboard after selecting a player
  const handleScoreBoardGoal = useCallback((teamSide: 'home' | 'away') => {
    if (!match) return;
    if (match.isFinished) {
      showMatchToast(lang === 'ar' ? 'المباراة منتهية' : 'Match terminé', 'warning');
      return;
    }

    const team = teamSide === 'home' ? match.homeTeam : match.awayTeam;

    // 1. Verify a player is selected
    if (!selectedTarget || selectedTarget.type !== 'player' || !selectedTarget.id) {
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      showMatchToast(
        lang === 'ar' 
          ? `اختر رقم اللاعب أولاً من قائمة ${team.name} لتسجيل الهدف 👈` 
          : `Sélectionnez d'abord le numéro du joueur de ${team.name} !`,
        'warning'
      );
      return;
    }

    // 2. Verify selected player belongs to the clicked team
    if (selectedTarget.team !== teamSide) {
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      const otherTeamName = selectedTarget.team === 'home' ? match.homeTeam.name : match.awayTeam.name;
      showMatchToast(
        lang === 'ar' 
          ? `اللاعب المحدد يتبع لفريق ${otherTeamName}. يرجى اختيار لاعب من ${team.name}!` 
          : `Le joueur sélectionné appartient à ${otherTeamName} !`,
        'warning'
      );
      return;
    }

    // 3. Verify player eligibility
    const player = team.players.find(p => p.id === selectedTarget.id);
    if (!player) return;

    const hasRed = player.sanctions.some(s => s.type === SanctionType.RED);
    const hasBlue = player.sanctions.some(s => s.type === SanctionType.BLUE);
    if (hasRed || hasBlue) {
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      showMatchToast(
        lang === 'ar' ? `اللاعب #${player.number} (${player.name}) مطرود ولا يمكنه تسجيل أهداف!` : `Joueur exclu !`,
        'warning'
      );
      return;
    }

    const isSuspended = player.sanctions.some(s => s.type === SanctionType.TWO_MINUTES && s.remainingTime && s.remainingTime > 0);
    if (isSuspended) {
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      showMatchToast(
        lang === 'ar' ? `اللاعب #${player.number} (${player.name}) موقوف حالياً لمدة دقيقتين!` : `Joueur suspendu 2 min !`,
        'warning'
      );
      return;
    }

    // 4. Trigger goal action
    handleAction('goal', true);
    if (navigator.vibrate) navigator.vibrate(25);
    showMatchToast(
      lang === 'ar' 
        ? `⚽ هدف مسجل لصالح #${player.number} ${player.name} (${team.name})` 
        : `⚽ But enregistré pour #${player.number} ${player.name} !`,
      'success'
    );
  }, [match, selectedTarget, handleAction, lang, showMatchToast]);

  // Cancelling/undoing a goal with long-press on player number
  const handleUndoGoal = useCallback((side: 'home' | 'away', playerId: string) => {
    let undone = false;
    let playerName = '';
    let playerNumber = '';

    setMatch(prev => {
      if (!prev) return null;
      const teamKey = side === 'home' ? 'homeTeam' : 'awayTeam';
      const team = { ...prev[teamKey] };
      const pIdx = team.players.findIndex(p => p.id === playerId);
      if (pIdx === -1) return prev;

      const player = team.players[pIdx];
      playerNumber = player.number;
      playerName = player.name;

      if ((player.goals || 0) <= 0) {
        return prev;
      }

      undone = true;
      const updatedPlayer = { ...player, goals: player.goals - 1 };
      const updatedPlayers = [...team.players];
      updatedPlayers[pIdx] = updatedPlayer;
      team.players = updatedPlayers;

      const newScore = {
        ...prev.score,
        [side]: Math.max(0, (prev.score[side] || 0) - 1)
      };

      const newEvents = [...prev.events];
      const evtIdx = newEvents.findIndex(e => e.type === 'GOAL' && e.playerId === playerId);
      if (evtIdx > -1) newEvents.splice(evtIdx, 1);

      return {
        ...prev,
        score: newScore,
        events: newEvents,
        [teamKey]: team
      };
    });

    if (undone) {
      if (navigator.vibrate) navigator.vibrate([35, 35]);
      showMatchToast(
        lang === 'ar' 
          ? `↩️ تم إلغاء هدف للاعب #${playerNumber} ${playerName}` 
          : `↩️ But annulé pour #${playerNumber} ${playerName}`,
        'info'
      );
    } else {
      showMatchToast(
        lang === 'ar' 
          ? `اللاعب #${playerNumber} ليس لديه أي هدف مسجل لإلغائه` 
          : `Le joueur #${playerNumber} n'a aucun but à annuler`,
        'warning'
      );
    }
  }, [lang, showMatchToast]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (match?.isActive) {
        setMatch(prev => {
          if (!prev) return null;
          let nextTimer = prev.timer + 1;
          let nextActive = true;
          const { halfDuration, otDuration } = prev.config;

          if (prev.period === MatchPeriod.FIRST_HALF && nextTimer >= halfDuration) nextActive = false;
          else if (prev.period === MatchPeriod.SECOND_HALF && nextTimer >= halfDuration * 2) nextActive = false;
          
          // OT1 
          else if (prev.period === MatchPeriod.OT1_H1 && nextTimer >= (halfDuration * 2) + otDuration) nextActive = false;
          else if (prev.period === MatchPeriod.OT1_H2 && nextTimer >= (halfDuration * 2) + (otDuration * 2)) nextActive = false;
          
          // OT2
          else if (prev.period === MatchPeriod.OT2_H1 && nextTimer >= (halfDuration * 2) + (otDuration * 2) + otDuration) nextActive = false;
          else if (prev.period === MatchPeriod.OT2_H2 && nextTimer >= (halfDuration * 2) + (otDuration * 2) + (otDuration * 2)) nextActive = false;

          const updateS = (t: Team) => ({
            ...t, 
            players: t.players.map(p => {
                // Find the first active 2-minute suspension.
                // Logic: 2-minute suspensions must be served sequentially.
                // We find the first one that has remainingTime > 0 and decrement it.
                // Subsequent ones will wait until the first is done.
                const firstActiveIndex = p.sanctions.findIndex(s => s.type === SanctionType.TWO_MINUTES && s.remainingTime !== undefined && s.remainingTime > 0);

                if (firstActiveIndex === -1) return p;

                return {
                    ...p,
                    sanctions: p.sanctions.map((s, idx) => {
                        if (idx === firstActiveIndex && s.remainingTime) {
                            return { ...s, remainingTime: s.remainingTime - 1 };
                        }
                        return s;
                    })
                };
            }),
            coach: { ...t.coach, sanctions: t.coach.sanctions.map(s => (s.type === SanctionType.TWO_MINUTES && s.remainingTime && s.remainingTime > 0) ? { ...s, remainingTime: s.remainingTime - 1 } : s) },
            assistantCoach: t.assistantCoach ? { ...t.assistantCoach, sanctions: t.assistantCoach.sanctions.map(s => (s.type === SanctionType.TWO_MINUTES && s.remainingTime && s.remainingTime > 0) ? { ...s, remainingTime: s.remainingTime - 1 } : s) } : undefined
          });
          
          return { ...prev, timer: nextTimer, isActive: nextActive, homeTeam: updateS(prev.homeTeam), awayTeam: updateS(prev.awayTeam) };
        });
      }
      if (timeoutTimer !== null) { if (timeoutTimer > 0) setTimeoutTimer(p => p !== null ? p - 1 : null); else setTimeoutTimer(null); }
    }, 1000 / timerSpeed);
    return () => clearInterval(timer);
  }, [match?.isActive, timeoutTimer, timerSpeed]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b p-3 sticky top-0 z-[110] flex justify-between items-center shadow-md relative`}>
        {/* Menu & Language */}
        <div className="flex items-center gap-2 relative z-[120]">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className={`p-2 rounded-xl transition-colors ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Menu"
          >
            <Menu size={24} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
          </button>

          {/* Quick Header Language Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-inner">
            <button
              onClick={() => changeLanguage('ar')}
              className={`px-2 py-1 rounded-lg transition-all ${lang === 'ar' ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              title="العربية"
            >
              العربية
            </button>
            <button
              onClick={() => changeLanguage('fr')}
              className={`px-2 py-1 rounded-lg transition-all ${lang === 'fr' ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              title="Français"
            >
              FR
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              title="English"
            >
              EN
            </button>
          </div>

          {isMenuOpen && (
            <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2`}>
              <div className="p-2 space-y-1">
                {/* Language Switcher inside Menu */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-1 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Globe size={16} className="text-blue-500" />
                    <span>{t.language}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { changeLanguage('ar'); setIsMenuOpen(false); }} className={`px-2 py-1 rounded text-xs transition-colors ${lang === 'ar' ? 'bg-blue-600 text-white font-black' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>AR</button>
                    <button onClick={() => { changeLanguage('fr'); setIsMenuOpen(false); }} className={`px-2 py-1 rounded text-xs transition-colors ${lang === 'fr' ? 'bg-blue-600 text-white font-black' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>FR</button>
                    <button onClick={() => { changeLanguage('en'); setIsMenuOpen(false); }} className={`px-2 py-1 rounded text-xs transition-colors ${lang === 'en' ? 'bg-blue-600 text-white font-black' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>EN</button>
                  </div>
                </div>

                {/* PWA Phone Installation in Menu */}
                <div className="pb-1">
                  <PWAInstallButton lang={lang} variant="menu" />
                </div>

                {/* 1. الرئيسية (Home Dashboard) */}
                <button onClick={() => { setView('home'); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-blue-600 dark:text-blue-400">
                  <Trophy size={18} /> {lang === 'ar' ? 'الرئيسية والإحصائيات' : 'Accueil'}
                </button>

                {/* 2. مباراة جديدة / الإعداد */}
                <button onClick={() => { setView('setup_choice'); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                  <Plus size={18} /> {t.newMatch}
                </button>

                {/* 3. المقابلة الحالية إذا كانت نشطة */}
                {match && (
                  <>
                    <button onClick={() => { setView('match'); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      <Play size={18} /> {t.resume}
                    </button>
                    <button onClick={() => { setView('sheet'); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-green-600 dark:text-green-400">
                      <ClipboardList size={18} /> {t.matchSheet}
                    </button>
                    <button onClick={() => { handleOpenAnalysis(match); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      <BarChart3 size={18} /> {lang === 'ar' ? 'تحليل المقابلة والنتائج' : 'Analyse du match'}
                    </button>
                    <button onClick={() => { handleOpenEventsForMatch(match); setIsMenuOpen(false); }} className="w-full text-start flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-3">
                        <History size={18} />
                        <span>{lang === 'ar' ? 'سجل أحداث المقابلة (استيراد/تصدير)' : 'Journal des événements'}</span>
                      </div>
                      <span className="text-[10px] font-black bg-blue-600 text-white rounded-full px-2 py-0.5">
                        {match.events?.length || 0}
                      </span>
                    </button>
                  </>
                )}

                {/* 4. أرشيف المباريات */}
                <button onClick={() => { setView('archive'); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                  <History size={18} /> {t.archive}
                </button>

                {/* 5. جدول المقابلات */}
                <button onClick={() => { handleSettingsClick(); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                  <SettingsIcon size={18} /> {t.scheduleManager}
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                {/* 6. حساب المستخدم */}
                <button onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-blue-600 dark:text-blue-400">
                  <User size={18} /> {currentUser ? `${currentUser.displayName || currentUser.email}` : t.login}
                </button>

                {/* 7. لوحة المسير المركزي (إذا كان مسيراً مركزياً) */}
                {isCentralManager && (
                  <button 
                    onClick={() => { 
                      setSubscriptionModalTab('manager'); 
                      setShowSubscriptionModal(true); 
                      setIsMenuOpen(false); 
                    }} 
                    className="w-full text-start flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 transition-all font-black text-sm text-slate-900 dark:text-white border border-amber-500/40 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <Crown size={16} />
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>لوحة تسيير المنخرطين</span>
                          <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black">المسير</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          تفعيل وغلق الحسابات والمشتركين
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* 8. تفعيل الحساب إذا لم يكن مفعلاً */}
                {!isAccountActive && (
                  <button onClick={() => { setSubscriptionModalTab('activate'); setShowSubscriptionModal(true); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-amber-600 dark:text-amber-400">
                    <Crown size={18} /> {t.license}
                  </button>
                )}

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                {/* 9. إعدادات المظهر واللغة */}
                {!isAccountActive && (
                  <button onClick={() => { setTimerSpeed(prev => prev === 1 ? 10 : 1); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                    <Zap size={18} className={timerSpeed > 1 ? 'text-amber-500' : ''} /> {t.scoreboardSpeed}: {timerSpeed}x
                  </button>
                )}
                <button onClick={() => { setIsDarkMode(!isDarkMode); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-600" />} {isDarkMode ? t.light : t.dark}
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                {/* 10. حول التطبيق */}
                <button onClick={() => { setShowAbout(true); setIsMenuOpen(false); }} className="w-full text-start flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-900 dark:text-slate-100">
                  <Info size={18} /> {t.about}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer pointer-events-none sm:pointer-events-auto" onClick={() => setView('setup_choice')}>
          <Trophy className="text-blue-500" size={24} />
          <h1 className="text-sm font-black uppercase tracking-tight hidden sm:block">HandballScore PRO</h1>
        </div>

        {/* Right / Left End: Account, Subscription Status & Logo */}
        <div className="flex items-center gap-2">
          {/* User Account Login button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-sm hover:scale-105 ${
              currentUser 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
            title={currentUser ? currentUser.email : t.login}
          >
            <User size={14} />
            <span className="hidden sm:inline truncate max-w-[90px]">{currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : t.login}</span>
          </button>

          {/* Install on Phone Button - Automatically hidden when installed on device */}
          <PWAInstallButton lang={lang} variant="header" />

          {/* Activation button: ONLY show if account is NOT active and NOT central manager */}
          {!isAccountActive && !isCentralManager && (
            <button 
              onClick={() => {
                setSubscriptionModalTab('activate');
                setShowSubscriptionModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer shadow-sm hover:scale-105"
              title="تفعيل الحساب (الواتساب)"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">تفعيل الحساب (الواتساب)</span>
              <span className="sm:hidden">تفعيل</span>
            </button>
          )}

          <img 
            src="https://images.weserv.nl/?url=https://tibuafrica.org/wp-content/uploads/2023/07/FRMSS.png&w=100&output=png" 
            alt="FRMSS" 
            className="h-8 sm:h-9 w-auto object-contain" 
            crossOrigin="anonymous"
          />
        </div>
      </header>

      {showSplash && (
        <SplashAnimation onComplete={() => setShowSplash(false)} lang={lang} isDarkMode={isDarkMode} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'home' && (
          <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full h-full overflow-y-auto">
            <HomeDashboard 
              match={match}
              archive={archive}
              schedule={schedule}
              currentUser={currentUser}
              isPro={isAccountActive}
              isCentralManager={isCentralManager}
              subscriberStats={subscriberStats}
              onNavigate={setView}
              onNewMatch={() => setView('setup_choice')}
              onOpenAuth={() => setShowAuthModal(true)}
              onOpenSubscription={() => {
                setSubscriptionModalTab('activate');
                setShowSubscriptionModal(true);
              }}
              onOpenEvents={() => handleOpenEventsForMatch(match)}
              onOpenAnalysis={() => handleOpenAnalysis(match)}
              isDarkMode={isDarkMode}
              lang={lang}
            />
          </div>
        )}

        {view === 'setup_choice' && (
          <div className="p-4 max-w-2xl mx-auto w-full h-full overflow-y-auto">
            <SetupChoice 
              schedule={schedule} 
              onChoice={handleNewMatchChoice} 
              onOpenSubscription={() => {
                setSubscriptionModalTab('activate');
                setShowSubscriptionModal(true);
              }}
              onOpenManagerSettings={() => {
                setSubscriptionModalTab('manager');
                setShowSubscriptionModal(true);
              }}
              currentUser={currentUser}
              onOpenAuth={() => setShowAuthModal(true)}
              isPro={isAccountActive}
              isCentralManager={isCentralManager}
              subscriberStats={subscriberStats}
              isDarkMode={isDarkMode} 
              lang={lang}
            />
          </div>
        )}

        {view === 'setup' && <div className="p-4 max-w-lg mx-auto w-full overflow-y-auto h-full">
            <SetupForm 
                key={editSetupData ? 'edit' : 'new'} 
                onStart={startMatch} 
                isDarkMode={isDarkMode} 
                schedule={schedule} 
                initialMatch={editSetupData ? editSetupData.initialMatch : preSelectedScheduledMatch}
                initialDetails={editSetupData?.initialDetails}
                initialHomePlayers={editSetupData?.initialHomePlayers}
                initialAwayPlayers={editSetupData?.initialAwayPlayers}
                initialHomeCoach={editSetupData?.initialHomeCoach}
                initialAwayCoach={editSetupData?.initialAwayCoach}
                initialHomeAst={editSetupData?.initialHomeAst}
                initialAwayAst={editSetupData?.initialAwayAst}
                initialHomeColor={editSetupData?.initialHomeColor}
                initialAwayColor={editSetupData?.initialAwayColor}
                lang={lang}
            />
        </div>}
        {view === 'admin_schedule' && <div className="p-4 max-w-4xl mx-auto w-full h-full overflow-hidden"><ScheduleManager schedule={schedule} onSave={saveScheduleToLocal} onClose={() => setView('setup_choice')} isDarkMode={isDarkMode} /></div>}
        {view === 'match' && match && <div className="flex flex-col h-full relative overflow-hidden">
            <div className={`flex-shrink-0 z-[100] border-b shadow-xl ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md`}>
              <div className="p-2 max-w-7xl mx-auto flex flex-col gap-2">
                <ScoreBoard 
                    match={match} 
                    onToggleTimer={() => setMatch(m => m ? {...m, isActive: !m.isActive} : null)} 
                    onTimeout={handleTimeout} 
                    onCancelTimeout={handleCancelTimeout} 
                    onFinishMatch={handleFinishMatch} 
                    onPeriodChange={onPeriodChangeRequest}
                    timeoutTimer={timeoutTimer} 
                    breakTimer={null} 
                    isDarkMode={isDarkMode} 
                    lang={lang}
                    selectedTarget={selectedTarget}
                    onScoreGoal={handleScoreBoardGoal}
                    onOpenEvents={() => handleOpenEventsForMatch(match)}
                />
                {matchToast && (
                  <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-black shadow-md transition-all animate-in fade-in slide-in-from-top-1 border ${
                    matchToast.type === 'success' 
                      ? 'bg-emerald-600 text-white border-emerald-500' 
                      : matchToast.type === 'warning'
                      ? 'bg-amber-400 text-slate-950 border-amber-500'
                      : 'bg-blue-600 text-white border-blue-500'
                  }`}>
                    {matchToast.message}
                  </div>
                )}
                {match.period !== MatchPeriod.PENALTIES && (
                   <ActionPanel 
                       match={match} 
                       selectedTarget={selectedTarget} 
                       onAction={handleAction} 
                       onUndo={() => {}} 
                       hasHistory={history.length > 0} 
                       isDarkMode={isDarkMode} 
                       matchActive={match.isActive} 
                       isTimeoutActive={timeoutTimer !== null} 
                       playerSuspended={false} 
                       suspensionDuration={match.config.suspensionDuration}
                       lang={lang}
                   />
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-2 sm:p-4 relative">
              {match.period === MatchPeriod.PENALTIES ? (
                <PenaltyShootout match={match} onShot={handlePenaltyShot} isDarkMode={isDarkMode} />
              ) : (
                <div className={`w-full grid grid-cols-2 gap-2 sm:gap-4 h-full`}>
                    {/* SWAPPED ORDER FOR VISUAL ALIGNMENT WITH SCOREBOARD IN RTL */}
                    <TeamControl team={match.homeTeam} side="home" selectedTarget={selectedTarget} onSelect={setSelectedTarget} isDarkMode={isDarkMode} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onAddPlayer={handleAddPlayer} onUpdateStaff={handleUpdateStaff} onUndoGoal={handleUndoGoal} lang={lang} />
                    <TeamControl team={match.awayTeam} side="away" selectedTarget={selectedTarget} onSelect={setSelectedTarget} isDarkMode={isDarkMode} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onAddPlayer={handleAddPlayer} onUpdateStaff={handleUpdateStaff} onUndoGoal={handleUndoGoal} lang={lang} />
                </div>
              )}
            </div>
          </div>}
        {view === 'sheet' && match && <div className="p-4 h-full overflow-y-auto"><MatchSheet match={match} onUpdate={setMatch} lang={lang} onLanguageChange={changeLanguage} isAccountActive={isAccountActive} onOpenEvents={() => handleOpenEventsForMatch(match)} /></div>}
        {view === 'archive' && <div className="p-4 h-full overflow-y-auto"><ArchiveList matches={archive} isDarkMode={isDarkMode} onSelect={(m) => { setMatch(m); setView('match'); }} onDelete={deleteFromArchive} onOpenEvents={(m) => handleOpenEventsForMatch(m)} onOpenAnalysis={(m) => handleOpenAnalysis(m)} lang={lang} /></div>}
        
        {/* Footer Credit */}
        <div className={`py-2 text-center text-[10px] font-bold ${isDarkMode ? 'bg-slate-900 text-slate-500 border-t border-slate-800' : 'bg-white text-slate-600 border-t border-slate-200'}`}>
           {t.credits}
        </div>
      </main>

      {/* Penalty Setup Modal */}
      {/* ... Penalty Setup Modal content ... */}
      {showPenaltySetup && match && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className={`w-full max-w-md rounded-[2.5rem] border-2 shadow-2xl p-6 relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg shadow-purple-600/30 mx-auto">
                    <Trophy size={32} />
                 </div>
                 <h3 className="text-xl font-black">إعداد رميات 7 أمتار</h3>
                 <p className={`text-xs font-bold mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>يجب تحديد عدد الرميات والقرعة قبل البدء</p>
              </div>

              {/* Number of Shots */}
              <div className="mb-6">
                  <label className={`text-[10px] font-black uppercase block mb-2 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>عدد الرميات (لكل فريق)</label>
                  <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setPenaltyConfig(prev => ({ ...prev, shots: Math.max(1, prev.shots - 1) }))} className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-black text-xl hover:bg-slate-300">-</button>
                      <div className="text-3xl font-black w-16 text-center">{penaltyConfig.shots}</div>
                      <button onClick={() => setPenaltyConfig(prev => ({ ...prev, shots: prev.shots + 1 }))} className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-black text-xl hover:bg-slate-300">+</button>
                  </div>
              </div>

              {/* Coin Toss / Starter Selection */}
              <div className="mb-8">
                   <label className={`text-[10px] font-black uppercase block mb-3 text-center flex items-center justify-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}><Coins size={12}/> القرعة: من سيبدأ الرمي؟</label>
                   <div className="grid grid-cols-2 gap-3">
                       <button 
                           onClick={() => setPenaltyConfig(prev => ({ ...prev, starter: 'home' }))}
                           className={`p-3 rounded-xl border-2 transition-all font-black flex flex-col items-center gap-1 ${penaltyConfig.starter === 'home' ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                       >
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: match.homeTeam.color }} />
                           {match.homeTeam.name}
                       </button>
                       <button 
                           onClick={() => setPenaltyConfig(prev => ({ ...prev, starter: 'away' }))}
                           className={`p-3 rounded-xl border-2 transition-all font-black flex flex-col items-center gap-1 ${penaltyConfig.starter === 'away' ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                       >
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: match.awayTeam.color }} />
                           {match.awayTeam.name}
                       </button>
                   </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={confirmPenaltySetup} disabled={!penaltyConfig.starter} className="py-3 bg-purple-600 text-white font-black rounded-xl shadow-lg hover:bg-purple-500 disabled:opacity-50 transition-colors">بدء الرميات</button>
                 <button onClick={() => setShowPenaltySetup(false)} className={`py-3 font-black rounded-xl border-2 transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-[2.5rem] border-2 shadow-2xl p-8 relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-500/10 rounded-full text-slate-500"><X size={20} /></button>
            <div className="flex flex-col items-center mb-6">
               <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/30"><Lock size={32} /></div>
               <h3 className="text-xl font-black">الدخول للإعدادات</h3>
               <p className={`text-xs font-bold mt-1 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>يرجى إدخال القن السري للمتابعة</p>
            </div>
            <div className="space-y-4">
               <div><label className={`text-[10px] font-black uppercase mb-1 block ${isDarkMode ? 'text-slate-500' : 'text-slate-900'}`}>القن السري</label><input type="password" autoFocus value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={`w-full p-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="••••••••" /></div>
               <button onClick={handleLogin} className="w-full py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors mt-2">دخول</button>
            </div>
          </div>
        </div>
      )}

      {/* Center Password Verification Modal */}
      {showCenterPasswordModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-[2.5rem] border-2 shadow-2xl p-8 relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <button onClick={() => { setShowCenterPasswordModal(false); setPendingScheduledMatch(null); }} className="absolute top-4 right-4 p-2 hover:bg-slate-500/10 rounded-full text-slate-500"><X size={20} /></button>
            <div className="flex flex-col items-center mb-6">
               <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-600/30"><Lock size={32} /></div>
               <h3 className="text-xl font-black">تحقق من المركز</h3>
               <p className="text-xs text-slate-500 font-bold mt-1 text-center">المقابلة في: {pendingScheduledMatch?.lieu}</p>
               <p className="text-[10px] text-amber-500 font-bold mt-1">يرجى إدخال القن السري للمركز للمتابعة</p>
            </div>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">القن السري للمركز</label><input type="password" autoFocus value={centerLoginPass} onChange={e => setCenterLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCenterLogin()} className={`w-full p-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="••••••••" /></div>
               <button onClick={handleCenterLogin} className="w-full py-3 bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-500 transition-colors mt-2">تأكيد الدخول</button>
            </div>
          </div>
        </div>
      )}

      {/* About App Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowAbout(false)}>
           <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative text-center ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-900'}`} onClick={e => e.stopPropagation()}>
               <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-4 rotate-3">
                   <Trophy size={40} strokeWidth={2.5} />
               </div>
               <h2 className="text-2xl font-black mb-1">HandManager PRO</h2>
               <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">الإصدار 5.0.0</p>
               
               <div className="space-y-4 text-sm font-bold leading-relaxed mb-6">
                   <p>تطبيق احترافي لإدارة مباريات كرة اليد، معتمد على القوانين الرسمية.</p>
                   <p className="text-xs text-slate-400">تم التطوير والبرمجة من طرف:</p>
                   <div className="flex flex-col gap-2">
                       <span className="bg-slate-100 dark:bg-slate-800 py-2 rounded-xl">أمين سنوسي</span>
                       <span className="bg-slate-100 dark:bg-slate-800 py-2 rounded-xl">عمر حماني</span>
                   </div>
                   <div className="my-2 p-3 bg-blue-50 dark:bg-slate-800/50 rounded-xl border border-blue-100 dark:border-slate-700">
                      <p className="text-xs text-blue-800 dark:text-blue-300">بتنسيق مع الحكم الوطني في رياضة كرة اليد السيد خالد محجوبي</p>
                   </div>
                   <p className="text-xs text-slate-400">مديرية تاوريرت</p>
               </div>

               <button onClick={() => setShowAbout(false)} className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-xl hover:scale-105 transition-transform">
                   إغلاق
               </button>
           </div>
        </div>
      )}

      {/* Central Manager & WhatsApp Activation Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => {
          setShowSubscriptionModal(false);
          refreshSubscriberStats();
        }} 
        subscription={subscription} 
        onUpdateSubscription={handleUpdateSubscription} 
        currentUser={currentUser}
        onUpdateCurrentUser={(profile) => {
          setCurrentUser(profile);
          refreshSubscriberStats();
          if (profile?.isActive) {
            setSubscription(prev => ({
              ...prev,
              isPro: true,
              licenseKey: profile.activationCode || 'ACTIVE'
            }));
          }
        }}
        isDarkMode={isDarkMode} 
        lang={lang}
        initialTab={subscriptionModalTab}
      />

      {/* User Account & Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        initialMode={authModalInitialMode}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          if (profile?.isActive) {
            setSubscription(prev => ({
              ...prev,
              isPro: true,
              licenseKey: profile.activationCode || 'ACTIVE',
              clubName: profile.clubName
            }));
          }
        }}
        onOpenCentralManager={() => {
          setSubscriptionModalTab('manager');
          setShowSubscriptionModal(true);
        }}
        isDarkMode={isDarkMode}
        lang={lang}
      />

      {/* Account Activation Gate Modal */}
      {showActivationGate && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className={`w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 border-2 shadow-2xl relative text-center animate-in zoom-in duration-200 ${
            isDarkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-amber-400 text-slate-900'
          }`}>
            <button 
              onClick={() => setShowActivationGate(false)} 
              className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full hover:bg-slate-500/10 text-slate-400 transition-colors cursor-pointer`}
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 border ${
              currentUser && !isAccountActive ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
            }`}>
              {currentUser && !isAccountActive ? <Lock size={32} /> : <User size={32} />}
            </div>

            <h3 className="text-xl font-black mb-2">
              {currentUser && !isAccountActive 
                ? (lang === 'ar' ? 'الحساب في انتظار التفعيل أو مغلق' : 'Compte en attente d\'activation') 
                : (lang === 'ar' ? 'تسجيل الدخول إلى التطبيق' : t.activationRequiredTitle)}
            </h3>
            <p className={`text-xs font-bold leading-relaxed mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {activationGateReason || (currentUser && !isAccountActive
                ? (lang === 'ar' ? 'يقوم المسير المركزي بمراجعة وتفعيل الحسابات أو إغلاقها. يمكنك التواصل معه مباشرة لتفعيل حسابك.' : 'Le compte nécessite l\'activation par le gestionnaire.')
                : (lang === 'ar' ? 'تطبيق HandballScore Pro مخصص للمسجلين. يرجى تسجيل الدخول أو فتح حساب جديد للمتابعة.' : t.activationRequiredDesc))}
            </p>

            {currentUser && !isAccountActive ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed text-start space-y-1">
                  <p>👤 <strong>الاسم:</strong> {currentUser.displayName || 'أستاذ'}</p>
                  <p>📧 <strong>البريد:</strong> {currentUser.email}</p>
                  {currentUser.phone && <p>📱 <strong>الهاتف:</strong> {currentUser.phone}</p>}
                  {currentUser.clubName && <p>🏫 <strong>المؤسسة/النادي:</strong> {currentUser.clubName}</p>}
                  <p className="pt-1.5 text-amber-700 dark:text-amber-400 font-black text-[11px] border-t border-amber-500/20">
                    {lang === 'ar' 
                      ? 'لطلب التفعيل الفوري، يرجى مراسلة المسير المركزي مباشرة عبر الواتساب.'
                      : 'Pour activer immédiatement votre compte, veuillez contacter le gestionnaire via WhatsApp.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`السلام عليكم ورحمة الله، أنا الأستاذ: *${currentUser.displayName || currentUser.email}*
البريد الإلكتروني: ${currentUser.email}
رقم الهاتف: ${currentUser.phone || ''}
المؤسسة: ${currentUser.clubName || ''}
لقد سجلت في تطبيق HandballScore Pro، وأطلب منكم التفضل بتفعيل حسابي للاستفادة من مميزات التطبيق. شكراً لكم!`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <MessageSquare size={18} />
                  <span>{lang === 'ar' ? 'مراسلة المسير المركزي عبر الواتساب لتفعيل الحساب' : 'Contacter le gestionnaire WhatsApp'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowActivationGate(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {lang === 'ar' ? 'تسجيل الخروج أو التبديل إلى حساب آخر' : 'Changer de compte'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowActivationGate(false);
                    setAuthModalInitialMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <User size={18} />
                  <span>{lang === 'ar' ? 'تسجيل الدخول إلى حسابك' : t.login}</span>
                </button>

                <button
                  onClick={() => {
                    setShowActivationGate(false);
                    setAuthModalInitialMode('register');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-2xl border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{lang === 'ar' ? 'إنشاء حساب جديد مجاناً' : 'Créer un compte'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Match Events Log & Import Modal */}
      {showEventsModal && (eventsTargetMatch || match) && (
        <MatchEventsModal
          match={eventsTargetMatch || match!}
          onUpdateMatch={handleUpdateEventsMatch}
          onClose={() => {
            setShowEventsModal(false);
            setEventsTargetMatch(null);
          }}
          isDarkMode={isDarkMode}
          lang={lang}
          initialTab={eventsModalInitialTab}
        />
      )}

      {/* Offline Status & Connectivity Monitor */}
      <OfflineIndicator lang={lang} />
    </div>
  );
};
export default App;
