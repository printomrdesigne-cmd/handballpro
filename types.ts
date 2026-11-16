
export enum SanctionType {
  YELLOW = 'YELLOW',
  TWO_MINUTES = 'TWO_MINUTES',
  RED = 'RED',
  BLUE = 'BLUE'
}

export interface Sanction {
  type: SanctionType;
  timestamp: number;
  remainingTime?: number;
}

export interface Player {
  id: string;
  number: string;
  licence: string; // New: Massar/Licence number
  name: string;
  goals: number;
  sanctions: Sanction[];
  isCaptain?: boolean;
  isGoalkeeper?: boolean;
}

export interface Staff {
  name: string;
  sanctions: Sanction[];
}

export interface TeamSignatures {
  captain?: string; // Base64 image data
  coach?: string;   // Base64 image data
}

export interface Team {
  name: string;
  color: string;
  coach: Staff;
  assistantCoach?: Staff;
  // Doctor removed as requested
  reservations?: string; // New: Team protests/reservations
  players: Player[];
  timeoutsUsed: number;
  timeoutsThisHalf: number;
  signatures?: TeamSignatures;
}

export enum MatchPeriod {
  FIRST_HALF = 'الشوط الأول',
  BREAK = 'استراحة',
  SECOND_HALF = 'الشوط الثاني',
  OT1_H1 = 'إضافي 1 - شوط 1',
  OT1_H2 = 'إضافي 1 - شوط 2',
  OT2_H1 = 'إضافي 2 - شوط 1',
  OT2_H2 = 'إضافي 2 - شوط 2',
  PENALTIES = 'رميات 7 متر'
}

export interface PenaltyShot {
  playerId: string;
  playerName: string;
  playerNumber: string;
  goal: boolean;
}

export interface MatchDetails {
  direction: string;
  aref: string;
  ligue?: string;
  competition?: string;
  categorie: string;
  ville: string;
  lieu: string;
  sexe: 'M' | 'F' | 'X';
  numRencontre: string;
  etape: string;
  date: string;
  time: string;
  round?: string;
  matchLink?: string; 
}

export interface OfficialsSignatures {
  referee1?: string;
  referee2?: string;
  timer?: string;
  secretary?: string;
}

export interface Officials {
  referee1: string;
  referee2: string;
  timer: string;
  secretary: string;
  chefCentre: string;
  signatures?: OfficialsSignatures;
}

export interface MatchEvent {
  id: string;
  type: 'GOAL' | 'SANCTION' | 'TIMEOUT';
  timestamp: number;
  timeStr: string;
  team: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  sanctionType?: SanctionType;
  goalType?: 'NORMAL' | '7M';
}

export interface MatchState {
  id: string;
  details: MatchDetails;
  homeTeam: Team;
  awayTeam: Team;
  officials: Officials;
  timer: number;
  isActive: boolean;
  isFinished?: boolean;
  period: MatchPeriod;
  report: string;
  score: { 
    home: number; 
    away: number;
    homeP1: number;
    awayP1: number;
    homeFullTime?: number;
    awayFullTime?: number;
    homeOT?: number; 
    awayOT?: number;
    homeOT2?: number; // New for OT2 Sheet
    awayOT2?: number; // New for OT2 Sheet
    homePenalties: number;
    awayPenalties: number;
  };
  penaltySequence: {
    home: PenaltyShot[];
    away: PenaltyShot[];
    currentTurn: 'home' | 'away';
  };
  events: MatchEvent[];
  aiAnalysis?: any;
  config: { 
    halfDuration: number; 
    otDuration: number; 
    penaltyShots: number;
    suspensionDuration: number; // New: 60 or 120 seconds
  };
  isDemo?: boolean;
}

export interface ScheduledMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  lieu: string;
  category: string;
  officials: Officials;
  centerPassword?: string;
  isDemo?: boolean;
}

export interface SubscriptionPlan {
  id: 'club_yearly' | 'tournament' | 'league';
  name: string;
  nameAr: string;
  price: string;
  priceDh: string;
  period: string;
  periodAr: string;
  badge?: string;
  badgeAr?: string;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  recommended?: boolean;
  storeUrl: string;
}

export interface SubscriptionState {
  isPro: boolean;
  planId?: string;
  licenseKey?: string;
  activatedAt?: string;
  expiresAt?: string;
  buyerName?: string;
  clubName?: string;
}

export type AppLanguage = 'ar' | 'fr' | 'en';

export type SubscriptionFeatureKey =
  | 'newMatch'
  | 'liveMatch'
  | 'scheduleManager'
  | 'archive'
  | 'matchSheetPdf'
  | 'excelExport'
  | 'matchAnalysis'
  | 'aiAnalysis'
  | 'socialPoster'
  | 'eventsLog'
  | 'customBranding';

export type SubscriberFeaturesConfig = Record<SubscriptionFeatureKey, boolean>;
export type SubscriberFeatureOverrideMap = Partial<SubscriberFeaturesConfig>;

