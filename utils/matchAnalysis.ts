import { MatchState, MatchEvent, SanctionType, Player, AppLanguage } from '../types.ts';

export interface ScoringRun {
  team: 'home' | 'away';
  teamName: string;
  goalsCount: number;
  startTimeStr: string;
  endTimeStr: string;
}

export interface PlayerPerformance {
  id: string;
  number: string;
  name: string;
  team: 'home' | 'away';
  goals: number;
  penaltyGoals: number;
  yellowCards: number;
  twoMinutes: number;
  redCards: number;
  blueCards: number;
  impactScore: number; // calculated rating
}

export interface MatchAnalysisReport {
  matchId: string;
  title: string;
  date: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
  finalScore: { home: number; away: number };
  winner: string;
  winnerSide: 'home' | 'away' | 'draw';

  // Period Analysis
  firstHalf: { home: number; away: number; winner: string };
  secondHalf: { home: number; away: number; winner: string };
  penalties: { home: number; away: number };

  // Momentum
  maxLeadHome: number;
  maxLeadAway: number;
  leadChanges: number;
  largestRun: ScoringRun | null;
  scoringPaceMinutesPerGoal: number;

  // Efficiency & Tactics
  sevenMeterGoals: { home: number; away: number };
  twoMinuteImpact: {
    homeSuspensions: number;
    awaySuspensions: number;
    homePenaltyMinutes: number;
    awayPenaltyMinutes: number;
  };
  timeoutsEffectiveness: {
    homeTimeouts: number;
    awayTimeouts: number;
    homeScoredAfterTimeout: number;
    awayScoredAfterTimeout: number;
  };

  // Top Performers
  mvpPlayer: PlayerPerformance | null;
  topHomeScorers: PlayerPerformance[];
  topAwayScorers: PlayerPerformance[];
  allPlayersRanked: PlayerPerformance[];

  // Narrative Insights
  tacticalInsightsAr: string[];
  tacticalInsightsFr: string[];
  narrativeSummaryAr: string;
  narrativeSummaryFr: string;
}

/**
 * Analyzes match events and statistics to produce an in-depth tactical and technical breakdown
 */
