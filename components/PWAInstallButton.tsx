import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { AppLanguage } from '../types.ts';
import { Download, Smartphone, Share2, PlusSquare, CheckCircle, X, Sparkles, HelpCircle } from 'lucide-react';

interface PWAInstallButtonProps {
  lang: AppLanguage;
  variant?: 'header' | 'card' | 'menu';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'header',
  onInstalled
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed as standalone app, do not show duplicate prompt
  if (isInstalled && !installedSuccess) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{lang === 'ar' ? 'التطبيق مثبت ويعمل كبرنامج هاتف' : lang === 'fr' ? 'Application installée sur votre appareil' : 'App installed on your device'}</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
        if (onInstalled) onInstalled();
      }
    } else {
      // Show instructional modal (for iOS or browsers where prompt requires manual menu action)
      setShowGuideModal(true);
    }
  };

  const getLabel = () => {
    if (lang === 'ar') return 'تثبيت التطبيق على الهاتف';
    if (lang === 'fr') return 'Installer sur mobile';
    return 'Install on Phone';
  };

  const getShortLabel = () => {
    if (lang === 'ar') return 'تثبيت التطبيق';
    if (lang === 'fr') return 'Installer';
    return 'Install';
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all transform animate-pulse hover:animate-none"
          title={getLabel()}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{getLabel()}</span>
          <span className="sm:hidden">{getShortLabel()}</span>
        </button>
      )}

      {variant === 'menu' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all font-bold text-xs sm:text-sm text-start"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{getLabel()}</span>
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">PWA</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {lang === 'ar' ? 'تشغيل سريع بدون متصفح والعمل بدون انترنت' : lang === 'fr' ? 'Accès rapide hors-ligne sans navigateur' : 'Fast launch & works offline'}
              </div>
            </div>
          </div>
          <Download className="w-4 h-4 shrink-0" />
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-blue-950 p-4 rounded-2xl border border-emerald-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-start w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/20 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-emerald-300">
                  {lang === 'ar' ? 'ثبّت التطبيق الآن على هاتفك' : lang === 'fr' ? 'Installez l\'application sur votre téléphone' : 'Install on your Phone now'}
                </h4>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  {lang === 'ar' ? 'يعمل بدون نت' : 'Hors-ligne'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {lang === 'ar' 
                  ? 'يعمل كتطبيق هاتف أصلي بدون شريط المتصفح ومع حفظ البيانات بدون إنترنت.'
                  : lang === 'fr'
                  ? 'Fonctionne comme une application native sans barre de navigation et utilisable 100% hors-ligne.'
                  : 'Works as a standalone native app with full offline capabilities.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{getLabel()}</span>
          </button>
        </div>
      )}

      {/* Instructional Guide Modal for iOS Safari / Unsupported prompt */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black leading-snug">
                  {lang === 'ar' ? 'طريقة تثبيت التطبيق على الهاتف' : lang === 'fr' ? 'Comment installer sur votre mobile' : 'How to install on phone'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'ar' ? 'بخطوتين بسيطتين ليصبح كبرنامج هاتف أصلي' : lang === 'fr' ? 'En 2 étapes simples' : 'In 2 simple steps'}
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 my-5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm mb-0.5">
                      {lang === 'ar' ? 'اضغط زر المشاركة (Share)' : 'Appuyez sur le bouton Partager'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5 flex-wrap">
                      {lang === 'ar' 
                        ? 'في أسفل متصفح Safari، اضغط على أيقونة المشاركة المربعة مع سهم للأعلى' 
                        : 'En bas de Safari, appuyez sur l\'icône de partage (carré avec flèche vers le haut)'}
                      <Share2 className="w-4 h-4 text-blue-500 inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm mb-0.5">
                      {lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Choisissez "Sur l\'écran d\'accueil"'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5 flex-wrap">
                      {lang === 'ar' 
                        ? 'مرر للأسفل واضغط على'
                        : 'Faites défiler vers le bas et touchez'}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {lang === 'ar' ? '"إضافة إلى الشاشة الرئيسية"' : '"Sur l\'écran d\'accueil"'}
                      </strong>
                      <PlusSquare className="w-4 h-4 text-emerald-500 inline" />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 my-5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm mb-0.5">
                      {lang === 'ar' ? 'فتح قائمة المتصفح (⋮)' : 'Ouvrez le menu du navigateur (⋮)'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === 'ar' 
                        ? 'في متصفح كروم أو المتصفح لديك، اضغط على النقاط الثلاث بالأعلى أو الأسفل.'
                        : 'Dans Chrome ou votre navigateur, appuyez sur les trois points verticaux.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm mb-0.5">
                      {lang === 'ar' ? 'اختر "تثبيت التطبيق" أو "إضافة للشاشة"' : 'Sélectionnez "Installer l\'application"'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === 'ar'
                        ? 'اضغط على "تثبيت التطبيق" (Install App) ليظهر التطبيق في شاشة تطبيقات هاتفك.'
                        : 'Appuyez sur "Installer l\'application" pour l\'ajouter à votre écran d\'accueil.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>
                {lang === 'ar' 
                  ? 'بمجرد التثبيت، ستتمكن من فتح التطبيق بضغطة زر واحدة حتى عند انقطاع الإنترنت نهائياً.'
                  : 'Une fois installée, l\'application fonctionne hors-ligne à 100% sans connexion internet.'}
              </span>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black text-xs sm:text-sm transition shadow-lg"
            >
              {lang === 'ar' ? 'حسناً، فهمت' : 'D\'accord, compris'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
