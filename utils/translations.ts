import { AppLanguage } from '../types.ts';

export interface Translations {
  // Common & Navigation
  appTitle: string;
  appSubtitle: string;
  home: string;
  newMatch: string;
  scheduleManager: string;
  archive: string;
  matchSheet: string;
  scoreboardSpeed: string;
  normalSpeed: string;
  fastSpeed: string;
  theme: string;
  light: string;
  dark: string;
  about: string;
  logout: string;
  login: string;
  license: string;
  demoMode: string;
  demoModeShort: string;
  language: string;
  changeLanguage: string;
  proActive: string;
  proRequired: string;
  close: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  back: string;
  confirm: string;

  // Scoreboard
  start: string;
  pause: string;
  resume: string;
  finishMatch: string;
  timeout: string;
  cancelTimeout: string;
  restPause: string;
  period: string;
  periodFirstHalf: string;
  periodBreak: string;
  periodSecondHalf: string;
  periodOT1H1: string;
  periodOT1H2: string;
  periodOT2H1: string;
  periodOT2H2: string;
  periodPenalties: string;
  suspensionsEndingSoon: string;
  secondShort: string;
  vs: string;
  timeoutsLeft: string;
  penaltyShootoutTitle: string;

  // Actions & Roster
  goal: string;
  yellowCard: string;
  twoMinutes: string;
  redCard: string;
  blueCard: string;
  undo: string;
  coach: string;
  assistantCoach: string;
  players: string;
  number: string;
  name: string;
  licence: string;
  goals: string;
  sanctions: string;
  goalkeeper: string;
  captain: string;
  addPlayer: string;
  noPlayers: string;

  // Setup Choice & Activation
  setupChoiceTitle: string;
  setupChoiceSubtitle: string;
  userGreeting: string;
  manageAccount: string;
  signInNotice: string;
  signInBtn: string;
  demoCardBadge: string;
  demoCardTitle: string;
  demoCardDesc: string;
  demoCardBtn: string;
  manualSetupTitle: string;
  manualSetupDesc: string;
  startFromScratch: string;
  scheduledTitle: string;
  scheduledDesc: string;
  noScheduledMatches: string;
  selectScheduledPrompt: string;
  promoTitle: string;
  promoDesc: string;
  promoBtn: string;
  forSubscribersOnly: string;
  activationRequiredTitle: string;
  activationRequiredDesc: string;
  activationRequiredSub: string;
  loginOrRegister: string;
  enterLicenseKey: string;
  tryDemoInstead: string;

  // Match Sheet & PDF
  sheetTitleMain: string;
  sheetTitleSub: string;
  sheetCompetition: string;
  league: string;
  academy: string;
  direction: string;
  category: string;
  venue: string;
  date: string;
  time: string;
  matchNumber: string;
  teams: string;
  half1: string;
  finalScore: string;
  extra1: string;
  extra2: string;
  sevenMeters: string;
  totalScore: string;
  scoreRow: string;
  protests: string;
  noProtests: string;
  teamOfficial: string;
  goalsSequence: string;
  officials: string;
  referees: string;
  scorekeeper: string;
  timekeeper: string;
  referee1: string;
  referee2: string;
  winningTeam: string;
  matchDraw: string;
  refereeReport: string;
  nothingToReport: string;
  credits: string;
  printBtn: string;
  downloadPdf: string;
  shareWhatsAppImage: string;
  downloadImage: string;
  copyImage: string;
  imageCopied: string;
  preparingImage: string;
  editProtests: string;
  editReport: string;
  saveProtests: string;
  saveReport: string;
  signatureOf: string;
  demoWatermark: string;

  // Subscription modal
  pricingTitle: string;
  pricingSubtitle: string;
  activePlan: string;
  enterKeyPrompt: string;
  keyPlaceholder: string;
  activateBtn: string;
  orBuyAtStore: string;
  visitStore: string;
  licensedTo: string;
  expiresOn: string;
  deactivateLicense: string;
}

