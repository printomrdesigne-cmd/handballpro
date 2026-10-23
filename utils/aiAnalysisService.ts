import { MatchState, AppLanguage } from '../types.ts';
import { MatchAnalysisReport } from './matchAnalysis.ts';

export interface AIMatchAnalysis {
  title: string;
  headline: string;
  narrativeOverview: string;
  turningPoints: string[];
  offensiveAnalysis: string;
  defensiveAnalysis: string;
  mvpEvaluation: {
    playerName: string;
    rating: string;
    verdict: string;
  };
  homeTeamAnalysis: {
    strengths: string[];
    weaknesses: string[];
    coachAdvice: string;
  };
  awayTeamAnalysis: {
    strengths: string[];
    weaknesses: string[];
    coachAdvice: string;
  };
  tacticalRating: {
    intensity: number;
    tacticalDiscipline: number;
    entertainmentValue: number;
  };
  generatedAt?: string;
}

/**
 * Calls the server-side Gemini API to generate an in-depth tactical match analysis.
 */
export const requestAIMatchAnalysis = async (
  match: MatchState,
  stats: MatchAnalysisReport,
  lang: AppLanguage = 'ar'
): Promise<{ success: boolean; analysis?: AIMatchAnalysis; error?: string }> => {
  try {
    const res = await fetch('/api/ai/analyze-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        match,
        analysisStats: stats,
        lang,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.analysis) {
      data.analysis.generatedAt = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { success: true, analysis: data.analysis };
    }

    throw new Error(data.error || 'Invalid analysis payload returned');
  } catch (err: any) {
    console.error('requestAIMatchAnalysis error:', err);
    return {
      success: false,
      error: err?.message || 'حدث خطأ أثناء الاتصال بخدمة التحليل الذكي',
    };
  }
};
