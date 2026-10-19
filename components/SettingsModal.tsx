import React, { useState, useEffect } from 'react';
import { SheetSettings, getSheetSettings, saveSheetSettings, DEFAULT_SHEET_SETTINGS } from '../utils/sheetSettings.ts';
import { AppLanguage } from '../types.ts';
import { Settings, Upload, Image as ImageIcon, RotateCcw, Check, X, Building2, Shield, Eye, FileText, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: AppLanguage;
  isDarkMode?: boolean;
  onSettingsSaved?: (newSettings: SheetSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
  isDarkMode = false,
  onSettingsSaved
}) => {
  const [settings, setSettings] = useState<SheetSettings>(() => getSheetSettings());
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSheetSettings();
      setSettings(current);
      setLogoPreview(current.logoUrl || '');
      setSavedSuccess(false);
      setUploadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(isRtl ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Veuillez choisir une image valide');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError(isRtl ? 'حجم الصورة كبير جداً (الحد الأقصى 4 ميغابايت)' : 'Image trop volumineuse (max 4 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setLogoPreview(res);
      setSettings(prev => ({ ...prev, logoUrl: res }));
    };
    reader.onerror = () => {
      setUploadError(isRtl ? 'فشل تحميل الصورة' : 'Erreur de lecture de l\'image');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoPreview('');
    setSettings(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleResetAll = () => {
    setSettings({ ...DEFAULT_SHEET_SETTINGS });
    setLogoPreview('');
  };

  const handleSave = () => {
    saveSheetSettings(settings);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border flex flex-col ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-inherit z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                {isRtl ? 'إعدادات ورقة التحكيم والشعار' : 'Paramètres de la feuille de match et logo'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                {isRtl ? 'تخصيص الشعار والعناوين الرسمية للمباريات' : 'Personnalisez le logo et les titres officiels'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 text-xs font-bold">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-black">
              <Check size={18} className="text-emerald-500" />
              <span>{isRtl ? 'تم حفظ التعديلات وتحديث ورقة المباراة بنجاح!' : 'Paramètres enregistrés avec succès !'}</span>
            </div>
          )}

          {/* Section 1: Logo Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-500" />
                <span>{isRtl ? 'شعار ورقة المباراة (Logo)' : 'Logo de la feuille de match'}</span>
              </label>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{isRtl ? 'استعادة الشعار الرسمي الافتراضي' : 'Restaurer le logo officiel'}</span>
                </button>
              )}
            </div>

            <div className={`p-4 rounded-2xl border-2 border-dashed flex flex-col sm:flex-row items-center gap-4 ${
              isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
            }`}>
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden">
                <img
                  src={logoPreview || 'https://images.weserv.nl/?url=https://tibuafrica.org/wp-content/uploads/2023/07/FRMSS.png&w=200&output=png'}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-start">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRtl 
                    ? 'يمكنك رفع شعار النادي، الجمعية الرياضية، العصبة، أو المؤسسة ليظهر في أعلى ورقة المباراة.'
                    : 'Téléversez le logo de votre club, établissement ou association pour la feuille de match.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-2 transition active:scale-95">
                    <Upload size={14} />
                    <span>{isRtl ? 'رفع شعار جديد من الجهاز' : 'Choisir une image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {logoPreview ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} />
                      <span>{isRtl ? 'تم تطبيق شعار مخصص' : 'Logo personnalisé actif'}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {isRtl ? 'الشعار الافتراضي (FRMSS)' : 'Logo FRMSS par défaut'}
                    </span>
                  )}
                </div>

                {uploadError && (
                  <p className="text-rose-500 text-[11px] font-bold">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Main Titles (Arabic & French) */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Building2 size={16} />
              <span>{isRtl ? 'تعديل العناوين الرئيسية لورقة التحكيم' : 'Titres principaux de la feuille'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Main Arabic Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {isRtl ? 'العنوان الرئيسي باللغة العربية (يمين أو يسار الشعار):' : 'Titre officiel en Arabe :'}
                </label>
                <textarea
                  rows={2}
                  value={settings.mainTitleAr}
                  onChange={e => setSettings(prev => ({ ...prev, mainTitleAr: e.target.value }))}
                  placeholder="الجامعة الملكية المغربية للرياضة المدرسية"
                  className={`w-full p-2.5 rounded-xl border-2 text-xs font-black resize-none outline-none leading-relaxed ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <span className="text-[10px] text-slate-400 block font-normal">
                  {isRtl ? 'يمكنك وضع اسم النادي، العصبة، أو الجامعة' : 'Ex: FRMSS ou nom du club'}
                </span>
              </div>

              {/* Main French / International Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {isRtl ? 'العنوان الرئيسي بالفرنسية / الأجنبية:' : 'Titre officiel en Français :'}
                </label>
                <textarea
                  rows={2}
                  value={settings.mainTitleFr}
                  onChange={e => setSettings(prev => ({ ...prev, mainTitleFr: e.target.value }))}
                  placeholder="FÉDÉRATION ROYALE MAROCAINE DU SPORT SCOLAIRE"
                  className={`w-full p-2.5 rounded-xl border-2 text-xs font-black uppercase resize-none outline-none leading-relaxed ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <span className="text-[10px] text-slate-400 block font-normal">
                  {isRtl ? 'يظهر بالجهة المقابلة للشعار' : 'Affiché en face du logo'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Academy, Directorate & Competition */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FileText size={16} />
              <span>{isRtl ? 'الأكاديمية والمديرية والمسابقة الافتراضية' : 'Académie, Direction et Compétition'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {isRtl ? 'الأكاديمية الجهوية (AREF):' : 'Académie Régionale :'}
                </label>
                <input
                  type="text"
                  value={settings.academy}
                  onChange={e => setSettings(prev => ({ ...prev, academy: e.target.value }))}
                  placeholder="مثال: جهة الشرق / الدار البيضاء سطات..."
                  className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {isRtl ? 'المديرية الإقليمية (Direction):' : 'Direction Provinciale :'}
                </label>
                <input
                  type="text"
                  value={settings.direction}
                  onChange={e => setSettings(prev => ({ ...prev, direction: e.target.value }))}
                  placeholder="مثال: مديرية تاوريرت / فجيج / الرباط..."
                  className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  {isRtl ? 'اسم البطولة / التظاهرة الرياضية الافتراضية:' : 'Nom de la compétition :'}
                </label>
                <input
                  type="text"
                  value={settings.competition}
                  onChange={e => setSettings(prev => ({ ...prev, competition: e.target.value }))}
                  placeholder="البطولة الوطنية المدرسية لكرة اليد"
                  className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Live Preview Box */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
              <Eye size={15} className="text-blue-500" />
              <span>{isRtl ? 'معاينة حية لشكل ترويسة ورقة المباراة:' : 'Aperçu en direct de l\'en-tête :'}</span>
            </div>

            <div className="p-2 bg-white text-black rounded-xl border-2 border-black shadow-sm overflow-hidden">
              <div className="flex border-b border-black h-16 text-center">
                {/* Side 1: Arabic Title */}
                <div className="w-1/3 flex items-center justify-center p-1 border-l border-black text-[10px] font-black leading-tight text-green-900 whitespace-pre-line">
                  {settings.mainTitleAr || 'العنوان الرئيسي بالعربية'}
                </div>
                {/* Logo */}
                <div className="w-1/3 flex items-center justify-center p-1">
                  <img
                    src={logoPreview || 'https://images.weserv.nl/?url=https://tibuafrica.org/wp-content/uploads/2023/07/FRMSS.png&w=150&output=png'}
                    alt="Preview"
                    className="h-12 max-w-full object-contain"
                  />
                </div>
                {/* Side 2: French Title */}
                <div className="w-1/3 flex items-center justify-center p-1 border-r border-black text-[7.5px] font-black uppercase leading-tight text-green-900 whitespace-pre-line">
                  {settings.mainTitleFr || 'TITRE EN FRANÇAIS'}
                </div>
              </div>

              {/* Sub bar */}
              <div className="flex h-6 text-[8px] font-bold">
                <div className="w-[45%] flex items-center justify-between px-2 border-l border-black bg-gray-50">
                  <span>الأكاديمية: {settings.academy || '-'}</span>
                  <span>المديرية: {settings.direction || '-'}</span>
                </div>
                <div className="flex-1 bg-green-700 text-white flex items-center justify-center font-black">
                  {settings.competition || 'البطولة المدرسية'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 sticky bottom-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>{isRtl ? 'استعادة جميع الإعدادات الأصلية' : 'Réinitialiser tout'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isRtl ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check size={16} />
              <span>{isRtl ? 'حفظ وتطبيق التغييرات' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
