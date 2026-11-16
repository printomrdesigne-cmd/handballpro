import { SubscriptionPlan, SubscriptionState } from '../types.ts';

export type { SubscriptionState };

export const STORE_URL = 'https://handballscore.appsports.store/';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'club_yearly',
    name: 'Licence Saisonnière Individuelle',
    nameAr: 'الاشتراك السنوي الرسمي (30 درهم)',
    price: '30 DH',
    priceDh: '30 درهم',
    period: '/ an',
    periodAr: 'سنوياً',
    badge: 'OFFICIEL',
    badgeAr: 'الاشتراك المعتمد',
    description: 'Accès complet à toutes les fonctionnalités activées par le Gérant Central pour toute la saison sportive.',
    descriptionAr: 'ولوج كامل لكافة الميزات المفعلة من طرف المسير المركزي طيلة الموسم الرياضي.',
    features: [
      'Matchs et tournois illimités',
      'Feuilles de match officielles IHF / Fédérales en PDF A4',
      'Signatures tactiles arbitres et officiels',
      'Fonctionne 100% Hors-Ligne (PWA sans internet)',
      'Rapports d\'analyse et affiches sociales'
    ],
    featuresAr: [
      'عدد لا نهائي من المباريات طيلة الموسم',
      'طباعة ورقة التحكيم الرسمية المعتمدة A4 PDF',
      'توقيعات إلكترونية رقمية للحكام والمسؤولين',
      'تشغيل كامل بدون إنترنت (100% Offline PWA)',
      'تقارير التحليل والملصقات الاحترافية'
    ],
    recommended: true,
    storeUrl: `${STORE_URL}?plan=club_pro`
  },
  {
    id: 'tournament',
    name: 'Pass Établissement & Association',
    nameAr: 'اشتراك المؤسسات والجمعيات',
    price: '30 DH',
    priceDh: '30 درهم',
    period: '/ saison',
    periodAr: 'للموسم',
    badge: 'COMPACT',
    badgeAr: 'عملي',
    description: 'Idéal pour les enseignants EPS, associations scolaires et tournois locaux.',
    descriptionAr: 'مثالي لأساتذة التربية البدنية والجمعيات الرياضية المدرسية والدوريات المحلية.',
    features: [
      'Gestion complète des matchs et feuilles de score',
      'Gestion des 2 minutes et cartons',
      'Export des archives en un clic'
    ],
    featuresAr: [
      'إدارة كاملة للمباريات وورقة التحكيم',
      'إدارة الإقصاءات والعقوبات في الوقت الفعلي',
      'أرشفة وطباعة النتائج فوراً'
    ],
    storeUrl: `${STORE_URL}?plan=tournament`
  },
  {
    id: 'league',
    name: 'Licence Ligue & Direction',
    nameAr: 'ترخيص العصب والمديريات',
    price: '30 DH',
    priceDh: '30 درهم',
    period: '/ poste',
    periodAr: 'لكل حساب',
    badge: 'OFFICIEL',
    badgeAr: 'رسمي',
    description: 'Pour les ligues régionales, comités et associations gérant plusieurs salles et compétitions.',
    descriptionAr: 'مخصص للعصب الجهوية، اللجان الإقليمية، والقاعات الرياضية.',
    features: [
      'Personnalisation avec logo officiel',
      'Gestion centralisée des plannings de matchs',
      'Activation contrôlée par le Gérant Central'
    ],
    featuresAr: [
      'إدراج الشعار الرسمي للعصبة والجامعة في ورقة التحكيم',
      'برمجة وإدارة مركزية للمباريات',
      'تفعيل وتحكم مباشر من طرف المسير المركزي'
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
 * Validates that a license key matches an expected server-assigned key when provided.
 * Client-side blind key generation is disabled; activation is controlled by the Central Manager.
 */
export const validateLicenseKey = (
  key: string,
  expectedAssignedCode?: string
): { valid: boolean; message: string; state?: SubscriptionState } => {
  const cleanKey = key.trim().toUpperCase();

  if (!cleanKey) {
    return { valid: false, message: 'يرجى إدخال كود التفعيل المستلم من المسير المركزي' };
  }

  const normalizedExpected = (expectedAssignedCode || '').trim().toUpperCase();
  if (normalizedExpected && cleanKey === normalizedExpected) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const newState: SubscriptionState = {
      isPro: true,
      planId: 'club_yearly',
      licenseKey: cleanKey,
      activatedAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      clubName: 'Abonné Officiel'
    };
    saveSubscriptionState(newState);
    return { valid: true, message: 'تم تفعيل حسابك بنجاح!', state: newState };
  }

  return { 
    valid: false, 
    message: 'كود التفعيل غير صحيح أو لم يتم اعتماده لهذا الحساب من طرف المسير المركزي.' 
  };
};

export const deactivateLicense = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
};
