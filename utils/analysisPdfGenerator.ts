import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MatchState, AppLanguage } from '../types.ts';

/**
 * Captures the formatted match analysis report element and exports it as a crisp,
 * high-resolution multi-page or single-page A4 PDF report with full colors and Arabic typography.
 */
export const generateAnalysisPDF = async (
  elementId: string,
  match: MatchState,
  lang: AppLanguage = 'ar'
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

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

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Create an image object to calculate proportional height
    const img = new Image();
    img.src = dataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const imgHeightMm = (img.height * pdfWidth) / img.width;

    if (imgHeightMm <= pdfHeight) {
      // Single page fits cleanly
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeightMm);
    } else {
      // Multi-page handling
      let heightLeft = imgHeightMm;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightMm);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeightMm;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightMm);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate analysis PDF', err);
    return false;
  }
};
