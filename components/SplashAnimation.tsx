import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Activity } from 'lucide-react';
import { AppLanguage } from '../types.ts';
import { translations } from '../utils/translations.ts';

interface SplashAnimationProps {
  onComplete: () => void;
  lang?: AppLanguage;
  isDarkMode?: boolean;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({ onComplete, lang = 'ar', isDarkMode = true }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 500); // 500ms fade out transition
      return () => clearTimeout(exitTimer);
    }, 1800); // 1.8s splash display

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
      fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
    } ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white'}`}>
      
      {/* Background ambient glowing gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-75" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/50 mb-6 border border-white/25 animate-bounce">
          <Trophy size={52} strokeWidth={2.2} className="drop-shadow-lg" />
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-300 text-xs font-black tracking-widest uppercase mb-3">
          <Sparkles size={14} className="text-amber-400 animate-spin" />
          <span>HandManager PRO 5.0</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          {lang === 'ar' ? 'تطبيق إدارة مباريات كرة اليد' : 'Handball Management Pro'}
        </h1>

        <p className="text-xs sm:text-sm font-bold text-slate-400 text-center max-w-xs sm:max-w-md">
          {lang === 'ar' ? 'جاري تحميل النظام والإحصائيات بذكاء وسرعة فائقة...' : 'Chargement du système et des statistiques...'}
        </p>

        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping delay-100" />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping delay-200" />
        </div>
      </div>
    </div>
  );
};
