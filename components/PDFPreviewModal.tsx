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
  Files
} from 'lucide-react';

interface PDFPreviewModalProps {
  match: MatchState;
  analysis: MatchAnalysisReport;
  aiAnalysis?: any;
  isDarkMode: boolean;
  lang: AppLanguage;
  onClose: () => void;
}

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
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [fitOnePage, setFitOnePage] = useState<boolean>(true); // Default to consolidated 1-page A4
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingPNG, setIsExportingPNG] = useState<boolean>(false);

  // Draggable Toolbar state
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

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

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const options: PDFCustomizationOptions = {
        marginMm,
        fontFamily,
        fontSizeScale,
        fitOnePage
      };
      const ok = await generateAnalysisPDF('match-analysis-printable-report', match, lang, options);
      if (!ok) {
        alert(lang === 'ar' ? 'تعذر إنشاء ملف PDF' : 'Échec de la génération PDF');
      }
    } catch (e) {
      console.error('PDF export error', e);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تصدير PDF' : 'Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setIsExportingPNG(true);
      const options: PDFCustomizationOptions = {
        marginMm,
        fontFamily,
        fontSizeScale
      };
      const ok = await downloadReportAsPNG('match-analysis-printable-report', match, lang, options);
      if (!ok) {
        alert(lang === 'ar' ? 'تعذر تصدير صورة PNG' : 'Échec de l\'export PNG');
      }
    } catch (e) {
      console.error('PNG export error', e);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تصدير PNG' : 'Erreur lors de l\'export PNG');
    } finally {
      setIsExportingPNG(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-6xl h-[95vh] flex flex-col rounded-[2.5rem] border-2 shadow-2xl overflow-hidden relative ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {lang === 'ar' ? 'معاينة وتخصيص تقرير PDF الرسمي' : 'Aperçu & Personnalisation PDF'}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {fitOnePage 
                  ? (lang === 'ar' ? 'تم ضبط المحتوى والفقرات متراصة بدقة على صفحة A4 واحدة دون أي تقطيع' : 'Contenu ajusté sur 1 page A4 sans coupure')
                  : (lang === 'ar' ? 'وضع الصفحات المتعددة المنظمة مع ترقيم تلقائي' : 'Mode multi-pages avec numérotation')}
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="إغلاق المعاينة"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 bg-slate-100 dark:bg-slate-950 flex justify-center items-start relative">
          
          {/* Draggable Floating Toolbar (عارضة قابلة للتحريك) */}
          <div 
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            className="absolute top-4 z-50 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 backdrop-blur-md select-none transition-shadow"
          >
            {/* Drag Handle */}
            <div 
              onMouseDown={handleMouseDown}
              className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-white transition"
              title="اسحب لتحريك العارضة"
            >
              <GripVertical size={18} />
            </div>

            {/* Quick Settings Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Page Format Toggle (1 Page vs Multi) */}
              <button
                type="button"
                onClick={() => setFitOnePage(!fitOnePage)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                  fitOnePage 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
                }`}
                title={lang === 'ar' ? 'تبديل بين صفحة A4 واحدة أو صفحات متعددة' : 'Basculer 1 page / multi-pages'}
              >
                {fitOnePage ? <FileCheck size={14} /> : <Files size={14} />}
                <span>{fitOnePage ? (lang === 'ar' ? 'صفحة A4 واحدة' : '1 Page A4') : (lang === 'ar' ? 'متعدد الصفحات' : 'Multi-pages')}</span>
              </button>

              {/* Margin Select */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
                <Sliders size={14} className="text-blue-400" />
                <span>{lang === 'ar' ? 'الهوامش:' : 'Marges:'}</span>
                <select
                  value={marginMm}
                  onChange={(e) => setMarginMm(Number(e.target.value))}
                  className="bg-transparent font-black text-white outline-none cursor-pointer"
                >
                  <option value={5} className="bg-slate-900">0.5 سم</option>
                  <option value={10} className="bg-slate-900">1.0 سم (موصى به)</option>
                  <option value={15} className="bg-slate-900">1.5 سم</option>
                  <option value={20} className="bg-slate-900">2.0 سم</option>
                </select>
              </div>

              {/* Font Family Select */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
                <Type size={14} className="text-indigo-400" />
                <span>{lang === 'ar' ? 'الخط:' : 'Police:'}</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-transparent font-black text-white outline-none cursor-pointer"
                >
                  <option value="Cairo, sans-serif" className="bg-slate-900">Cairo (عربي)</option>
                  <option value="Inter, sans-serif" className="bg-slate-900">Inter (عصري)</option>
                  <option value="Times New Roman, serif" className="bg-slate-900">Times New Roman</option>
                  <option value="Arial, sans-serif" className="bg-slate-900">Arial</option>
                </select>
              </div>

              {/* Font Size Select */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
                <span className="text-emerald-400 font-black">A</span>
                <select
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(Number(e.target.value))}
                  className="bg-transparent font-black text-white outline-none cursor-pointer"
                >
                  <option value={0.88} className="bg-slate-900">صغير جداً (0.88x)</option>
                  <option value={0.95} className="bg-slate-900">متناسق (0.95x)</option>
                  <option value={1.0} className="bg-slate-900">عادي (1.0x)</option>
                  <option value={1.1} className="bg-slate-900">كبير (1.1x)</option>
                </select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
                  className="p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer text-slate-300"
                  title="تصغير المعاينة"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs font-mono font-black px-1 text-slate-200">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.15))}
                  className="p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer text-slate-300"
                  title="تكبير المعاينة"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              {/* PNG Download Button */}
              <button
                onClick={handleDownloadPNG}
                disabled={isExportingPNG}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="تحميل التقرير كصورة PNG"
              >
                {isExportingPNG ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                <span>{isExportingPNG ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Export...') : (lang === 'ar' ? 'صورة PNG' : 'PNG')}</span>
              </button>

              {/* PDF Download Button */}
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="تحميل ملف PDF"
              >
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                <span>{isExporting ? (lang === 'ar' ? 'جارٍ التصدير...' : 'Export...') : (lang === 'ar' ? 'تحميل PDF' : 'PDF')}</span>
              </button>
            </div>
          </div>

          {/* Printable Report Preview Card (A4 Page Frame) */}
          <div 
            className="transition-all duration-200 shadow-2xl origin-top mt-16"
            style={{ 
              transform: `scale(${zoomLevel})`,
              width: '794px', // A4 width at 96 DPI
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily,
              fontSize: `${fontSizeScale * 100}%`,
              padding: `${marginMm}mm`,
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* The Cloned/Rendered Content of the Report with ID for PDF Generation */}
            <div id="match-analysis-printable-report" className="space-y-4 text-slate-900 bg-white">
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

        {/* Footer info */}
        <div className={`p-3 text-center border-t text-xs font-bold text-slate-500 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {lang === 'ar' 
            ? 'معاينة حية تفاعلية مطابقة لنتيجة ملف الـ PDF تماماً • الفقرات متماسكة وغير منقسمة' 
            : 'Aperçu fidèle au PDF exporté • Paragraphes consolidés'}
        </div>

      </div>
    </div>
  );
};