export interface GlobalFeaturesConfig {
  features: SubscriberFeaturesConfig;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SUBSCRIBER_FEATURES: SubscriberFeaturesConfig = {
  newMatch: true,
  liveMatch: true,
  scheduleManager: true,
  archive: true,
  matchSheetPdf: true,
  excelExport: true,
  matchAnalysis: true,
  aiAnalysis: true,
  socialPoster: true,
  eventsLog: true,
  customBranding: true
};

export interface SubscriptionFeatureCatalogItem {
  key: SubscriptionFeatureKey;
  labelAr: string;
  labelFr: string;
  descAr: string;
  descFr: string;
  category: 'core' | 'export' | 'analysis' | 'custom';
}

export const SUBSCRIPTION_FEATURES_CATALOG: SubscriptionFeatureCatalogItem[] = [
  {
    key: 'newMatch',
    labelAr: 'إعداد وإنشاء مباراة جديدة',
    labelFr: 'Configuration & Nouveau Match',
    descAr: 'السماح للمشترك بإنشاء مباريات جديدة وإدخال لوائح اللاعبين والحكام',
    descFr: 'Créer de nouveaux matchs et configurer les équipes',
    category: 'core'
  },
  {
    key: 'liveMatch',
    labelAr: 'إدارة المباراة المباشرة واللوحة',
    labelFr: 'Match en Direct & Tableau',
    descAr: 'الوصول إلى لوحة التسجيل المباشر والمؤقت وإدارة العقوبات',
    descFr: 'Tableau de score en direct, chronomètre et sanctions',
    category: 'core'
  },
  {
    key: 'scheduleManager',
    labelAr: 'جدول المباريات المبرمجة',
    labelFr: 'Planning & Matchs Programmés',
    descAr: 'استيراد وبرمجة مباريات المراكز والبطولات',
    descFr: 'Programmer et charger des matchs planifiés',
    category: 'core'
  },
  {
    key: 'archive',
    labelAr: 'أرشيف المباريات المحفوظة',
    labelFr: 'Archive des Matchs',
    descAr: 'الاطلاع على سجل المباريات السابقة وإعادة فتحها',
    descFr: 'Consulter et rouvrir les matchs archivés',
    category: 'core'
  },
  {
    key: 'matchSheetPdf',
    labelAr: 'ورقة المباراة الرسمية A4 (PDF/طباعة)',
    labelFr: 'Feuille de Match A4 (PDF/Impression)',
    descAr: 'عرض وتصدير ورقة التحكيم الرسمية بصيغة PDF أو صورة',
    descFr: 'Générer et imprimer la feuille de match officielle',
    category: 'export'
  },
  {
    key: 'excelExport',
    labelAr: 'تصدير بيانات المباراة (Excel / CSV)',
    labelFr: 'Export Excel / CSV',
    descAr: 'تصدير لوائح الأهداف والإحصائيات بصيغة إكسل',
    descFr: 'Exporter les statistiques et résultats vers Excel',
    category: 'export'
  },
  {
    key: 'matchAnalysis',
    labelAr: 'تقرير التحليل الفني والإحصائي (PDF)',
    labelFr: 'Rapport d\'Analyse Technique (PDF)',
    descAr: 'تحليل الأهداف والإقصاءات وتوليد تقرير PDF نصي منسق',
    descFr: 'Analyse statistique détaillée et rapport PDF structuré',
    category: 'analysis'
  },
  {
    key: 'aiAnalysis',
    labelAr: 'التحليل التكتيكي بالذكاء الاصطناعي',
    labelFr: 'Analyse Tactique IA',
    descAr: 'توليد قراءة فنية وتكتيكية ذكية للمباراة',
    descFr: 'Synthèse tactique automatique du match',
    category: 'analysis'
  },
  {
    key: 'socialPoster',
    labelAr: 'بطاقة ملخص المباراة (Poster)',
    labelFr: 'Affiche Résumé Social (Poster)',
    descAr: 'إنشاء وتصدير صورة احترافية لنتيجة المباراة للنشر',
    descFr: 'Créer un visuel professionnel pour les réseaux sociaux',
    category: 'export'
  },
  {
    key: 'eventsLog',
    labelAr: 'سجل أحداث المباراة التفصيلي',
    labelFr: 'Journal des Événements',
    descAr: 'تتبع التسلسل الزمني للأهداف والإنذارات والإقصاءات',
    descFr: 'Historique chronologique complet des actions',
    category: 'analysis'
  },
  {
    key: 'customBranding',
    labelAr: 'تخصيص الشعار والرأسية الرسمية',
    labelFr: 'Logo & En-tête Personnalisés',
    descAr: 'رفع شعار النادي أو الجامعة وتعديل رأسية الورقة الرسمية',
    descFr: 'Personnaliser le logo et l\'en-tête officiel',
    category: 'custom'
  }
];

