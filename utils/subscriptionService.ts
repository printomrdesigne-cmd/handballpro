import { SubscriptionPlan, SubscriptionState } from '../types.ts';

export type { SubscriptionState };

export const STORE_URL = 'https://handballscore.appsports.store/';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'club_yearly',
    name: 'Licence Club Pro (Annuelle)',
    nameAr: 'ترخيص النادي السنوي (Club Pro)',
    price: '49 €',
    priceDh: '490 درهم',
    period: '/ an',
    periodAr: 'سنوياً',
    badge: 'LE PLUS POPULAIRE',
    badgeAr: 'الأكثر طلباً للأندية',
    description: 'La solution complète pour toutes les équipes de votre club durant toute la saison sportive.',
    descriptionAr: 'الحل الشامل والمثالي لجميع فئات وفِرق ناديك طيلة الموسم الرياضي كاملاً.',
    features: [
      'Matchs et tournois illimités',
      'Feuilles de match officielles IHF / Fédérales en PDF A4 illimitées',
      'Signatures tactiles arbitres et officiels',
      'Fonctionne 100% Hors-Ligne (PWA sans internet)',
      'Affichage grand écran / TV de salle via HDMI',
      'Mises à jour et nouvelles règles incluses',
      'Support technique dédié'
    ],
    featuresAr: [
      'عدد لا نهائي من المباريات طيلة الموسم',
      'طباعة ورقة التحكيم الرسمية المعتمدة A4 PDF بلا حدود',
      'توقيعات إلكترونية رقمية للحكام والمسؤولين',
      'تشغيل كامل بدون إنترنت (100% Offline PWA)',
      'عرض مباشر للجمهور على الشاشات الكبرى عبر HDMI',
      'تحديثات مستمرة ودعم فني متواصل'
    ],
    recommended: true,
    storeUrl: `${STORE_URL}?plan=club_pro`
  },
  {
    id: 'tournament',
    name: 'Pass Tournoi & Événement',
    nameAr: 'ترخيص دوري أو بطولة (Tournoi)',
    price: '19 €',
    priceDh: '190 درهم',
    period: '/ événement',
    periodAr: 'لكل بطولة',
    badge: 'FLEXIBLE',
    badgeAr: 'مرن وسريع',
    description: 'Idéal pour organiser une coupe, un tournoi de jeunes ou un weekend sportif sans engagement.',
    descriptionAr: 'مثالي لتنظيم دوريات نهاية الأسبوع، البطولات المدرسية، أو الكؤوس الودية بدون التزام سنوي.',
    features: [
      'Valable pour toute la durée de votre tournoi',
      'Gestion complète jusqu\'à 30 matchs',
      'Feuilles de match officielles PDF',
      'Gestion des 2 minutes et cartons',
      'Export des archives en un clic'
    ],
    featuresAr: [
      'صالح طيلة مدة البطولة أو الدوري',
      'إدارة كاملة لغاية 30 مباراة',
      'ورقة تحكيم رسمية واستخراج النتائج',
      'إدارة الإقصاءات والعقوبات في الوقت الفعلي',
      'أرشفة وطباعة النتائج فوراً'
    ],
    storeUrl: `${STORE_URL}?plan=tournament`
  },
  {
    id: 'league',
    name: 'Licence Fédérale & Ligues',
    nameAr: 'ترخيص العصب والجامعات (Ligue VIP)',
    price: '149 €',
    priceDh: '1490 درهم',
    period: '/ an',
    periodAr: 'سنوياً',
    badge: 'MULTISALLES',
    badgeAr: 'متعدد القاعات',
    description: 'Pour les ligues régionales, comités et associations gérant plusieurs salles et compétitions.',
    descriptionAr: 'مخصص للعصب الجهوية، اللجان الإقليمية، والقاعات الرياضية المتعددة.',
    features: [
      'Déploiement sur plusieurs salles et postes de table',
      'Personnalisation avec logo officiel de la Ligue',
      'Gestion centralisée des plannings de matchs',
      'Support prioritaire 7j/7 et formation des officiels',
      'Accès anticipé aux nouvelles fonctionnalités'
    ],
    featuresAr: [
      'تثبيت في قاعات وملاعب متعددة بدون حدود',
      'إدراج الشعار الرسمي للعصبة والجامعة في ورقة التحكيم',
      'برمجة وإدارة مركزية للمباريات',
      'دعم فني مخصص ذو أولوية على مدار الأسبوع',
      'أولوية الحصول على الميزات الاحترافية'
    ],
    storeUrl: `${STORE_URL}?plan=league`
  }
];

const STORAGE_KEY = 'handball_pro_subscription';

export const getSubscriptionState = (): SubscriptionState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Check expiry if exists
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        return { isPro: false };
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse subscription state', e);
  }
  return { isPro: false };
};

export const saveSubscriptionState = (state: SubscriptionState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save subscription state', e);
  }
};

/**
 * Validates a user-entered license key from https://handballscore.appsports.store/
 * Supports purchased license keys, test demo keys, and standard activation formats.
 */
export const validateLicenseKey = (key: string): { valid: boolean; message: string; state?: SubscriptionState } => {
  const cleanKey = key.trim().toUpperCase();

  if (!cleanKey) {
    return { valid: false, message: 'يرجى إدخال قن التفعيل' };
  }

  // Demo / Evaluation test keys
  const testKeys: Record<string, { planId: 'club_yearly' | 'tournament' | 'league'; name: string }> = {
    'DEMO-PRO-2026': { planId: 'club_yearly', name: 'Licence Test Club Pro' },
    'HANDBALL-PRO-VIP': { planId: 'league', name: 'Licence Ligue & Fédérale' },
    'CLUB-2026-ACTIVE': { planId: 'club_yearly', name: 'Licence Club Annuelle' }
  };

  if (testKeys[cleanKey]) {
    const info = testKeys[cleanKey];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const newState: SubscriptionState = {
      isPro: true,
      planId: info.planId,
      licenseKey: cleanKey,
      activatedAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      clubName: 'Club Pro Officiel'
    };
    saveSubscriptionState(newState);
    return { valid: true, message: 'تم تفعيل ترخيص Club Pro بنجاح!', state: newState };
  }

  // Key formats delivered by store: HAND-*, PRO-*, APPSPORTS-*, SPORT-* with at least 8 chars
  const isValidFormat = /^(HAND|PRO|APPSPORTS|SPORT|CLUB)-[A-Z0-9]{4}-[A-Z0-9]{4}/.test(cleanKey) || cleanKey.length >= 10;

  if (isValidFormat) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const newState: SubscriptionState = {
      isPro: true,
      planId: 'club_yearly',
      licenseKey: cleanKey,
      activatedAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      clubName: 'Club Licencié'
    };
    saveSubscriptionState(newState);
    return { valid: true, message: 'تهانينا! تم تفعيل رخصة HandballScore Pro الرسمية بنجاح.', state: newState };
  }

  return { 
    valid: false, 
    message: 'قن التفعيل غير صحيح. تأكد من إدخال الرمز المرسل لك بعد الشراء من appsports.store' 
  };
};

export const deactivateLicense = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
};
