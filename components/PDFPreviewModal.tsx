import React, { useState, useRef, useEffect } from 'react';
import { MatchState, AppLanguage } from '../types.ts';
import { MatchAnalysisReport } from '../utils/matchAnalysis.ts';
import { generateAnalysisPDF, downloadReportAsPNG, PDFCustomizationOptions } from '../utils/analysisPdfGenerator.ts';
import { MatchAnalysisReportContent } from './MatchAnalysisReportContent.tsx';
import { 
  X, 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Loader2, 
  Sliders, 
  Type, 
  GripVertical, 
  Image as ImageIcon,
  FileCheck,
  Files,
  Maximize2
} from 'lucide-react';

interface PDFPreviewModalProps {
  match: MatchState;
  analysis: MatchAnalysisReport;
  aiAnalysis?: any;
  isDarkMode: boolean;
  lang: AppLanguage;
  onClose: () => void;
}

const getInitialZoom = (): number => {
  if (typeof window === 'undefined') return 0.85;
  const w = window.innerWidth;
  if (w < 500) return 0.43;
  if (w < 768) return 0.62;
  if (w < 1024) return 0.75;
  return 0.86;
};

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  match,
  analysis,
  aiAnalysis,
  isDarkMode,
  lang,
  onClose
}) => {
  const isRtl = lang === 'ar';

  // Customization state
  const [marginMm, setMarginMm] = useState<number>(10); // default 10mm (1 cm)
  const [fontFamily, setFontFamily] = useState<string>('Cairo, sans-serif');
  const [fontSizeScale, setFontSizeScale] = useState<number>(0.95);
  const [zoomLevel, setZoomLevel] = useState<number>(getInitialZoom);
  const [fitOnePage, setFitOnePage] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingPNG, setIsExportingPNG] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Draggable Toolbar state
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
  };

  const handleFitZoom = () => {
    setZoomLevel(getInitialZoom());
    setPos({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      setExportError(null);
      setIsExporting(true);
      const options: PDFCustomizationOptions = {
        marginMm,
        fontFamily,
        fontSizeScale,
        fitOnePage
      };
      const ok = await generateAnalysisPDF('match-analysis-preview-report', match, lang, options);
      if (!ok) {
        setExportError(isRtl ? 'تعذر إنشاء ملف PDF' : 'Échec de la génération PDF');
      }
    } catch (e) {
      console.error('PDF export error', e);
      setExportError(isRtl ? 'حدث خطأ أثناء تصدير PDF' : 'Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setExportError(null);
      setIsExportingPNG(true);
      const options: PDFCustomizationOptions = {
        marginMm,
        fontFamily,
        fontSizeScale
      };
      const ok = await downloadReportAsPNG('match-analysis-preview-report', match, lang, options);
      if (!ok) {
        setExportError(isRtl ? 'تعذر تصدير صورة PNG' : 'Échec de l\'export PNG');
      }
    } catch (e) {
      console.error('PNG export error', e);
      setExportError(isRtl ? 'حدث خطأ أثناء تصدير PNG' : 'Erreur lors de l\'export PNG');
    } finally {
      setIsExportingPNG(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`w-full max-w-6xl h-[95vh] flex flex-col rounded-[2rem] border-2 shadow-2xl overflow-hidden relative ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2 flex-wrap">
                <span>{isRtl ? 'معاينة وتخصيص تقرير PDF الرسمي' : 'Aperçu & Personnalisation PDF'}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-300'
                }`}>
                  A4 • 210×297 mm
                </span>
              </h2>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {fitOnePage 
                  ? (isRtl ? 'تم ضبط المحتوى والفقرات متراصة بدقة على صفحة A4 واحدة دون أي تقطيع' : 'Contenu ajusté sur 1 page A4 sans coupure')
                  : (isRtl ? 'وضع الصفحات المتعددة المنظمة مع ترقيم تلقائي وفواصل ذكية للبطاقات' : 'Mode multi-pages sans coupure de carte avec numérotation')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title={isRtl ? 'إغلاق المعاينة' : 'Fermer'}
          >
            <X size={20} />
          </button>
        </div>

        {exportError && (
          <div className={`mx-4 mt-3 px-4 py-2.5 rounded-2xl border text-xs font-black flex items-center justify-between gap-2 shrink-0 ${
            isDarkMode ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
          }`}>
            <span>{exportError}</span>
            <button type="button" onClick={() => setExportError(null)} className="p-1 rounded-lg hover:bg-rose-500/20 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Preview Scrollable Area */}
        <div className={`flex-1 overflow-auto p-4 sm:p-10 flex justify-center items-start relative ${
          isDarkMode ? 'bg-slate-950' : 'bg-slate-200/80'
        }`}>
          
          {/* Draggable Floating Toolbar */}
          <div 
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            className={`fixed sm:absolute top-20 sm:top-4 z-50 max-w-[94vw] flex items-center gap-2 p-2 rounded-2xl shadow-2xl border backdrop-blur-md select-none transition-shadow ${
              isDarkMode
                ? 'bg-slate-900/95 text-white border-slate-700'
                : 'bg-white/95 text-slate-900 border-slate-300'
            }`}
          >
            {/* Drag Handle */}
            <div 
              onMouseDown={handleMouseDown}
              className={`hidden sm:block cursor-grab active:cursor-grabbing p-1 transition ${
                isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
              }`}
              title={isRtl ? 'اسحب لتحريك العارضة' : 'Déplacer'}
            >
              <GripVertical size={18} />
            </div>

            {/* Quick Settings Controls */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {/* Page Format Toggle */}
              <button
                type="button"
                onClick={() => setFitOnePage(!fitOnePage)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                  fitOnePage 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                    : isDarkMode
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={isRtl ? 'تبديل بين صفحة A4 واحدة أو صفحات متعددة' : 'Basculer 1 page / multi-pages'}
              >
                {fitOnePage ? <FileCheck size={14} /> : <Files size={14} />}
                <span>{fitOnePage ? (isRtl ? 'صفحة A4 واحدة' : '1 Page A4') : (isRtl ? 'متعدد الصفحات' : 'Multi-pages')}</span>
              </button>

              {/* Margin Select */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                <Sliders size={14} className="text-blue-500 shrink-0" />
                <span className="hidden md:inline">{isRtl ? 'الهوامش:' : 'Marges:'}</span>
                <select
                  value={marginMm}
                  onChange={(e) => setMarginMm(Number(e.target.value))}
                  className="bg-transparent font-black outline-none cursor-pointer"
                >
                  <option value={5} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>0.5 {isRtl ? 'سم' : 'cm'}</option>
                  <option value={10} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1.0 {isRtl ? 'سم' : 'cm'}</option>
                  <option value={15} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1.5 {isRtl ? 'سم' : 'cm'}</option>
                  <option value={20} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>2.0 {isRtl ? 'سم' : 'cm'}</option>
                </select>
              </div>

              {/* Font Family Select */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                <Type size={14} className="text-indigo-500 shrink-0" />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-transparent font-black outline-none cursor-pointer"
                >
                  <option value="Cairo, sans-serif" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Cairo</option>
                  <option value="Inter, sans-serif" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Inter</option>
                  <option value="Times New Roman, serif" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Times</option>
                  <option value="Arial, sans-serif" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Arial</option>
                </select>
              </div>

              {/* Font Size Select */}
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-bold ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                <span className="text-emerald-500 font-black">A</span>
                <select
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(Number(e.target.value))}
                  className="bg-transparent font-black outline-none cursor-pointer"
                >
                  <option value={0.88} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>0.88x</option>
                  <option value={0.95} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>0.95x</option>
                  <option value={1.0} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1.0x</option>
                  <option value={1.1} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1.1x</option>
                </select>
              </div>

              {/* Zoom Controls */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.35, Number((prev - 0.1).toFixed(2))))}
                  className={`p-1 rounded-lg transition cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'}`}
                  title={isRtl ? 'تصغير المعاينة' : 'Zoom -'}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-mono font-black px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.3, Number((prev + 0.1).toFixed(2))))}
                  className={`p-1 rounded-lg transition cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'}`}
                  title={isRtl ? 'تكبير المعاينة' : 'Zoom +'}
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleFitZoom}
                  className={`p-1 rounded-lg transition cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-200 text-blue-600'}`}
                  title={isRtl ? 'ملاءمة الشاشة' : 'Ajuster'}
                >
                  <Maximize2 size={13} />
                </button>
              </div>

              {/* PNG Download Button */}
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={isExportingPNG}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title={isRtl ? 'تحميل التقرير كصورة PNG' : 'Télécharger PNG'}
              >
                {isExportingPNG ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                <span>{isExportingPNG ? (isRtl ? 'جارٍ الحفظ...' : 'Export...') : 'PNG'}</span>
              </button>

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-xs shadow-md shadow-rose-600/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title={isRtl ? 'تحميل ملف PDF' : 'Télécharger PDF'}
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{isExporting ? (isRtl ? 'جارٍ التصدير...' : 'Export...') : (isRtl ? 'تحميل PDF' : 'PDF')}</span>
              </button>
            </div>
          </div>

          {/* Printable Report Preview Card (A4 Paper Sheet) */}
          <div className="mt-24 sm:mt-16 flex justify-center w-full">
            <div 
              className="transition-transform duration-200 origin-top shrink-0 border border-slate-300"
              style={{ 
                transform: `scale(${zoomLevel})`,
                width: '794px', // Exact A4 portrait width @ 96 DPI
                minHeight: fitOnePage ? '1123px' : 'auto',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily,
                fontSize: `${fontSizeScale * 100}%`,
                padding: `${marginMm}mm`,
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
              }}
            >
              {/* Crisp Always-Light A4 Content */}
              <div id="match-analysis-preview-report" className="space-y-4 text-slate-900 bg-white">
                <MatchAnalysisReportContent
                  match={match}
                  analysis={analysis}
                  aiAnalysis={aiAnalysis}
                  isDarkMode={false}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={`p-3 text-center border-t text-xs font-bold shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          {isRtl 
            ? 'معاينة حية مطابقة لورقة A4 عند التصدير • الترتيب والفقرات متماسكة بدون قص أو تقطيع' 
            : 'Aperçu A4 fidèle à l’export • Blocs préservés sans coupure'}
        </div>

      </div>
    </div>
  );
};
