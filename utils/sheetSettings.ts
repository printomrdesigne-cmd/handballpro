export interface SheetSettings {
  logoUrl?: string; // Custom base64 image or image URL
  mainTitleAr: string; // Title on the Arabic side of the match sheet
  mainTitleFr: string; // Title on the French side of the match sheet
  league?: string; // Default Ligue / العصبة (e.g. عصبة جهة فاس مكناس)
  academy: string; // Default Academy / AREF
  direction: string; // Default Directorate
  competition: string; // Default Competition title
}

export const MOROCCAN_LEAGUES = [
  'عصبة جهة فاس - مكناس',
  'عصبة جهة الدار البيضاء - سطات',
  'عصبة جهة الرباط - سلا - القنيطرة',
  'عصبة جهة طنجة - تطوان - الحسيمة',
  'عصبة جهة الشرق',
  'عصبة جهة مراكش - آسفي',
  'عصبة جهة سوس - ماسة',
  'عصبة جهة بني ملال - خنيفرة',
  'عصبة جهة درعة - تافيلالت',
  'عصبة جهة كلميم - واد نون',
  'عصبة جهة العيون - الساقية الحمراء',
  'عصبة جهة الداخلة - وادي الذهب'
];

export const DEFAULT_SHEET_SETTINGS: SheetSettings = {
  logoUrl: '',
  mainTitleAr: 'الجامعة الملكية المغربية\nللرياضة المدرسية',
  mainTitleFr: 'FÉDÉRATION ROYALE MAROCAINE\nDU SPORT SCOLAIRE',
  league: '',
  academy: '',
  direction: '',
  competition: 'البطولة المدرسية'
};

const SETTINGS_STORAGE_KEY = 'handball_sheet_custom_settings';

export const getSheetSettings = (): SheetSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SHEET_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load sheet settings', e);
  }
  return DEFAULT_SHEET_SETTINGS;
};

export const saveSheetSettings = (settings: SheetSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('sheet-settings-updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save sheet settings', e);
  }
};
