import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { AppLanguage } from '../types.ts';
import { WifiOff, Wifi, CheckCircle2, ShieldCheck, Info, X } from 'lucide-react';

interface OfflineIndicatorProps {
  lang: AppLanguage;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        resetWasOffline();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Notice when internet is restored
  if (showRestoredNotice) {
    return (
      <aside 
        aria-label={lang === 'ar' ? 'حالة الاتصال' : 'Connection status'}
        className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-4 z-50 flex items-center justify-between gap-3 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-950/30 border border-emerald-400 animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center gap-2 text-xs font-bold">
          <Wifi className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            {lang === 'ar' ? 'تمت استعادة الاتصال بالإنترنت' : lang === 'fr' ? 'Connexion Internet rétablie' : 'Internet connection restored'}
          </span>
        </div>
        <button onClick={() => setShowRestoredNotice(false)} className="p-1 hover:bg-emerald-700 rounded-lg">
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // Notice when offline
  if (!isOnline) {
    return (
      <>
        <aside 
          aria-label={lang === 'ar' ? 'حالة عدم الاتصال' : 'Offline mode'}
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-4 z-50 flex items-center justify-between gap-3 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-300/80 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-2.5 text-xs font-black">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-900"></span>
            </span>
            <WifiOff className="w-4 h-4 shrink-0 text-slate-900" />
            <div>
              <span className="block font-black text-xs">
                {lang === 'ar' ? 'وضع العمل بدون إنترنت مفعّل' : lang === 'fr' ? 'Mode hors-ligne actif' : 'Offline mode active'}
              </span>
              <span className="text-[11px] font-semibold text-slate-800 hidden sm:inline">
                {lang === 'ar' 
                  ? 'جميع ميزات المباراة، الوقت، النتائج، الأرشيف، وورقة المباراة تعمل محلياً 100%' 
                  : 'Chronomètre, scores, feuille de match et archives opérationnels à 100%'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowDetailsModal(true)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[11px] rounded-lg shrink-0 transition"
          >
            {lang === 'ar' ? 'التفاصيل' : 'Détails'}
          </button>
        </aside>

        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-amber-500/30 text-gray-900 dark:text-white">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base">
                      {lang === 'ar' ? 'العمل بدون إنترنت (Offline)' : 'Mode 100% Hors-ligne'}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {lang === 'ar' ? 'جاهز للملعب والقاعات الرياضية بدون شبكة' : 'Idéal pour les gymnases sans réseau'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {lang === 'ar' ? 'إدارة وتوقيت المباراة' : 'Gestion du match et chronomètre'}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {lang === 'ar' ? 'العد التنازلي، التوقيف المؤقت، الأهداف، الإنذارات والعقوبات تعمل فورياً.' : 'Scores, temps morts et sanctions fonctionnent en direct.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {lang === 'ar' ? 'حفظ الأرشيف محلياً' : 'Sauvegarde locale'}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {lang === 'ar' ? 'يتم حفظ جميع نتائج المباريات تلقائياً في ذاكرة المتصفح والهاتف.' : 'Toutes les données de matchs sont sécurisées dans le stockage local.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {lang === 'ar' ? 'ورقة المباراة والتوقيعات' : 'Feuille de match et signatures'}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {lang === 'ar' ? 'توليد ورقة المباراة وطباعتها وتوقيع الحكام والمدربين بدون اتصال.' : 'Signature des arbitres et génération de la feuille de match hors-ligne.'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="mt-5 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                {lang === 'ar' ? 'متابعة العمل' : 'Continuer'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
