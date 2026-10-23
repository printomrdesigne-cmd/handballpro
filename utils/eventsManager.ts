import { MatchState, MatchEvent, SanctionType, Player, Team } from '../types.ts';

export interface EventsValidationResult {
  valid: boolean;
  events: MatchEvent[];
  errors: string[];
  stats: {
    totalEvents: number;
    homeGoals: number;
    awayGoals: number;
    yellowCards: number;
    twoMinutes: number;
    redCards: number;
    blueCards: number;
    timeoutsHome: number;
    timeoutsAway: number;
  };
}

const formatMMSS = (seconds: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

/**
 * Validates and normalizes raw JSON data containing match events
 */
export const validateAndParseEvents = (input: unknown): EventsValidationResult => {
  const errors: string[] = [];
  let rawData: any = input;

  if (typeof input === 'string') {
    try {
      rawData = JSON.parse(input);
    } catch (e: any) {
      return {
        valid: false,
        events: [],
        errors: [`صيغة JSON غير صالحة: ${e?.message || 'خطأ في التحليل'}`],
        stats: {
          totalEvents: 0,
          homeGoals: 0,
          awayGoals: 0,
          yellowCards: 0,
          twoMinutes: 0,
          redCards: 0,
          blueCards: 0,
          timeoutsHome: 0,
          timeoutsAway: 0
        }
      };
    }
  }

  // Extract events array from various possible wrapper structures
  let eventsArray: any[] = [];
  if (Array.isArray(rawData)) {
    eventsArray = rawData;
  } else if (rawData && typeof rawData === 'object') {
    if (Array.isArray(rawData.events)) {
      eventsArray = rawData.events;
    } else if (rawData.match && Array.isArray(rawData.match.events)) {
      eventsArray = rawData.match.events;
    } else {
      errors.push('لم يتم العثور على مصفوفة أحداث (events array) في البيانات المرسلة.');
    }
  } else {
    errors.push('البيانات المستوردة فارغة أو غير متوافقة.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      events: [],
      errors,
      stats: {
        totalEvents: 0,
        homeGoals: 0,
        awayGoals: 0,
        yellowCards: 0,
        twoMinutes: 0,
        redCards: 0,
        blueCards: 0,
        timeoutsHome: 0,
        timeoutsAway: 0
      }
    };
  }

  const validEvents: MatchEvent[] = [];
  const stats = {
    totalEvents: 0,
    homeGoals: 0,
    awayGoals: 0,
    yellowCards: 0,
    twoMinutes: 0,
    redCards: 0,
    blueCards: 0,
    timeoutsHome: 0,
    timeoutsAway: 0
  };

  eventsArray.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`الحدث رقم ${index + 1} غير صالح أو فارغ.`);
      return;
    }

    // Determine type
    let type: 'GOAL' | 'SANCTION' | 'TIMEOUT' = 'GOAL';
    const rawType = String(item.type || '').toUpperCase();
    if (rawType === 'GOAL' || rawType === 'GOALS' || rawType === 'BUT' || rawType === 'هدف') {
      type = 'GOAL';
    } else if (rawType === 'SANCTION' || rawType === 'CARD' || rawType === 'PENALTY' || rawType === 'عقوبة' || rawType === 'إنذار') {
      type = 'SANCTION';
    } else if (rawType === 'TIMEOUT' || rawType === 'TIME_OUT' || rawType === 'وقت مستقطع') {
      type = 'TIMEOUT';
    } else {
      // Try to infer
      if (item.sanctionType) {
        type = 'SANCTION';
      } else if (item.goalType !== undefined || item.goals !== undefined) {
        type = 'GOAL';
      } else {
        type = 'GOAL';
      }
    }

    // Determine team
    let team: 'home' | 'away' = 'home';
    const rawTeam = String(item.team || '').toLowerCase();
    if (rawTeam === 'home' || rawTeam === 'h' || rawTeam === '1' || rawTeam === 'local') {
      team = 'home';
    } else if (rawTeam === 'away' || rawTeam === 'a' || rawTeam === '2' || rawTeam === 'visitor' || rawTeam === 'visiteur') {
      team = 'away';
    }

    // Timestamp
    let timestamp = Number(item.timestamp);
    if (isNaN(timestamp) || timestamp < 0) {
      if (typeof item.timeStr === 'string' && item.timeStr.includes(':')) {
        const parts = item.timeStr.split(':').map(Number);
        timestamp = (parts[0] || 0) * 60 + (parts[1] || 0);
      } else {
        timestamp = 0;
      }
    }

    const timeStr = item.timeStr || formatMMSS(timestamp);

    const event: MatchEvent = {
      id: String(item.id || generateId()),
      type,
      timestamp,
      timeStr,
      team,
      playerId: item.playerId ? String(item.playerId) : undefined,
      playerName: item.playerName ? String(item.playerName) : undefined
    };

    if (type === 'GOAL') {
      event.goalType = item.goalType === '7M' ? '7M' : 'NORMAL';
      if (team === 'home') stats.homeGoals++;
      else stats.awayGoals++;
    } else if (type === 'SANCTION') {
      let sanctionType: SanctionType = SanctionType.YELLOW;
      const rawSanction = String(item.sanctionType || '').toUpperCase();
      if (rawSanction.includes('TWO') || rawSanction.includes('2') || rawSanction.includes('MIN')) {
        sanctionType = SanctionType.TWO_MINUTES;
        stats.twoMinutes++;
      } else if (rawSanction.includes('RED') || rawSanction.includes('DISQ') || rawSanction.includes('حمراء')) {
        sanctionType = SanctionType.RED;
        stats.redCards++;
      } else if (rawSanction.includes('BLUE') || rawSanction.includes('RAPP') || rawSanction.includes('زرقاء')) {
        sanctionType = SanctionType.BLUE;
        stats.blueCards++;
      } else {
        sanctionType = SanctionType.YELLOW;
        stats.yellowCards++;
      }
      event.sanctionType = sanctionType;
    } else if (type === 'TIMEOUT') {
      if (team === 'home') stats.timeoutsHome++;
      else stats.timeoutsAway++;
    }

    validEvents.push(event);
  });

  stats.totalEvents = validEvents.length;

  return {
    valid: validEvents.length > 0,
    events: validEvents,
    errors,
    stats
  };
};