export const analyzeMatch = (match: MatchState, lang: AppLanguage = 'ar'): MatchAnalysisReport => {
  const isRtl = lang === 'ar';
  const homeColor = match.homeTeam.color || '#2563eb';
  const awayColor = match.awayTeam.color || '#059669';
  const homeGoals = match.score.home + (match.score.homePenalties || 0);
  const awayGoals = match.score.away + (match.score.awayPenalties || 0);

  const winnerSide: 'home' | 'away' | 'draw' =
    homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : 'draw';
  const winner =
    winnerSide === 'home'
      ? match.homeTeam.name
      : winnerSide === 'away'
      ? match.awayTeam.name
      : isRtl ? 'تعادل عادل' : 'Match Nul';

  const homeP1 = match.score.homeP1 || 0;
  const awayP1 = match.score.awayP1 || 0;
  const homeP2 = Math.max(0, match.score.home - homeP1);
  const awayP2 = Math.max(0, match.score.away - awayP1);

  // Chronological events
  const sortedEvents = [...match.events].sort((a, b) => a.timestamp - b.timestamp);

  // 1. Scoring Momentum & Runs
  let currentRunningScoreHome = 0;
  let currentRunningScoreAway = 0;
  let maxLeadHome = 0;
  let maxLeadAway = 0;
  let leadChanges = 0;
  let lastLeader: 'home' | 'away' | 'tie' = 'tie';

  let currentRunTeam: 'home' | 'away' | null = null;
  let currentRunCount = 0;
  let currentRunStart = '00:00';
  let largestRun: ScoringRun | null = null;

  let sevenMeterHome = 0;
  let sevenMeterAway = 0;

  sortedEvents.forEach((evt) => {
    if (evt.type === 'GOAL') {
      if (evt.team === 'home') {
        currentRunningScoreHome++;
        if (evt.goalType === '7M') sevenMeterHome++;

        if (currentRunTeam === 'home') {
          currentRunCount++;
        } else {
          currentRunTeam = 'home';
          currentRunCount = 1;
          currentRunStart = evt.timeStr;
        }
      } else {
        currentRunningScoreAway++;
        if (evt.goalType === '7M') sevenMeterAway++;

        if (currentRunTeam === 'away') {
          currentRunCount++;
        } else {
          currentRunTeam = 'away';
          currentRunCount = 1;
          currentRunStart = evt.timeStr;
        }
      }

      // Check longest run
      if (!largestRun || currentRunCount > largestRun.goalsCount) {
        largestRun = {
          team: currentRunTeam!,
          teamName: currentRunTeam === 'home' ? match.homeTeam.name : match.awayTeam.name,
          goalsCount: currentRunCount,
          startTimeStr: currentRunStart,
          endTimeStr: evt.timeStr
        };
      }

      // Check Lead
      const diff = currentRunningScoreHome - currentRunningScoreAway;
      if (diff > maxLeadHome) maxLeadHome = diff;
      if (-diff > maxLeadAway) maxLeadAway = -diff;

      const currentLeader: 'home' | 'away' | 'tie' =
        diff > 0 ? 'home' : diff < 0 ? 'away' : 'tie';

      if (currentLeader !== 'tie' && lastLeader !== 'tie' && currentLeader !== lastLeader) {
        leadChanges++;
      }
      if (currentLeader !== 'tie') {
        lastLeader = currentLeader;
      }
    }
  });

  // Calculate goal pace
  const totalDurationSecs = Math.max(60, match.timer);
  const totalGoalsCount = homeGoals + awayGoals;
  const scoringPaceMinutesPerGoal =
    totalGoalsCount > 0 ? parseFloat(((totalDurationSecs / 60) / totalGoalsCount).toFixed(1)) : 0;

  // 2. Player Performance Mapping
  const processPlayer = (p: Player, team: 'home' | 'away'): PlayerPerformance => {
    const yellowCards = p.sanctions.filter((s) => s.type === SanctionType.YELLOW).length;
    const twoMinutes = p.sanctions.filter((s) => s.type === SanctionType.TWO_MINUTES).length;
    const redCards = p.sanctions.filter((s) => s.type === SanctionType.RED).length;
    const blueCards = p.sanctions.filter((s) => s.type === SanctionType.BLUE).length;

    // Count 7m goals for this player
    const penaltyGoals = sortedEvents.filter(
      (e) => e.type === 'GOAL' && e.goalType === '7M' && (e.playerId === p.id || e.playerName?.includes(p.name))
    ).length;

    // Impact formula: Goals * 3 + (Penalties * 1.5) - (Yellow * 1) - (2min * 2) - (Red * 5)
    const impactScore = Math.max(
      0,
      p.goals * 3 + penaltyGoals * 1.5 - yellowCards * 0.5 - twoMinutes * 1.5 - redCards * 4
    );

    return {
      id: p.id,
      number: p.number,
      name: p.name,
      team,
      goals: p.goals,
      penaltyGoals,
      yellowCards,
      twoMinutes,
      redCards,
      blueCards,
      impactScore: parseFloat(impactScore.toFixed(1))
    };
  };

  const homePerformances = match.homeTeam.players.map((p) => processPlayer(p, 'home'));
  const awayPerformances = match.awayTeam.players.map((p) => processPlayer(p, 'away'));

  const allPlayersRanked = [...homePerformances, ...awayPerformances].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.impactScore - a.impactScore;
  });

  const mvpPlayer = allPlayersRanked.length > 0 && allPlayersRanked[0].goals > 0 ? allPlayersRanked[0] : null;

  const topHomeScorers = [...homePerformances]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 4);

  const topAwayScorers = [...awayPerformances]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 4);

  // 3. Discipline & Suspensions
  const homeSuspensions = homePerformances.reduce((acc, p) => acc + p.twoMinutes, 0);
  const awaySuspensions = awayPerformances.reduce((acc, p) => acc + p.twoMinutes, 0);

  // 4. Timeouts & Conversion
  let homeScoredAfterTimeout = 0;
  let awayScoredAfterTimeout = 0;

  sortedEvents.forEach((evt, idx) => {
    if (evt.type === 'TIMEOUT') {
      const timeoutTime = evt.timestamp;
      // Look forward up to 120 seconds for a goal by the same team
      for (let j = idx + 1; j < sortedEvents.length; j++) {
        const nextEvt = sortedEvents[j];
        if (nextEvt.timestamp - timeoutTime > 120) break;
        if (nextEvt.type === 'GOAL' && nextEvt.team === evt.team) {
          if (evt.team === 'home') homeScoredAfterTimeout++;
          else awayScoredAfterTimeout++;
          break;
        }
      }
    }
  });

  // 5. Tactical Insights Generation
  const insightsAr: string[] = [];
  const insightsFr: string[] = [];

  // Goal rhythm
  if (scoringPaceMinutesPerGoal > 0) {
    insightsAr.push(`إيقاع تهديفي مرتفع بمعدل هدف كل ${scoringPaceMinutesPerGoal} دقيقة.`);
    insightsFr.push(`Rythme offensif soutenu avec 1 but toutes les ${scoringPaceMinutesPerGoal} minutes.`);
  }

  // Scoring runs
  if (largestRun && largestRun.goalsCount >= 3) {
    insightsAr.push(
      `أفضل سلسلة تهديفية كانت لصالح ${largestRun.teamName} بتسجيل ${largestRun.goalsCount} أهداف متتالية دون رد بين الدقيقة [${largestRun.startTimeStr}] و [${largestRun.endTimeStr}].`
    );
    insightsFr.push(
      `Meilleure série offensive pour ${largestRun.teamName} avec ${largestRun.goalsCount} buts consécutifs sans encaisser entre [${largestRun.startTimeStr}] et [${largestRun.endTimeStr}].`
    );
  }

  // First half vs Second half
  if (homeP2 > homeP1 && winnerSide === 'home') {
    insightsAr.push(`فريق ${match.homeTeam.name} أظهر تحسناً تكتيكياً ملحوظاً في الشوط الثاني حيث رفع حصيلته بـ +${homeP2 - homeP1} أهداف.`);
    insightsFr.push(`Progression tactique nette pour ${match.homeTeam.name} en 2ème mi-temps (+${homeP2 - homeP1} buts).`);
  } else if (awayP2 > awayP1 && winnerSide === 'away') {
    insightsAr.push(`فريق ${match.awayTeam.name} حسم اللقاء بفضل نجاعة هجومية أقوى خلال الشوط الثاني بـ +${awayP2 - awayP1} أهداف.`);
    insightsFr.push(`Accélération décisive de ${match.awayTeam.name} en 2ème mi-temps (+${awayP2 - awayP1} buts).`);
  }

  // Discipline impact
  if (homeSuspensions > awaySuspensions + 2) {
    insightsAr.push(`فريق ${match.homeTeam.name} عانى من كثرة الإيقافات المؤقتة (${homeSuspensions * 2} دقيقة نقص عددي)، مما أثر على مردوده الدفاعي.`);
    insightsFr.push(`${match.homeTeam.name} a été pénalisé par les exclusions temporaires (${homeSuspensions * 2} min d'infériorité numérique).`);
  } else if (awaySuspensions > homeSuspensions + 2) {
    insightsAr.push(`فريق ${match.awayTeam.name} ارتكب أخطاء دفاعية كلفته ${awaySuspensions * 2} دقيقة من النقص العددي.`);
    insightsFr.push(`${match.awayTeam.name} a concédé ${awaySuspensions * 2} minutes d'infériorité numérique.`);
  }

  // 7m efficiency
  if (sevenMeterHome > 0 || sevenMeterAway > 0) {
    insightsAr.push(`سجلت المقابلة ${sevenMeterHome + sevenMeterAway} هدفاً ناجحاً من رميات 7 أمتار (${sevenMeterHome} للمضيف و ${sevenMeterAway} للضيف).`);
    insightsFr.push(`${sevenMeterHome + sevenMeterAway} jets de 7 mètres réussis (${sevenMeterHome} domicile, ${sevenMeterAway} extérieur).`);
  }

  // Narrative summary paragraph
  const topScorerName = mvpPlayer ? `#${mvpPlayer.number} ${mvpPlayer.name} (${mvpPlayer.goals} أهداف)` : 'المجموعة ككل';
  const topScorerNameFr = mvpPlayer ? `#${mvpPlayer.number} ${mvpPlayer.name} (${mvpPlayer.goals} buts)` : 'l\'équipe';

  const narrativeSummaryAr = `شهدت هذه المقابلة ندية تكتيكية وبدنية بين فريقي ${match.homeTeam.name} و ${match.awayTeam.name}. انتهى اللقاء بفوز ${winner} بنتيجة (${homeGoals} - ${awayGoals}). تألق في الجانب الهجومي اللاعب ${topScorerName}. على الصعيد الدفاعي، تميز اللقاء بـ ${homeSuspensions + awaySuspensions} فترات إيقاف دقيقتين مع انضباط عام في الأوقات الحاسمة. استطاع الفريق الفائز استثمار التحولات السريعة والهجمات المنظمة لإحكام السيطرة على مجريات اللعب.`;

  const narrativeSummaryFr = `Rencontre intense sur le plan physique et tactique entre ${match.homeTeam.name} et ${match.awayTeam.name}. Victoire de ${winner} sur le score de (${homeGoals} - ${awayGoals}). Meilleur réalisateur : ${topScorerNameFr}. La discipline a comptabilisé ${homeSuspensions + awaySuspensions} exclusions de 2 minutes. L'équipe victorieuse a su capitaliser sur les transitions rapides et une solidité défensive en fin de match.`;

  return {
    matchId: match.id,
    title: `${match.homeTeam.name} ضد ${match.awayTeam.name}`,
    date: match.details?.date || '',
    venue: match.details?.lieu || '',
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    homeColor,
    awayColor,
    finalScore: { home: homeGoals, away: awayGoals },
    winner,
    winnerSide,
    firstHalf: {
      home: homeP1,
      away: awayP1,
      winner: homeP1 > awayP1 ? match.homeTeam.name : awayP1 > homeP1 ? match.awayTeam.name : 'تعادل'
    },
    secondHalf: {
      home: homeP2,
      away: awayP2,
      winner: homeP2 > awayP2 ? match.homeTeam.name : awayP2 > homeP2 ? match.awayTeam.name : 'تعادل'
    },
    penalties: {
      home: match.score.homePenalties || 0,
      away: match.score.awayPenalties || 0
    },
    maxLeadHome,
    maxLeadAway,
    leadChanges,
    largestRun,
    scoringPaceMinutesPerGoal,
    sevenMeterGoals: { home: sevenMeterHome, away: sevenMeterAway },
    twoMinuteImpact: {
      homeSuspensions,
      awaySuspensions,
      homePenaltyMinutes: homeSuspensions * 2,
      awayPenaltyMinutes: awaySuspensions * 2
    },
    timeoutsEffectiveness: {
      homeTimeouts: match.homeTeam.timeoutsUsed || 0,
      awayTimeouts: match.awayTeam.timeoutsUsed || 0,
      homeScoredAfterTimeout,
      awayScoredAfterTimeout
    },
    mvpPlayer,
    topHomeScorers,
    topAwayScorers,
    allPlayersRanked,
    tacticalInsightsAr: insightsAr,
    tacticalInsightsFr: insightsFr,
    narrativeSummaryAr,
    narrativeSummaryFr
  };
};
