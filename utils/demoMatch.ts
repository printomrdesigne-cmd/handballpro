import { MatchState, MatchPeriod, SanctionType, Player, Officials, MatchDetails, Team, MatchEvent } from '../types.ts';

// Demo sample signatures (minimal inline SVGs converted to data URI)
const sampleSignature1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 25 Q 35 5, 55 20 T 95 15 Q 110 30, 80 35" stroke="%231e3a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
const sampleSignature2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M15 30 Q 30 10, 50 15 T 85 25 Q 105 10, 110 32" stroke="%230f172a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
const sampleSignature3 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 20 Q 40 30, 60 10 T 100 25" stroke="%23047857" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';

export const getDemoMatch = (): MatchState => {
  const homePlayers: Player[] = [
    { id: 'h-1', number: '1', licence: 'FR-88912', name: 'أحمد التازي (حارس)', goals: 0, sanctions: [], isGoalkeeper: true },
    { id: 'h-3', number: '3', licence: 'FR-77201', name: 'ياسين بونوة', goals: 2, sanctions: [] },
    { id: 'h-7', number: '7', licence: 'FR-66514', name: 'حمزة العلوي (عميد)', goals: 5, sanctions: [{ type: SanctionType.YELLOW, timestamp: 420 }], isCaptain: true },
    { id: 'h-9', number: '9', licence: 'FR-55423', name: 'سفيان المراكشي', goals: 4, sanctions: [] },
    { id: 'h-10', number: '10', licence: 'FR-44312', name: 'طارق الإدريسي', goals: 3, sanctions: [] },
    { id: 'h-11', number: '11', licence: 'FR-33201', name: 'عمر الصالحي', goals: 1, sanctions: [] },
    { id: 'h-14', number: '14', licence: 'FR-22190', name: 'مروان البهجة', goals: 2, sanctions: [] },
    { id: 'h-16', number: '16', licence: 'FR-11089', name: 'أيوب الفاسي (حارس)', goals: 0, sanctions: [], isGoalkeeper: true },
    { id: 'h-21', number: '21', licence: 'FR-99878', name: 'رضا الفيلالي', goals: 2, sanctions: [] },
    { id: 'h-23', number: '23', licence: 'FR-88767', name: 'بلال اليعقوبي', goals: 1, sanctions: [] },
    { id: 'h-77', number: '77', licence: 'FR-77656', name: 'وليد السعدي', goals: 1, sanctions: [] },
    { id: 'h-99', number: '99', licence: 'FR-66545', name: 'حسام العلمي', goals: 0, sanctions: [] }
  ];

  const awayPlayers: Player[] = [
    { id: 'a-1', number: '1', licence: 'FR-55112', name: 'كريم الزروالي (حارس)', goals: 0, sanctions: [], isGoalkeeper: true },
    { id: 'a-4', number: '4', licence: 'FR-44223', name: 'مهدي العرائش', goals: 2, sanctions: [] },
    { id: 'a-6', number: '6', licence: 'FR-33334', name: 'زكرياء بنجلون', goals: 3, sanctions: [{ type: SanctionType.YELLOW, timestamp: 610 }] },
    { id: 'a-8', number: '8', licence: 'FR-22445', name: 'بدر الوردي (عميد)', goals: 4, sanctions: [], isCaptain: true },
    { 
      id: 'a-9', 
      number: '9', 
      licence: 'FR-11556', 
      name: 'نبيل البركاوي', 
      goals: 3, 
      sanctions: [{ type: SanctionType.TWO_MINUTES, timestamp: 1380, remainingTime: 75 }] // Active 2-minute suspension with 75 seconds left!
    },
    { id: 'a-12', number: '12', licence: 'FR-99667', name: 'أنس الشرقاوي (حارس)', goals: 0, sanctions: [], isGoalkeeper: true },
    { id: 'a-15', number: '15', licence: 'FR-88778', name: 'يوسف العثماني', goals: 2, sanctions: [] },
    { id: 'a-18', number: '18', licence: 'FR-77889', name: 'عادل السملالي', goals: 3, sanctions: [] },
    { id: 'a-22', number: '22', licence: 'FR-66990', name: 'هشام القادري', goals: 1, sanctions: [] },
    { id: 'a-27', number: '27', licence: 'FR-55001', name: 'إلياس الرباطي', goals: 1, sanctions: [] },
    { id: 'a-30', number: '30', licence: 'FR-44112', name: 'عصام الحسني', goals: 1, sanctions: [] },
    { id: 'a-44', number: '44', licence: 'FR-33223', name: 'فؤاد المودن', goals: 0, sanctions: [] }
  ];

  const homeTeam: Team = {
    name: 'الوداد الرياضي (WAC)',
    color: '#dc2626',
    coach: { name: 'رشيد الطاوسي', sanctions: [] },
    assistantCoach: { name: 'سعيد بنعمر', sanctions: [] },
    players: homePlayers,
    timeoutsUsed: 1,
    timeoutsThisHalf: 1,
    reservations: '',
    signatures: {
      captain: sampleSignature1,
      coach: sampleSignature2
    }
  };

  const awayTeam: Team = {
    name: 'الجيش الملكي (FAR)',
    color: '#16a34a',
    coach: { name: 'عزيز العامري', sanctions: [] },
    assistantCoach: { name: 'عبد الله السبتي', sanctions: [] },
    players: awayPlayers,
    timeoutsUsed: 2,
    timeoutsThisHalf: 1,
    reservations: '',
    signatures: {
      captain: sampleSignature3,
      coach: sampleSignature1
    }
  };

  const officials: Officials = {
    referee1: 'محجوبي خالد (حكم وطني 1)',
    referee2: 'العلمي رشيد (حكم وطني 2)',
    timer: 'أمين سنوسي (ميقاتي)',
    secretary: 'عمر حماني (مسجل)',
    chefCentre: 'المندوب الفيدرالي',
    signatures: {
      referee1: sampleSignature1,
      referee2: sampleSignature2,
      timer: sampleSignature3,
      secretary: sampleSignature1
    }
  };

  const details: MatchDetails = {
    direction: 'الجامعة الملكية المغربية لكرة اليد',
    aref: 'عصبة الرباط سلا القنيطرة',
    categorie: 'الكبار - القسم الممتاز (Seniors Excellence)',
    ville: 'الرباط',
    lieu: 'القاعة المغطاة مولاي عبد الله',
    sexe: 'M',
    numRencontre: 'DEMO-2026-01',
    etape: 'قمة البطولة الوطنية (مباراة تجريبية)',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    matchLink: 'https://handballscore.appsports.store/'
  };

  const events: MatchEvent[] = [
    { id: 'e-1', type: 'GOAL', timestamp: 1350, timeStr: '22:30', team: 'home', playerId: 'h-7', playerName: 'حمزة العلوي', goalType: 'NORMAL' },
    { id: 'e-2', type: 'SANCTION', timestamp: 1380, timeStr: '23:00', team: 'away', playerId: 'a-9', playerName: 'نبيل البركاوي', sanctionType: SanctionType.TWO_MINUTES },
    { id: 'e-3', type: 'GOAL', timestamp: 1410, timeStr: '23:30', team: 'away', playerId: 'a-8', playerName: 'بدر الوردي', goalType: '7M' },
    { id: 'e-4', type: 'GOAL', timestamp: 1435, timeStr: '23:55', team: 'home', playerId: 'h-9', playerName: 'سفيان المراكشي', goalType: 'NORMAL' }
  ];

  return {
    id: 'demo-match-live',
    details,
    homeTeam,
    awayTeam,
    officials,
    timer: 1440, // 24 minutes in (second half)
    isActive: false,
    isFinished: false,
    period: MatchPeriod.SECOND_HALF,
    report: 'مباراة نموذجية تجريبية لاستعراض مميزات النظام: العداد الحي، الإقصاءات 2 دقيقة التلقائية، وورقة التحكيم الرقمية المعتمدة.',
    score: {
      home: 21,
      away: 20,
      homeP1: 12,
      awayP1: 11,
      homeFullTime: undefined,
      awayFullTime: undefined,
      homePenalties: 0,
      awayPenalties: 0
    },
    penaltySequence: { home: [], away: [], currentTurn: 'home' },
    events,
    config: {
      halfDuration: 30 * 60,
      otDuration: 5 * 60,
      penaltyShots: 5,
      suspensionDuration: 120 // 2 minutes
    },
    isDemo: true
  };
};