/**
 * Recalculates match state (scores, player statistics, sanctions, timeouts) based on events list
 */
export const recalculateMatchFromEvents = (
  currentMatch: MatchState,
  newEvents: MatchEvent[],
  mode: 'replace' | 'merge' = 'replace'
): MatchState => {
  let combinedEvents: MatchEvent[] = [];

  if (mode === 'replace') {
    combinedEvents = [...newEvents];
  } else {
    // Merge without duplicates (check ID or composite signature)
    const existingIds = new Set(currentMatch.events.map(e => e.id));
    const merged = [...currentMatch.events];

    for (const ne of newEvents) {
      if (!existingIds.has(ne.id)) {
        // Also check if an identical event exists at the exact same timestamp and team
        const isDuplicate = merged.some(
          e => e.timestamp === ne.timestamp &&
               e.team === ne.team &&
               e.type === ne.type &&
               (e.playerId === ne.playerId || e.playerName === ne.playerName)
        );
        if (!isDuplicate) {
          merged.push(ne);
        }
      }
    }
    combinedEvents = merged;
  }

  // Sort events chronologically (ascending for recalculation)
  const sortedEvents = [...combinedEvents].sort((a, b) => a.timestamp - b.timestamp);

  // Clone teams and reset goals/sanctions to build pristine totals
  const resetTeamPlayers = (team: Team): Team => {
    return {
      ...team,
      timeoutsUsed: 0,
      timeoutsThisHalf: 0,
      coach: {
        ...team.coach,
        sanctions: []
      },
      assistantCoach: team.assistantCoach ? {
        ...team.assistantCoach,
        sanctions: []
      } : undefined,
      players: team.players.map(p => ({
        ...p,
        goals: 0,
        sanctions: []
      }))
    };
  };

  const newHomeTeam = resetTeamPlayers(currentMatch.homeTeam);
  const newAwayTeam = resetTeamPlayers(currentMatch.awayTeam);

  let homeGoalsTotal = 0;
  let awayGoalsTotal = 0;

  // Process all events in order
  for (const event of sortedEvents) {
    const targetTeam = event.team === 'home' ? newHomeTeam : newAwayTeam;

    if (event.type === 'GOAL') {
      if (event.team === 'home') homeGoalsTotal++;
      else awayGoalsTotal++;

      // Attribute goal to player if possible
      let player = targetTeam.players.find(p => p.id === event.playerId);
      if (!player && event.playerName) {
        player = targetTeam.players.find(p => p.name.trim().toLowerCase() === event.playerName?.trim().toLowerCase());
      }
      if (player) {
        player.goals = (player.goals || 0) + 1;
      }
    } else if (event.type === 'SANCTION' && event.sanctionType) {
      let player = targetTeam.players.find(p => p.id === event.playerId);
      if (!player && event.playerName) {
        player = targetTeam.players.find(p => p.name.trim().toLowerCase() === event.playerName?.trim().toLowerCase());
      }

      if (player) {
        const sanctionObj: any = {
          type: event.sanctionType,
          timestamp: event.timestamp
        };
        if (event.sanctionType === SanctionType.TWO_MINUTES) {
          sanctionObj.remainingTime = currentMatch.config.suspensionDuration;
        }
        player.sanctions.push(sanctionObj);
      } else {
        // Assume staff sanction
        targetTeam.coach.sanctions.push({
          type: event.sanctionType,
          timestamp: event.timestamp
        });
      }
    } else if (event.type === 'TIMEOUT') {
      targetTeam.timeoutsUsed += 1;
    }
  }

  // For visual display in list, events are typically displayed newest-first
  const displayEvents = [...sortedEvents].sort((a, b) => b.timestamp - a.timestamp);

  return {
    ...currentMatch,
    homeTeam: newHomeTeam,
    awayTeam: newAwayTeam,
    score: {
      ...currentMatch.score,
      home: homeGoalsTotal,
      away: awayGoalsTotal
    },
    events: displayEvents
  };
};

/**
 * Exports match events as a structured JSON file and downloads it
 */
export const exportEventsAsJSON = (match: MatchState) => {
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

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeName = (match.homeTeam.name + '_vs_' + match.awayTeam.name)
    .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')
    .substring(0, 40);

  const a = document.createElement('a');
  a.href = url;
  a.download = `events_${match.details.numRencontre || 'match'}_${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
