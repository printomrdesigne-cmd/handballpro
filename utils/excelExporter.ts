import { MatchState, MatchEvent, SanctionType, AppLanguage } from '../types.ts';

/**
 * Generates and downloads a rich, beautifully styled Excel spreadsheet (.xls)
 * featuring colored headers, team colors, player breakdown, match events log,
 * and statistical analysis with full Arabic RTL support.
 */
export const exportMatchToExcel = (match: MatchState, lang: AppLanguage = 'ar') => {
  const isRtl = lang === 'ar';
  const homeColor = match.homeTeam.color || '#2563eb';
  const awayColor = match.awayTeam.color || '#059669';

  // Compute stats
  const homeGoals = match.score.home + (match.score.homePenalties || 0);
  const awayGoals = match.score.away + (match.score.awayPenalties || 0);
  
  const homeYellows = match.homeTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.YELLOW).length, 0);
  const awayYellows = match.awayTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.YELLOW).length, 0);

  const homeTwoMins = match.homeTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length, 0);
  const awayTwoMins = match.awayTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length, 0);

  const homeReds = match.homeTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.RED).length, 0);
  const awayReds = match.awayTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.RED).length, 0);

  const homeBlues = match.homeTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.BLUE).length, 0);
  const awayBlues = match.awayTeam.players.reduce((acc, p) => acc + p.sanctions.filter(s => s.type === SanctionType.BLUE).length, 0);

  const winner = homeGoals > awayGoals 
    ? match.homeTeam.name 
    : awayGoals > homeGoals 
    ? match.awayTeam.name 
    : (lang === 'ar' ? 'تعادل' : 'Match Nul');

  // Sort events chronologically
  const sortedEvents = [...match.events].sort((a, b) => a.timestamp - b.timestamp);

  // Build HTML table for Excel
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${lang === 'ar' ? 'تقرير وتحليل المقابلة' : 'Rapport du Match'}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 20px; }
        .main-title { background-color: #0f172a; color: #ffffff; font-size: 18pt; font-weight: bold; text-align: center; padding: 12px; }
        .sub-title { background-color: #334155; color: #f8fafc; font-size: 11pt; text-align: center; padding: 6px; }
        .section-title { background-color: #e2e8f0; color: #0f172a; font-size: 13pt; font-weight: bold; padding: 8px; border-bottom: 2px solid #94a3b8; }
        
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 10pt; text-align: center; padding: 8px; border: 1px solid #64748b; }
        td { font-size: 9.5pt; text-align: center; padding: 6px; border: 1px solid #cbd5e1; }
        
        .home-header { background-color: ${homeColor}; color: #ffffff; font-weight: bold; font-size: 12pt; text-align: center; }
        .away-header { background-color: ${awayColor}; color: #ffffff; font-weight: bold; font-size: 12pt; text-align: center; }
        .score-box { background-color: #047857; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; }
        
        .kpi-title { background-color: #f1f5f9; font-weight: bold; color: #475569; }
        .kpi-value-home { background-color: #eff6ff; color: #1e40af; font-weight: bold; font-size: 11pt; }
        .kpi-value-away { background-color: #f0fdf4; color: #166534; font-weight: bold; font-size: 11pt; }
        
        .goal-badge { background-color: #dcfce7; color: #15803d; font-weight: bold; }
        .yellow-badge { background-color: #fef9c3; color: #a16207; font-weight: bold; }
        .twomin-badge { background-color: #ffedd5; color: #c2410c; font-weight: bold; }
        .red-badge { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
        .blue-badge { background-color: #dbeafe; color: #1d4ed8; font-weight: bold; }
        .timeout-badge { background-color: #f3e8ff; color: #7e22ce; font-weight: bold; }
      </style>
    </head>
    <body dir="${isRtl ? 'rtl' : 'ltr'}">
      
      <!-- 1. HEADER SECTION -->
      <table>
        <tr>
          <td colspan="6" class="main-title">
            ${lang === 'ar' ? 'تقرير وتحليل مباراة كرة اليد الرسمية — HandManager PRO' : 'Rapport & Analyse Officielle du Match — HandManager PRO'}
          </td>
        </tr>
        <tr>
          <td colspan="6" class="sub-title">
            ${match.details?.competition || (lang === 'ar' ? 'بطولة كرة اليد' : 'Compétition')} | 
            ${lang === 'ar' ? 'الفئة:' : 'Catégorie:'} ${match.details?.categorie || '-'} | 
            ${lang === 'ar' ? 'التاريخ:' : 'Date:'} ${match.details?.date || '-'} | 
            ${lang === 'ar' ? 'القاعة:' : 'Lieu:'} ${match.details?.lieu || '-'} | 
            ${lang === 'ar' ? 'رقم المقابلة:' : 'N°:'} ${match.details?.numRencontre || '-'}
          </td>
        </tr>
      </table>

      <!-- 2. FINAL SCORE SUMMARY BANNER -->
      <table>
        <tr>
          <th colspan="2" class="home-header">${match.homeTeam.name}</th>
          <th colspan="2" class="score-box">${homeGoals} — ${awayGoals}</th>
          <th colspan="2" class="away-header">${match.awayTeam.name}</th>
        </tr>
        <tr>
          <td colspan="2" style="background-color: #eff6ff; font-weight: bold;">${lang === 'ar' ? 'فريق المضيف' : 'Équipe Domicile'}</td>
          <td colspan="2" style="background-color: #ecfdf5; font-weight: bold; color: #047857;">
            ${lang === 'ar' ? 'الفائز / النتيجة:' : 'Résultat:'} ${winner}
          </td>
          <td colspan="2" style="background-color: #f0fdf4; font-weight: bold;">${lang === 'ar' ? 'فريق الضيف' : 'Équipe Visiteur'}</td>
        </tr>
      </table>

      <!-- 3. COMPARATIVE KPI METRICS -->
      <table>
        <tr>
          <td colspan="6" class="section-title">
            ${lang === 'ar' ? '📊 مقارنة المؤشرات الفنية والإحصائية بين الفريقين' : 'Statistiques Comparatives'}
          </td>
        </tr>
        <tr>
          <th>${match.homeTeam.name}</th>
          <th colspan="4" class="kpi-title">${lang === 'ar' ? 'المؤشر الفني' : 'Indicateur'}</th>
          <th>${match.awayTeam.name}</th>
        </tr>
        <tr>
          <td class="kpi-value-home">${match.score.home}</td>
          <td colspan="4">${lang === 'ar' ? 'الأهداف المسجلة (الوقت الأصلي)' : 'Buts temps réglementaire'}</td>
          <td class="kpi-value-away">${match.score.away}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${match.score.homeP1}</td>
          <td colspan="4">${lang === 'ar' ? 'أهداف الشوط الأول (Mi-temps 1)' : 'Buts 1ère mi-temps'}</td>
          <td class="kpi-value-away">${match.score.awayP1}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${Math.max(0, match.score.home - match.score.homeP1)}</td>
          <td colspan="4">${lang === 'ar' ? 'أهداف الشوط الثاني (Mi-temps 2)' : 'Buts 2ème mi-temps'}</td>
          <td class="kpi-value-away">${Math.max(0, match.score.away - match.score.awayP1)}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${match.score.homePenalties || 0}</td>
          <td colspan="4">${lang === 'ar' ? 'أهداف رميات 7 أمتار' : 'Jets de 7m réussis'}</td>
          <td class="kpi-value-away">${match.score.awayPenalties || 0}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${homeYellows}</td>
          <td colspan="4">${lang === 'ar' ? 'الإنذارات (البطاقات الصفراء)' : 'Cartons Jaunes'}</td>
          <td class="kpi-value-away">${awayYellows}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${homeTwoMins} (${homeTwoMins * 2} min)</td>
          <td colspan="4">${lang === 'ar' ? 'عقوبات الإيقاف دقيقتين (2 min)' : 'Exclusions 2 minutes'}</td>
          <td class="kpi-value-away">${awayTwoMins} (${awayTwoMins * 2} min)</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${homeReds}</td>
          <td colspan="4">${lang === 'ar' ? 'البطاقات الحمراء (طرد واستبعاد)' : 'Cartons Rouges (Disqualifications)'}</td>
          <td class="kpi-value-away">${awayReds}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${homeBlues}</td>
          <td colspan="4">${lang === 'ar' ? 'البطاقات الزرقاء (تقرير تحكيمي)' : 'Cartons Bleus (Rapports)'}</td>
          <td class="kpi-value-away">${awayBlues}</td>
        </tr>
        <tr>
          <td class="kpi-value-home">${match.homeTeam.timeoutsUsed || 0} / 3</td>
          <td colspan="4">${lang === 'ar' ? 'الأوقات المستقطعة المستهلكة' : 'Temps Morts Utilisés'}</td>
          <td class="kpi-value-away">${match.awayTeam.timeoutsUsed || 0} / 3</td>
        </tr>
      </table>

      <!-- 4. HOME PLAYERS STATS -->
      <table>
        <tr>
          <td colspan="8" class="section-title" style="background-color: #dbeafe; color: #1e3a8a;">
            ${lang === 'ar' ? `📋 إحصائيات لاعبي فريق ${match.homeTeam.name}` : `Statistiques Joueurs - ${match.homeTeam.name}`}
          </td>
        </tr>
        <tr>
          <th style="width: 8%;">${lang === 'ar' ? 'الرقم' : 'N°'}</th>
          <th style="width: 15%;">${lang === 'ar' ? 'رقم الرخصة' : 'Licence'}</th>
          <th style="width: 35%;">${lang === 'ar' ? 'الاسم الكامل للّاعب' : 'Nom & Prénom'}</th>
          <th style="width: 10%;">${lang === 'ar' ? 'الأهداف' : 'Buts'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'إنذار' : 'Avert.'}</th>
          <th style="width: 8%;">${lang === 'ar' ? '2 د' : '2 min'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'طرد' : 'Disq.'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'تقرير' : 'Rapp.'}</th>
        </tr>
        ${match.homeTeam.players.map((p, idx) => {
          const yellow = p.sanctions.filter(s => s.type === SanctionType.YELLOW).length;
          const twoMin = p.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length;
          const red = p.sanctions.filter(s => s.type === SanctionType.RED).length;
          const blue = p.sanctions.filter(s => s.type === SanctionType.BLUE).length;
          const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          return `
            <tr style="background-color: ${bg};">
              <td><strong>#${p.number}</strong></td>
              <td>${p.licence || '-'}</td>
              <td style="text-align: ${isRtl ? 'right' : 'left'}; font-weight: bold;">
                ${p.name} ${p.isCaptain ? '(C)' : ''} ${p.isGoalkeeper ? '(G)' : ''}
              </td>
              <td class="${p.goals > 0 ? 'goal-badge' : ''}">${p.goals}</td>
              <td class="${yellow > 0 ? 'yellow-badge' : ''}">${yellow > 0 ? 'X' : ''}</td>
              <td class="${twoMin > 0 ? 'twomin-badge' : ''}">${twoMin > 0 ? `${twoMin}*2m` : ''}</td>
              <td class="${red > 0 ? 'red-badge' : ''}">${red > 0 ? 'X' : ''}</td>
              <td class="${blue > 0 ? 'blue-badge' : ''}">${blue > 0 ? 'X' : ''}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <!-- 5. AWAY PLAYERS STATS -->
      <table>
        <tr>
          <td colspan="8" class="section-title" style="background-color: #d1fae5; color: #065f46;">
            ${lang === 'ar' ? `📋 إحصائيات لاعبي فريق ${match.awayTeam.name}` : `Statistiques Joueurs - ${match.awayTeam.name}`}
          </td>
        </tr>
        <tr>
          <th style="width: 8%;">${lang === 'ar' ? 'الرقم' : 'N°'}</th>
          <th style="width: 15%;">${lang === 'ar' ? 'رقم الرخصة' : 'Licence'}</th>
          <th style="width: 35%;">${lang === 'ar' ? 'الاسم الكامل للّاعب' : 'Nom & Prénom'}</th>
          <th style="width: 10%;">${lang === 'ar' ? 'الأهداف' : 'Buts'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'إنذار' : 'Avert.'}</th>
          <th style="width: 8%;">${lang === 'ar' ? '2 د' : '2 min'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'طرد' : 'Disq.'}</th>
          <th style="width: 8%;">${lang === 'ar' ? 'تقرير' : 'Rapp.'}</th>
        </tr>
        ${match.awayTeam.players.map((p, idx) => {
          const yellow = p.sanctions.filter(s => s.type === SanctionType.YELLOW).length;
          const twoMin = p.sanctions.filter(s => s.type === SanctionType.TWO_MINUTES).length;
          const red = p.sanctions.filter(s => s.type === SanctionType.RED).length;
          const blue = p.sanctions.filter(s => s.type === SanctionType.BLUE).length;
          const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          return `
            <tr style="background-color: ${bg};">
              <td><strong>#${p.number}</strong></td>
              <td>${p.licence || '-'}</td>
              <td style="text-align: ${isRtl ? 'right' : 'left'}; font-weight: bold;">
                ${p.name} ${p.isCaptain ? '(C)' : ''} ${p.isGoalkeeper ? '(G)' : ''}
              </td>
              <td class="${p.goals > 0 ? 'goal-badge' : ''}">${p.goals}</td>
              <td class="${yellow > 0 ? 'yellow-badge' : ''}">${yellow > 0 ? 'X' : ''}</td>
              <td class="${twoMin > 0 ? 'twomin-badge' : ''}">${twoMin > 0 ? `${twoMin}*2m` : ''}</td>
              <td class="${red > 0 ? 'red-badge' : ''}">${red > 0 ? 'X' : ''}</td>
              <td class="${blue > 0 ? 'blue-badge' : ''}">${blue > 0 ? 'X' : ''}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <!-- 6. CHRONOLOGICAL MATCH EVENTS LOG -->
      <table>
        <tr>
          <td colspan="5" class="section-title">
            ${lang === 'ar' ? '⏱️ سجل أحداث المباراة الزمني المفصل' : 'Journal Chronologique des Événements'}
          </td>
        </tr>
        <tr>
          <th style="width: 15%;">${lang === 'ar' ? 'التوقيت' : 'Chrono'}</th>
          <th style="width: 25%;">${lang === 'ar' ? 'الفريق المعني' : 'Équipe'}</th>
          <th style="width: 25%;">${lang === 'ar' ? 'نوع الحدث' : 'Événement'}</th>
          <th style="width: 35%;">${lang === 'ar' ? 'اللاعب / التفاصيل' : 'Joueur / Détails'}</th>
        </tr>
        ${sortedEvents.length === 0 ? `
          <tr>
            <td colspan="4" style="padding: 15px; color: #94a3b8;">
              ${lang === 'ar' ? 'لا توجد أحداث مسجلة' : 'Aucun événement'}
            </td>
          </tr>
        ` : sortedEvents.map((evt, idx) => {
          const isHome = evt.team === 'home';
          const teamName = isHome ? match.homeTeam.name : match.awayTeam.name;
          let badgeClass = '';
          let eventName = '';

          if (evt.type === 'GOAL') {
            badgeClass = 'goal-badge';
            eventName = evt.goalType === '7M' ? (lang === 'ar' ? 'هدف 7 أمتار (7m)' : 'But 7m') : (lang === 'ar' ? 'هدف عادي' : 'But');
          } else if (evt.type === 'SANCTION') {
            if (evt.sanctionType === SanctionType.YELLOW) {
              badgeClass = 'yellow-badge';
              eventName = lang === 'ar' ? 'إنذار (بطاقة صفراء)' : 'Carton Jaune';
            } else if (evt.sanctionType === SanctionType.TWO_MINUTES) {
              badgeClass = 'twomin-badge';
              eventName = lang === 'ar' ? 'إيقاف مؤقت دقيقتين (2 min)' : 'Exclusion 2 minutes';
            } else if (evt.sanctionType === SanctionType.RED) {
              badgeClass = 'red-badge';
              eventName = lang === 'ar' ? 'استبعاد (بطاقة حمراء)' : 'Carton Rouge';
            } else if (evt.sanctionType === SanctionType.BLUE) {
              badgeClass = 'blue-badge';
              eventName = lang === 'ar' ? 'تقرير (بطاقة زرقاء)' : 'Carton Bleu';
            }
          } else if (evt.type === 'TIMEOUT') {
            badgeClass = 'timeout-badge';
            eventName = lang === 'ar' ? 'وقت مستقطع رسمي' : 'Temps Mort';
          }

          const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          return `
            <tr style="background-color: ${bg};">
              <td style="font-family: monospace; font-weight: bold;">${evt.timeStr}</td>
              <td style="font-weight: bold; color: ${isHome ? homeColor : awayColor};">${teamName}</td>
              <td class="${badgeClass}">${eventName}</td>
              <td style="text-align: ${isRtl ? 'right' : 'left'}; font-weight: bold;">
                ${evt.playerName || '-'}
              </td>
            </tr>
          `;
        }).join('')}
      </table>

      <!-- 7. OFFICIALS AND SIGNATURES FOOTER -->
      <table>
        <tr>
          <td colspan="4" class="section-title">
            ${lang === 'ar' ? '✍️ طاقم التحكيم والمسؤولين' : 'Officiels du Match'}
          </td>
        </tr>
        <tr>
          <th>${lang === 'ar' ? 'الحكم الأول' : 'Arbitre 1'}</th>
          <th>${lang === 'ar' ? 'الحكم الثاني' : 'Arbitre 2'}</th>
          <th>${lang === 'ar' ? 'الميقاتي' : 'Chronométreur'}</th>
          <th>${lang === 'ar' ? 'المسجل' : 'Secrétaire'}</th>
        </tr>
        <tr>
          <td>${match.officials?.referee1 || '-'}</td>
          <td>${match.officials?.referee2 || '-'}</td>
          <td>${match.officials?.timer || '-'}</td>
          <td>${match.officials?.secretary || '-'}</td>
        </tr>
      </table>

      <!-- Footer credit -->
      <p style="text-align: center; color: #64748b; font-size: 8.5pt; margin-top: 15px;">
        تم استخراج هذا التقرير المنظم والملون تلقائياً بواسطة نظام HandballScore PRO في ${new Date().toLocaleString(isRtl ? 'ar-MA' : 'fr-FR')}
      </p>

    </body>
    </html>
  `;

  // Create downloadable Blob
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeHome = match.homeTeam.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
  const safeAway = match.awayTeam.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
  const fileName = `تقرير_مباراة_${safeHome}_ضد_${safeAway}.xls`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
