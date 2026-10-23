import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client with required telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Match Analysis Endpoint
app.post('/api/ai/analyze-match', async (req: Request, res: Response) => {
  try {
    const { match, analysisStats, lang = 'ar' } = req.body;

    if (!match || !match.homeTeam || !match.awayTeam) {
      return res.status(400).json({ error: 'Missing match details for analysis' });
    }

    const isRtl = lang === 'ar';
    const homeTeam = match.homeTeam.name || 'الفريق المضيف';
    const awayTeam = match.awayTeam.name || 'الفريق الضيف';
    const score = `${match.score.home + (match.score.homePenalties || 0)} - ${match.score.away + (match.score.awayPenalties || 0)}`;

    const prompt = `
أنت خبير ومحلل فني أول معتمد في رياضة كرة اليد (Handball Technical Analyst & Performance Specialist).
المطلوب تقديم تحليل فني وتكتيكي استثنائي وشامل للمباراة التالية استناداً إلى البيانات والإحصائيات المسجلة.

معلومات المباراة:
- الفريق المضيف: ${homeTeam}
- الفريق الضيف: ${awayTeam}
- النتيجة النهائية: ${score}
- الشوط الأول: ${match.score.homeP1 || 0} - ${match.score.awayP1 || 0}
- الفئة والمنافسة: ${match.details?.categorie || '-'} / ${match.details?.competition || '-'}
- عدد الأحداث المسجلة: ${match.events?.length || 0}
- أطول سلسلة أهداف متتالية: ${analysisStats?.largestRun ? `${analysisStats.largestRun.goalsCount} أهداف لـ ${analysisStats.largestRun.teamName}` : 'متكافئة'}
- إيقافات دقيقتين: ${analysisStats?.twoMinuteImpact ? `${homeTeam}: ${analysisStats.twoMinuteImpact.homeSuspensions} | ${awayTeam}: ${analysisStats.twoMinuteImpact.awaySuspensions}` : '-'}
- أهداف رميات 7 أمتار: ${analysisStats?.sevenMeterGoals ? `${homeTeam}: ${analysisStats.sevenMeterGoals.home} | ${awayTeam}: ${analysisStats.sevenMeterGoals.away}` : '-'}
- أفضل هداف مسجل: ${analysisStats?.mvpPlayer ? `#${analysisStats.mvpPlayer.number} ${analysisStats.mvpPlayer.name} (${analysisStats.mvpPlayer.goals} أهداف)` : 'المجموعة'}

لغة الإجابة المطلوبة: ${isRtl ? 'اللغة العربية الفصحى الرياضية الدقيقة' : 'Français (style expert handball)'}.

يرجى توليد تحليل متعمق واحترافي يغطي:
1. قصة وملخص مجريات اللقاء (Overview & Narrative).
2. نقاط التحول التكتيكية ولحظات الحسم (Tactical Turning Points).
3. الفاعلية الهجومية واستغلال رميات 7م والهجمات الخاطفة (Offensive Efficiency).
4. المنظومة الدفاعية وتأثير الانضباط والإيقافات (Defensive System & Power Play).
5. تقييم أداء اللاعب الأبرز (MVP Verdict).
6. نقاط القوة والضعف لكل من الفريقين.
7. توصيات فنية مستقبلية لمدرب كل فريق (Actionable Recommendations).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: isRtl
          ? 'أنت محلل تكتيكي ومستشار خبير في كرة اليد التنافسية. أسلوبك تحليلي، عميق، دقيق ويستخدم المصطلحات الفنية لكرة اليد (الدفاع 6:0 و 5:1، الهجوم الخاطف، الارتداد الدفاعي، فترات التفوق العددي، التحولات السريعة).'
          : 'Tu es un expert analyste technique de handball de haut niveau. Fournis une analyse tactique rigoureuse, précise et riche en termes techniques (défense 6-0, montées de balle, supériorité numérique, etc.).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'عنوان رئيسي جذاب وجريء للتحليل الفني' },
            headline: { type: Type.STRING, description: 'ملخص موجز في سطر واحد لنتيجة وهوية اللقاء' },
            narrativeOverview: { type: Type.STRING, description: 'فقرة سردية فنية تحليلية شاملة لقراءة سير اللقاء' },
            turningPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'أهم 2 إلى 3 نقاط تحول تكتيكية في المباراة'
            },
            offensiveAnalysis: { type: Type.STRING, description: 'تحليل البناء الهجومي والنجاعة أمام المرمى ورميات 7 أمتار' },
            defensiveAnalysis: { type: Type.STRING, description: 'تحليل التماسك الدفاعي، ارتكاب الأخطاء والانضباط في فترات النقص العددي' },
            mvpEvaluation: {
              type: Type.OBJECT,
              properties: {
                playerName: { type: Type.STRING },
                rating: { type: Type.STRING },
                verdict: { type: Type.STRING }
              },
              required: ['playerName', 'rating', 'verdict']
            },
            homeTeamAnalysis: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                coachAdvice: { type: Type.STRING }
              },
              required: ['strengths', 'weaknesses', 'coachAdvice']
            },
            awayTeamAnalysis: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                coachAdvice: { type: Type.STRING }
              },
              required: ['strengths', 'weaknesses', 'coachAdvice']
            },
            tacticalRating: {
              type: Type.OBJECT,
              properties: {
                intensity: { type: Type.NUMBER, description: 'تقييم الشدة البدنية من 10' },
                tacticalDiscipline: { type: Type.NUMBER, description: 'تقييم الانضباط التكتيكي من 10' },
                entertainmentValue: { type: Type.NUMBER, description: 'القيمة الجمالية والفرجوية من 10' }
              },
              required: ['intensity', 'tacticalDiscipline', 'entertainmentValue']
            }
          },
          required: [
            'title',
            'headline',
            'narrativeOverview',
            'turningPoints',
            'offensiveAnalysis',
            'defensiveAnalysis',
            'mvpEvaluation',
            'homeTeamAnalysis',
            'awayTeamAnalysis',
            'tacticalRating'
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from AI model');
    }

    const parsedData = JSON.parse(text);
    return res.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-match:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to generate AI match analysis' 
    });
  }
});

// Vite or Static handling
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
