import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MatchState, AppLanguage } from '../types.ts';

export interface PDFCustomizationOptions {
  marginMm?: number; // default 10mm (1 cm)
  fontFamily?: string; // e.g. 'Cairo, sans-serif'
  fontSizeScale?: number; // e.g. 1.0
  fitOnePage?: boolean; // default true: adjust all content onto 1 clean A4 page
}

/**
 * Captures the formatted match analysis report element and exports it as a crisp,
 * high-resolution single-page (default) or multi-page A4 PDF report with customized margins,
 * font family, font size, and professional non-overlapping footer numbering.
 */
export const generateAnalysisPDF = async (
  elementId: string,
  match: MatchState,
  lang: AppLanguage = 'ar',
  options: PDFCustomizationOptions = {}
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  const marginMm = options.marginMm ?? 10;
  const fontFamily = options.fontFamily;
  const fontSizeScale = options.fontSizeScale;
  const fitOnePage = options.fitOnePage ?? true; // Default to 1-page consolidated fit

  // Temporarily apply custom styles if provided
  const originalFontFamily = element.style.fontFamily;
  const originalFontSize = element.style.fontSize;
  if (fontFamily) element.style.fontFamily = fontFamily;
  if (fontSizeScale) element.style.fontSize = `${fontSizeScale * 100}%`;

  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font loading check skipped', e);
  }

  const cleanName = (name: string) =>
    name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Match';

  const prefix = lang === 'ar' ? 'تقرير_تحليل_مباراة' : 'Rapport_Analyse_Match';
  const fileName = `${prefix}_${cleanName(match.homeTeam.name)}_ضد_${cleanName(match.awayTeam.name)}.pdf`;

  try {
    // Generate high-resolution image of the report element
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
      filter: (node: HTMLElement) => {
        if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
          return false;
        }
        return true;
      }
    });

    // Restore original styles
    if (fontFamily) element.style.fontFamily = originalFontFamily;
    if (fontSizeScale) element.style.fontSize = originalFontSize;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = marginMm; // user-selected margin in mm
    const footerSpace = 12; // 12mm reserved exclusively for footer to avoid any text overlap
    const printableWidth = pageWidth - (margin * 2);
    const printableHeight = pageHeight - (margin * 2) - footerSpace;

    const img = new Image();
    img.src = dataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    if (fitOnePage) {
      // 1-PAGE CONSOLIDATED FIT:
      // Proportionally scale content so it strictly fits within printableWidth and printableHeight
      const scaleW = printableWidth / img.width;
      const scaleH = printableHeight / img.height;
      const scale = Math.min(scaleW, scaleH);

      const renderWidth = img.width * scale;
      const renderHeight = img.height * scale;

      // Center horizontally within printable area
      const offsetX = margin + (printableWidth - renderWidth) / 2;
      const offsetY = margin;

      pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

      // Clean footer strictly separated from content
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Page 1 / 1', pageWidth / 2, pageHeight - 5, { align: 'center' });
      pdf.text('HandballScore PRO - Official Match Analysis & Technical Report', margin, pageHeight - 5);

      pdf.save(fileName);
      return true;
    }

    // MULTI-PAGE SLICING VIA CANVAS (Consolidated per page without ugly overlaps)
    const pxPerMm = img.width / printableWidth;
    const pageChunkPx = Math.floor(printableHeight * pxPerMm);
    const totalPages = Math.ceil(img.height / pageChunkPx);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Create an offscreen canvas for the current page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = img.width;
      const sourceY = page * pageChunkPx;
      const remainingHeight = img.height - sourceY;
      const currentChunkHeight = Math.min(pageChunkPx, remainingHeight);
      pageCanvas.height = currentChunkHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          img,
          0,
          sourceY,
          img.width,
          currentChunkHeight,
          0,
          0,
          pageCanvas.width,
          currentChunkHeight
        );
      }

      const chunkDataUrl = pageCanvas.toDataURL('image/png');
      const chunkHeightMm = (currentChunkHeight / pxPerMm);

      // Draw cleanly within margins
      pdf.addImage(chunkDataUrl, 'PNG', margin, margin, printableWidth, chunkHeightMm);

      // Footer strictly placed below printable area
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Page ${page + 1} / ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      pdf.text('HandballScore PRO - Official Match Analysis & Technical Report', margin, pageHeight - 5);
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate analysis PDF', err);
    // Restore original styles on error
    if (fontFamily) element.style.fontFamily = originalFontFamily;
    if (fontSizeScale) element.style.fontSize = originalFontSize;
    return false;
  }
};

/**
 * Captures the formatted match analysis report element and downloads/shares it as a crisp PNG image.
 */
export const downloadReportAsPNG = async (
  elementId: string,
  match: MatchState,
  lang: AppLanguage = 'ar',
  options: PDFCustomizationOptions = {}
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  const fontFamily = options.fontFamily;
  const fontSizeScale = options.fontSizeScale;

  const originalFontFamily = element.style.fontFamily;
  const originalFontSize = element.style.fontSize;
  if (fontFamily) element.style.fontFamily = fontFamily;
  if (fontSizeScale) element.style.fontSize = `${fontSizeScale * 100}%`;

  try {
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
      filter: (node: HTMLElement) => {
        if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
          return false;
        }
        return true;
      }
    });

    if (fontFamily) element.style.fontFamily = originalFontFamily;
    if (fontSizeScale) element.style.fontSize = originalFontSize;

    const cleanName = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Match';

    const prefix = lang === 'ar' ? 'تقرير_تحليل_مباراة' : 'Rapport_Analyse_Match';
    const fileName = `${prefix}_${cleanName(match.homeTeam.name)}_ضد_${cleanName(match.awayTeam.name)}.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (e) {
    console.error('PNG export failed', e);
    if (fontFamily) element.style.fontFamily = originalFontFamily;
    if (fontSizeScale) element.style.fontSize = originalFontSize;
    return false;
  }
};