export const translations: Record<AppLanguage, Translations> = {
  ar: {
    appTitle: 'HandballScore Pro',
    appSubtitle: 'النظام الرقمي الاحترافي لإدارة مباريات كرة اليد',
    home: 'الرئيسية',
    newMatch: 'مباراة جديدة',
    scheduleManager: 'برمجة المقابلات',
    archive: 'سجل المباريات',
    matchSheet: 'ورقة المباراة',
    scoreboardSpeed: 'سرعة العداد',
    normalSpeed: 'عادي (1x)',
    fastSpeed: 'سريع للاختبار (50x)',
    theme: 'المظهر',
    light: 'نهاري',
    dark: 'ليلي',
    about: 'حول التطبيق',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    license: 'الترخيص والاشتراك',
    demoMode: 'مباراة تجريبية (Mode Démo)',
    demoModeShort: 'عرض تجريبي',
    language: 'اللغة',
    changeLanguage: 'تغيير لغة التطبيق',
    proActive: 'حساب PRO مفعل',
    proRequired: 'يتطلب تفعيل الاشتراك',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    edit: 'تعديل',
    delete: 'حذف',
    back: 'رجوع',
    confirm: 'تأكيد',

    start: 'بدء',
    pause: 'إيقاف مؤقت',
    resume: 'متابعة',
    finishMatch: 'إنهاء المباراة',
    timeout: 'وقت مستقطع',
    cancelTimeout: 'إلغاء الوقت المستقطع',
    restPause: 'استراحة الشوطين',
    period: 'الفترة',
    periodFirstHalf: 'الشوط الأول',
    periodBreak: 'استراحة',
    periodSecondHalf: 'الشوط الثاني',
    periodOT1H1: 'إضافي 1 - شوط 1',
    periodOT1H2: 'إضافي 1 - شوط 2',
    periodOT2H1: 'إضافي 2 - شوط 1',
    periodOT2H2: 'إضافي 2 - شوط 2',
    periodPenalties: 'رميات 7 أمتار',
    suspensionsEndingSoon: 'لاعبون تنتهي عقوبتهم قريباً:',
    secondShort: 'ث',
    vs: 'ضد',
    timeoutsLeft: 'الأوقات المستقطعة المتبقية',
    penaltyShootoutTitle: 'حصة رميات 7 أمتار الترجيحية',

    goal: '+1 هدف',
    yellowCard: 'إنذار (أصفر)',
    twoMinutes: 'إيقاف دقيقتين',
    redCard: 'طرد (أحمر)',
    blueCard: 'تقرير (أزرق)',
    undo: 'تراجع عن آخر حدث',
    coach: 'مسؤول الفريق',
    assistantCoach: 'مساعد المدرب',
    players: 'اللاعبون',
    number: 'رقم',
    name: 'الاسم الكامل',
    licence: 'ر. مسار / رخصة',
    goals: 'أهداف',
    sanctions: 'العقوبات',
    goalkeeper: 'حارس (G)',
    captain: 'عميد (C)',
    addPlayer: 'إضافة لاعب',
    noPlayers: 'لا يوجد لاعبون مسجلون',

    setupChoiceTitle: 'بدء مقابلة جديدة أو تجربة النظام',
    setupChoiceSubtitle: 'اختر طريقة إعداد المباراة أو اختبر النظام فوراً بنقرة واحدة',
    userGreeting: 'مرحباً،',
    manageAccount: 'إدارة الحساب',
    signInNotice: '🔒 تنبيه المشتركين: سجّل دخولك بحساب النادي لحماية اشتراكك',
    signInBtn: 'تسجيل الدخول',
    demoCardBadge: 'MODE DÉMO INTERACTIF (1-CLIC)',
    demoCardTitle: 'مباراة تجريبية مجهزة بنقرة واحدة',
    demoCardDesc: 'جرّب التطبيق مباشرة بمباراة حيّة جاهزة (عداد متزامن، عقوبة 2 دقيقة قيد التنازل، نتيجة 21-20، وورقة تحكيم رسمية موقعة ومطبوعة).',
    demoCardBtn: 'تشغيل العرض التجريبي فوراً',
    manualSetupTitle: 'إعداد يدوي لمباراة جديدة',
    manualSetupDesc: 'قم بإدخال أسماء الفرق واللاعبين وكل التفاصيل يدوياً الآن',
    startFromScratch: 'ابدأ من الصفر',
    scheduledTitle: 'المباريات المبرمجة',
    scheduledDesc: 'استيراد البيانات من البرنامج المسبق',
    noScheduledMatches: 'لا توجد مباريات مبرمجة حالياً',
    selectScheduledPrompt: 'اختر مباراة لتحميل بياناتها تلقائياً',
    promoTitle: 'التفعيل اليدوي عبر المسير المركزي بواسطة الواتساب',
    promoDesc: 'املأ استمارة التسجيل (الاسم، البريد، والهاتف) ليرسل لك المسير المركزي كود التفعيل الخاص بك.',
    promoBtn: 'تفعيل الحساب / المسير المركزي',
    forSubscribersOnly: '🔒 يتطلب تفعيل الحساب من المسير المركزي',
    activationRequiredTitle: 'تفعيل الحساب مطلوب لبدء مباراة جديدة',
    activationRequiredDesc: 'يرجى تسجيل حسابك (الاسم، البريد، ورقم الهاتف) ليرسل لك المسير المركزي كود التفعيل الفردي عبر الواتساب.',
    activationRequiredSub: 'التفعيل يتم يدوياً وبسهولة عبر إرسال كود خاص لكل أستاذ على الواتساب.',
    loginOrRegister: 'تسجيل حساب جديد / تسجيل الدخول',
    enterLicenseKey: 'إدخال كود التفعيل المستلم على الواتساب',
    tryDemoInstead: 'تجربة مباراة ديمو مجاناً (1-Clic)',

    sheetTitleMain: 'الجامعة الملكية المغربية للرياضة المدرسية',
    sheetTitleSub: 'FÉDÉRATION ROYALE MAROCAINE DU SPORT SCOLAIRE',
    sheetCompetition: 'البطولة المدرسية',
    league: 'العصبة',
    academy: 'الأكاديمية',
    direction: 'المديرية',
    category: 'الفئة',
    venue: 'القاعة',
    date: 'التاريخ',
    time: 'التوقيت',
    matchNumber: 'رقم',
    teams: 'الفرق',
    half1: 'شوط 1',
    finalScore: 'نهاية',
    extra1: 'إضافي 1',
    extra2: 'إضافي 2',
    sevenMeters: '7م',
    totalScore: 'المجموع',
    scoreRow: 'النتيجة',
    protests: 'تحفظات',
    noProtests: 'لا توجد',
    teamOfficial: 'مسؤول الفريق',
    goalsSequence: 'تسلسل الأهداف',
    officials: 'المسؤولون:',
    referees: 'الحكام:',
    scorekeeper: 'المسجل',
    timekeeper: 'الميقاتي',
    referee1: 'الحكم 1',
    referee2: 'الحكم 2',
    winningTeam: 'الفريق الفائز',
    matchDraw: 'تعادل',
    refereeReport: 'ملاحظات / تقرير الحكم:',
    nothingToReport: 'لا شيء يذكر',
    credits: '',
    printBtn: 'طباعة',
    downloadPdf: 'تحميل PDF',
    shareWhatsAppImage: 'إرسال صورة عبر واتساب',
    downloadImage: 'تحميل الصورة PNG',
    copyImage: 'نسخ الصورة',
    imageCopied: 'تم نسخ صورة ورقة المباراة بنجاح! يمكنك لصقها مباشرة في واتساب',
    preparingImage: 'جاري تجهيز صورة ورقة المباراة عالية الدقة...',
    editProtests: 'تحفظات واحترازات الفريق',
    editReport: 'تقرير المباراة الرسمي',
    saveProtests: 'حفظ التحفظات',
    saveReport: 'حفظ التقرير',
    signatureOf: 'توقيع',
    demoWatermark: '⚡ ورقة مباراة نموذجية تجريبية (Mode Démo) — نموذج رسمي مطابق لمعايير الجامعة والاتحاد الدولي',

    pricingTitle: 'خطط الترقية وتراخيص الأندية',
    pricingSubtitle: 'اختر الباقة المناسبة لناديك أو بطولتك مع دعم كامل لورق التحكيم IHF',
    activePlan: 'الخطة الحالية النشطة',
    enterKeyPrompt: 'لديك رمز تفعيل أو مفتاح ترخيص تم شراؤه؟',
    keyPlaceholder: 'أدخل رمز التفعيل هنا (مثال: DEMO-PRO-2026)',
    activateBtn: 'تفعيل الترخيص فوراً',
    orBuyAtStore: 'أو اشترِ ترخيص ناديك مباشرة عبر متجرنا الرسمي:',
    visitStore: 'زيارة متجر التطبيق appsports.store',
    licensedTo: 'مرخص لصالح:',
    expiresOn: 'تاريخ الانتهاء:',
    deactivateLicense: 'إلغاء تفعيل الترخيص على هذا الجهاز'
  },

  fr: {
    appTitle: 'HandballScore Pro',
    appSubtitle: 'Système numérique professionnel pour matchs de Handball',
    home: 'Accueil',
    newMatch: 'Nouveau Match',
    scheduleManager: 'Programme des Matchs',
    archive: 'Archives des Matchs',
    matchSheet: 'Feuille de Match',
    scoreboardSpeed: 'Vitesse du Chrono',
    normalSpeed: 'Normal (1x)',
    fastSpeed: 'Rapide pour Test (50x)',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    about: 'À propos',
    logout: 'Déconnexion',
    login: 'Connexion',
    license: 'Licence & Abonnement',
    demoMode: 'Mode Démo (1-Clic)',
    demoModeShort: 'Match Démo',
    language: 'Langue',
    changeLanguage: 'Changer la langue',
    proActive: 'Compte PRO Activé',
    proRequired: 'Abonnement Requis',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    back: 'Retour',
    confirm: 'Confirmer',

    start: 'Démarrer',
    pause: 'Pause',
    resume: 'Reprendre',
    finishMatch: 'Terminer le Match',
    timeout: 'Temps-Mort',
    cancelTimeout: 'Annuler Temps-Mort',
    restPause: 'Pause Mi-temps',
    period: 'Période',
    periodFirstHalf: '1ère Mi-temps',
    periodBreak: 'Pause Mi-temps',
    periodSecondHalf: '2ème Mi-temps',
    periodOT1H1: 'Prolongation 1 - MT 1',
    periodOT1H2: 'Prolongation 1 - MT 2',
    periodOT2H1: 'Prolongation 2 - MT 1',
    periodOT2H2: 'Prolongation 2 - MT 2',
    periodPenalties: 'Tirs aux 7 mètres',
    suspensionsEndingSoon: 'Fin d\'exclusions imminente :',
    secondShort: 's',
    vs: 'CONTRE',
    timeoutsLeft: 'Temps-morts restants',
    penaltyShootoutTitle: 'Séance des tirs au but (7 mètres)',

    goal: '+1 But',
    yellowCard: 'Avertissement (Jaune)',
    twoMinutes: 'Exclusion 2 min',
    redCard: 'Disqualification (Rouge)',
    blueCard: 'Rapport écrit (Bleu)',
    undo: 'Annuler la dernière action',
    coach: 'Responsable d\'équipe',
    assistantCoach: 'Entraîneur adjoint',
    players: 'Joueurs',
    number: 'N°',
    name: 'Nom & Prénom',
    licence: 'Licence / ID',
    goals: 'Buts',
    sanctions: 'Sanctions',
    goalkeeper: 'Gardien (G)',
    captain: 'Capitaine (C)',
    addPlayer: 'Ajouter Joueur',
    noPlayers: 'Aucun joueur enregistré',

    setupChoiceTitle: 'Démarrer un Match ou Tester le Système',
    setupChoiceSubtitle: 'Choisissez le mode de préparation ou lancez une démo en 1 clic',
    userGreeting: 'Bienvenue,',
    manageAccount: 'Gérer le compte',
    signInNotice: '🔒 Clubs abonnés : Connectez-vous pour débloquer vos matchs officiels',
    signInBtn: 'Connexion',
    demoCardBadge: 'MODE DÉMO INTERACTIF (1-CLIC)',
    demoCardTitle: 'Match Démo Prêt à l\'Emploi en 1 Clic',
    demoCardDesc: 'Explorez l\'application immédiatement avec un match en cours (chrono synchronisé, 2 min en décompte, score 21-20, feuille officielle prête).',
    demoCardBtn: 'Lancer le Match Démo',
    manualSetupTitle: 'Configuration Manuelle du Match',
    manualSetupDesc: 'Saisie complète des équipes, joueurs et officiels pour une nouvelle rencontre',
    startFromScratch: 'Créer un match',
    scheduledTitle: 'Matchs Programmés',
    scheduledDesc: 'Importer les données depuis le calendrier des rencontres',
    noScheduledMatches: 'Aucun match programmé pour l\'instant',
    selectScheduledPrompt: 'Sélectionnez un match pour charger ses données automatiquement',
    promoTitle: 'Envie d\'équiper votre club ou ligue pour la saison ?',
    promoDesc: 'Matchs illimités, feuilles de match officielles IHF, signatures électroniques et mode hors-ligne.',
    promoBtn: 'Découvrir les offres & licences clubs',
    forSubscribersOnly: '🔒 Réservé aux abonnés (Compte actif)',
    activationRequiredTitle: 'Activation de compte requise',
    activationRequiredDesc: 'Pour créer et enregistrer des matchs officiels illimités, veuillez vous connecter avec un compte club abonné ou entrer une clé de licence.',
    activationRequiredSub: 'Vous pouvez tester toutes les fonctionnalités sans restriction via le (Mode Démo) !',
    loginOrRegister: 'Se connecter / Créer un compte',
    enterLicenseKey: 'Activer une clé de licence (PRO)',
    tryDemoInstead: 'Tester en Mode Démo gratuit (1 Clic)',

    sheetTitleMain: 'FÉDÉRATION ROYALE MAROCAINE DU SPORT SCOLAIRE',
    sheetTitleSub: 'الجامعة الملكية المغربية للرياضة المدرسية',
    sheetCompetition: 'Championnat Scolaire',
    league: 'Ligue',
    academy: 'Académie',
    direction: 'Direction',
    category: 'Catégorie',
    venue: 'Salle / Lieu',
    date: 'Date',
    time: 'Heure',
    matchNumber: 'N°',
    teams: 'Équipes',
    half1: '1ère MT',
    finalScore: 'Fin TR',
    extra1: 'Prolong. 1',
    extra2: 'Prolong. 2',
    sevenMeters: '7 m',
    totalScore: 'TOTAL',
    scoreRow: 'Score',
    protests: 'Réserves',
    noProtests: 'Néant',
    teamOfficial: 'Responsable Équipe',
    goalsSequence: 'Séquence des Buts',
    officials: 'Table de marque :',
    referees: 'Arbitres :',
    scorekeeper: 'Secrétaire',
    timekeeper: 'Chronométreur',
    referee1: 'Arbitre 1',
    referee2: 'Arbitre 2',
    winningTeam: 'Équipe Vainqueur',
    matchDraw: 'Match Nul',
    refereeReport: 'Observations & Rapport des arbitres :',
    nothingToReport: 'Rien à signaler',
    credits: '',
    printBtn: 'Imprimer',
    downloadPdf: 'Télécharger PDF',
    shareWhatsAppImage: 'Partager image WhatsApp',
    downloadImage: 'Télécharger Image PNG',
    copyImage: 'Copier l\'Image',
    imageCopied: 'Image de la feuille copiée ! Collez-la directement dans WhatsApp',
    preparingImage: 'Préparation de l\'image haute définition...',
    editProtests: 'Réserves et réclamations de l\'équipe',
    editReport: 'Rapport officiel de rencontre',
    saveProtests: 'Enregistrer les réserves',
    saveReport: 'Enregistrer le rapport',
    signatureOf: 'Signature de',
    demoWatermark: '⚡ FEUILLE DE MATCH SPÉCIMEN (Mode Démo) — Conforme aux règlements officiels IHF & FRMSS',

    pricingTitle: 'Licences & Abonnements Clubs',
    pricingSubtitle: 'Choisissez la formule adaptée à votre club ou ligue avec support officiel',
    activePlan: 'Formule actuellement active',
    enterKeyPrompt: 'Vous disposez d\'un code d\'activation ou d\'une clé ?',
    keyPlaceholder: 'Entrez votre code ici (ex : DEMO-PRO-2026)',
    activateBtn: 'Activer la licence immédiatement',
    orBuyAtStore: 'Ou commandez votre licence sur notre boutique officielle :',
    visitStore: 'Visiter la boutique appsports.store',
    licensedTo: 'Licencié à :',
    expiresOn: 'Date d\'expiration :',
    deactivateLicense: 'Désactiver la licence sur cet appareil'
  },

  en: {
    appTitle: 'HandballScore Pro',
    appSubtitle: 'Professional Digital System for Handball Matches',
    newMatch: 'New Match',
    scheduleManager: 'Match Schedule',
    archive: 'Match Archive',
    matchSheet: 'Scoresheet',
    scoreboardSpeed: 'Clock Speed',
    normalSpeed: 'Normal (1x)',
    fastSpeed: 'Fast Test (50x)',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    about: 'About',
    logout: 'Sign Out',
    login: 'Sign In',
    license: 'License & Subscription',
    demoMode: 'Demo Mode (1-Click)',
    demoModeShort: 'Demo Match',
    language: 'Language',
    changeLanguage: 'Change Application Language',
    proActive: 'PRO Account Active',
    proRequired: 'Subscription Required',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    confirm: 'Confirm',

    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    finishMatch: 'End Match',
    timeout: 'Time-out',
    cancelTimeout: 'Cancel Time-out',
    restPause: 'Half-time Break',
    period: 'Period',
    periodFirstHalf: '1st Half',
    periodBreak: 'Half-time Break',
    periodSecondHalf: '2nd Half',
    periodOT1H1: 'Extra Time 1 - 1st Half',
    periodOT1H2: 'Extra Time 1 - 2nd Half',
    periodOT2H1: 'Extra Time 2 - 1st Half',
    periodOT2H2: 'Extra Time 2 - 2nd Half',
    periodPenalties: '7-Meter Shootout',
    suspensionsEndingSoon: 'Suspensions ending soon:',
    secondShort: 's',
    vs: 'VS',
    timeoutsLeft: 'Time-outs remaining',
    penaltyShootoutTitle: '7-Meter Penalty Shootout',

    goal: '+1 Goal',
    yellowCard: 'Warning (Yellow)',
    twoMinutes: '2 Min Suspension',
    redCard: 'Disqualification (Red)',
    blueCard: 'Written Report (Blue)',
    undo: 'Undo Last Action',
    coach: 'Team Official',
    assistantCoach: 'Assistant Coach',
    players: 'Players',
    number: 'No.',
    name: 'Player Name',
    licence: 'Licence / ID',
    goals: 'Goals',
    sanctions: 'Sanctions',
    goalkeeper: 'Goalkeeper (G)',
    captain: 'Captain (C)',
    addPlayer: 'Add Player',
    noPlayers: 'No players registered',

    setupChoiceTitle: 'Start a Match or Explore Demo',
    setupChoiceSubtitle: 'Choose setup method or test the system instantly with 1 click',
    userGreeting: 'Welcome,',
    manageAccount: 'Manage Account',
    signInNotice: '🔒 Subscribed Clubs: Sign in to unlock official match setup',
    signInBtn: 'Sign In',
    demoCardBadge: 'INTERACTIVE DEMO MODE (1-CLICK)',
    demoCardTitle: 'Turnkey Demo Match in 1 Click',
    demoCardDesc: 'Experience the app immediately with a live match (synchronized clock, active 2-min penalty countdown, 21-20 score, signed match sheet ready).',
    demoCardBtn: 'Launch Demo Match Now',
    manualSetupTitle: 'Manual Match Setup',
    manualSetupDesc: 'Enter teams, players, and official match details manually',
    startFromScratch: 'Create from scratch',
    scheduledTitle: 'Scheduled Matches',
    scheduledDesc: 'Import match data directly from the tournament schedule',
    noScheduledMatches: 'No scheduled matches right now',
    selectScheduledPrompt: 'Click any match to auto-load its data',
    promoTitle: 'Looking to license the app for your club or league?',
    promoDesc: 'Unlimited matches, official IHF compliant scoresheets, digital signatures, and offline capability.',
    promoBtn: 'View Club Plans & Pricing',
    forSubscribersOnly: '🔒 Subscribers Only (Active Account)',
    activationRequiredTitle: 'Account Activation Required',
    activationRequiredDesc: 'To create and save unlimited official matches, please sign in with an active club account or enter your license key.',
    activationRequiredSub: 'You can test all system features without restrictions using (Demo Mode)!',
    loginOrRegister: 'Sign In / Register',
    enterLicenseKey: 'Activate License Key (PRO)',
    tryDemoInstead: 'Try Free Demo Mode (1-Click)',

    sheetTitleMain: 'ROYAL MOROCCAN FEDERATION OF SCHOOL SPORT',
    sheetTitleSub: 'الجامعة الملكية المغربية للرياضة المدرسية',
    sheetCompetition: 'School Championship',
    league: 'League',
    academy: 'Academy',
    direction: 'District',
    category: 'Category',
    venue: 'Venue / Hall',
    date: 'Date',
    time: 'Time',
    matchNumber: 'No.',
    teams: 'Teams',
    half1: '1st Half',
    finalScore: 'Full Time',
    extra1: 'Extra 1',
    extra2: 'Extra 2',
    sevenMeters: '7m',
    totalScore: 'TOTAL',
    scoreRow: 'Score',
    protests: 'Protests',
    noProtests: 'None',
    teamOfficial: 'Team Official',
    goalsSequence: 'Goals Sequence',
    officials: 'Table Officials:',
    referees: 'Referees:',
    scorekeeper: 'Scorekeeper',
    timekeeper: 'Timekeeper',
    referee1: 'Referee 1',
    referee2: 'Referee 2',
    winningTeam: 'Winning Team',
    matchDraw: 'Draw',
    refereeReport: 'Remarks & Referees Report:',
    nothingToReport: 'Nothing to report',
    credits: '',
    printBtn: 'Print',
    downloadPdf: 'Download PDF',
    shareWhatsAppImage: 'Share WhatsApp Image',
    downloadImage: 'Download PNG Image',
    copyImage: 'Copy Image',
    imageCopied: 'Match sheet image copied! Paste directly in WhatsApp',
    preparingImage: 'Preparing high-resolution match sheet image...',
    editProtests: 'Team protests & claims',
    editReport: 'Official match report',
    saveProtests: 'Save Protests',
    saveReport: 'Save Report',
    signatureOf: 'Signature of',
    demoWatermark: '⚡ SPECIMEN MATCH SHEET (Demo Mode) — Fully Compliant with IHF & FRMSS Standards',

    pricingTitle: 'Club Licenses & Subscriptions',
    pricingSubtitle: 'Choose the best plan for your club or league with full IHF scoresheet support',
    activePlan: 'Currently Active Plan',
    enterKeyPrompt: 'Have an activation code or license key?',
    keyPlaceholder: 'Enter your code here (e.g. DEMO-PRO-2026)',
    activateBtn: 'Activate License Now',
    orBuyAtStore: 'Or purchase your official club license at our store:',
    visitStore: 'Visit appsports.store',
    licensedTo: 'Licensed to:',
    expiresOn: 'Expires on:',
    deactivateLicense: 'Deactivate license on this device'
  }
};

export const getStoredLanguage = (): AppLanguage => {
  const saved = localStorage.getItem('app_language') as AppLanguage;
  if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
    return saved;
  }
  return 'ar'; // Default language
};

export const setStoredLanguage = (lang: AppLanguage): void => {
  localStorage.setItem('app_language', lang);
};
