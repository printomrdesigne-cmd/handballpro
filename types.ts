
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
