import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MatchState, AppLanguage } from '../types.ts';

export interface PDFCustomizationOptions {
  marginMm?: number; // default 10mm (1 cm)
  fontFamily?: string; // e.g. 'Cairo, sans-serif'
  fontSizeScale?: number; // e.g. 1.0
  fitOnePage?: boolean; // true = consolidated 1 A4 page, false = multi-page block pagination
}

/**
 * Renders an A4 footer strip via HTML canvas so Arabic/French text & page numbers
 * always render with proper font shaping (never garbled in jsPDF Helvetica).
 */
const renderFooterStripPng = (
  leftText: string,
  rightText: string,
  isRtl: boolean
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    const width = 1500;
    const height = 44;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle hairline top separator
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 2, width, 2);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px Cairo, Inter, sans-serif';
    ctx.textBaseline = 'middle';

    if (isRtl) {
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillText(leftText, width - 4, height / 2 + 4);
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillText(rightText, 4, height / 2 + 4);
    } else {
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillText(leftText, 4, height / 2 + 4);
      ctx.textAlign = 'right';
      ctx.fillText(rightText, width - 4, height / 2 + 4);
    }

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};

const stampFooterOnAllPages = (
  pdf: jsPDF,
  marginMm: number,
  lang: AppLanguage
) => {
  const pageWidth = 210;
  const pageHeight = 297;
  const totalPages = pdf.getNumberOfPages();
  const isRtl = lang === 'ar';

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const pageLabel = isRtl ? `صفحة ${i} من ${totalPages}` : `Page ${i} / ${totalPages}`;
    const brandLabel = isRtl
      ? 'HandballScore PRO • التقرير الفني الرسمي للمباراة'
      : 'HandballScore PRO • Official Technical Match Report';

    const footerDataUrl = renderFooterStripPng(brandLabel, pageLabel, isRtl);
    const printableW = pageWidth - marginMm * 2;
    const footerH = 6.2;
    const footerY = pageHeight - Math.max(4, marginMm * 0.6) - footerH;

    if (footerDataUrl) {
      pdf.addImage(footerDataUrl, 'PNG', marginMm, footerY, printableW, footerH);
    } else {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i} / ${totalPages}`, pageWidth - marginMm, pageHeight - 5, { align: 'right' });
      pdf.text('HandballScore PRO', marginMm, pageHeight - 5);
    }
  }
};

const captureElementPng = async (
  el: HTMLElement,
  pixelRatio: number = 2.2
): Promise<string | null> => {
  try {
    const dataUrl = await toPng(el, {
      quality: 1,
      pixelRatio,
      backgroundColor: '#ffffff',
      cacheBust: false,
      skipFonts: true,
      fontEmbedCSS: '',
      filter: (node: HTMLElement) => {
        if (node.tagName === 'LINK' || node.tagName === 'SCRIPT') return false;
        if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
        return true;
      },
      style: {
        transform: 'none',
        boxShadow: 'none'
      }
    });
    if (dataUrl && dataUrl.startsWith('data:image/png')) {
      return dataUrl;
    }
  } catch (err) {
    console.warn('toPng capture failed, trying html2canvas fallback:', err);
  }

  try {
    const html2canvasFn = (window as any).html2canvas;
    if (html2canvasFn) {
      const canvas = await html2canvasFn(el, {
        scale: pixelRatio,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      return canvas.toDataURL('image/png', 0.98);
    }
  } catch (fallbackErr) {
    console.warn('html2canvas fallback failed:', fallbackErr);
  }
  return null;
};

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

const buildOffscreenClone = (
  sourceEl: HTMLElement,
  widthPx: number,
  options: PDFCustomizationOptions,
  paddingPx: number = 0
): HTMLElement => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.width = `${widthPx}px`;
  host.style.backgroundColor = '#ffffff';
  host.style.color = '#0f172a';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';
  if (paddingPx > 0) {
    host.style.padding = `${paddingPx}px`;
    host.style.boxSizing = 'border-box';
  }

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = '100%';
  clone.style.margin = '0';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  if (options.fontFamily) clone.style.fontFamily = options.fontFamily;
  if (options.fontSizeScale) clone.style.fontSize = `${options.fontSizeScale * 100}%`;

  // Strip UI-only ignore elements from the clone
  clone.querySelectorAll('[data-html2canvas-ignore="true"]').forEach((n) => n.remove());

  host.appendChild(clone);
  document.body.appendChild(host);
  return host;
};

/**
 * Captures the formatted match analysis report element and exports it as a crisp,
 * high-resolution single-page or break-safe multi-page A4 PDF report.
 * Always clones offscreen at exact A4 width (794px) so mobile UI zoom never clips or blurs output.
 */
export const generateAnalysisPDF = async (
  elementId: string,
  match: MatchState,
  lang: AppLanguage = 'ar',
  options: PDFCustomizationOptions = {}
): Promise<boolean> => {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  const marginMm = options.marginMm ?? 10;
  const fitOnePage = options.fitOnePage ?? true;

  try {
    await document.fonts.ready;
  } catch {
    // ignore font check failure
  }

  const cleanName = (name: string) =>
    name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Match';
  const prefix = lang === 'ar' ? 'تقرير_تحليل_مباراة' : 'Rapport_Analyse_Match';
  const fileName = `${prefix}_${cleanName(match.homeTeam.name)}_vs_${cleanName(match.awayTeam.name)}.pdf`;

  const host = buildOffscreenClone(sourceEl, 794, options, 0);

  try {
    const cloneRoot = host.firstElementChild as HTMLElement;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const printableWidth = pageWidth - marginMm * 2;
    const footerReserveMm = 9;
    const printableHeight = pageHeight - marginMm * 2 - footerReserveMm;

    if (fitOnePage) {
      const dataUrl = await captureElementPng(cloneRoot, 2.4);
      if (!dataUrl) return false;

      const img = await loadImageFromDataUrl(dataUrl);
      const scaleW = printableWidth / img.width;
      const scaleH = printableHeight / img.height;
      const scale = Math.min(scaleW, scaleH);

      const renderWidth = img.width * scale;
      const renderHeight = img.height * scale;
      const offsetX = marginMm + (printableWidth - renderWidth) / 2;
      const offsetY = marginMm;

      pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
      stampFooterOnAllPages(pdf, marginMm, lang);
      pdf.save(fileName);
      return true;
    }

    // MULTI-PAGE BLOCK-BY-BLOCK FLOW (preserves Arabic shaping & avoids slicing cards mid-sentence)
    const blocks = Array.from(cloneRoot.querySelectorAll('[data-pdf-block="true"]')) as HTMLElement[];
    const targets = blocks.length > 0 ? blocks : [cloneRoot];

    let cursorY = marginMm;
    const bottomLimit = marginMm + printableHeight;
    const blockGapMm = 3.5;

    for (const block of targets) {
      const blockDataUrl = await captureElementPng(block, 2.2);
      if (!blockDataUrl) continue;

      const img = await loadImageFromDataUrl(blockDataUrl);
      const blockHeightMm = (img.height / img.width) * printableWidth;

      if (blockHeightMm <= printableHeight) {
        if (cursorY + blockHeightMm > bottomLimit && cursorY > marginMm + 0.5) {
          pdf.addPage();
          cursorY = marginMm;
        }
        pdf.addImage(blockDataUrl, 'PNG', marginMm, cursorY, printableWidth, blockHeightMm, undefined, 'FAST');
        cursorY += blockHeightMm + blockGapMm;
      } else {
        // Oversized single block fallback: slice cleanly across page boundaries
        if (cursorY > marginMm + 0.5) {
          pdf.addPage();
          cursorY = marginMm;
        }
        const sliceRatioPxPerMm = img.width / printableWidth;
        const maxSlicePx = Math.floor(printableHeight * sliceRatioPxPerMm);
        let yOffsetPx = 0;

        while (yOffsetPx < img.height) {
          const sliceHeightPx = Math.min(maxSlicePx, img.height - yOffsetPx);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = img.width;
          sliceCanvas.height = sliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(img, 0, yOffsetPx, img.width, sliceHeightPx, 0, 0, img.width, sliceHeightPx);
            const sliceHeightMm = sliceHeightPx / sliceRatioPxPerMm;
            pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', marginMm, cursorY, printableWidth, sliceHeightMm, undefined, 'FAST');
            cursorY += sliceHeightMm + blockGapMm;
          }
          yOffsetPx += sliceHeightPx;
          if (yOffsetPx < img.height) {
            pdf.addPage();
            cursorY = marginMm;
          }
        }
      }
    }

    stampFooterOnAllPages(pdf, marginMm, lang);
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate analysis PDF', err);
    return false;
  } finally {
    document.body.removeChild(host);
  }
};

/**
 * Captures the formatted match analysis report element offscreen at crisp 794px A4 width
 * and downloads it as a high-DPI PNG image.
 */
export const downloadReportAsPNG = async (
  elementId: string,
  match: MatchState,
  lang: AppLanguage = 'ar',
  options: PDFCustomizationOptions = {}
): Promise<boolean> => {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    await document.fonts.ready;
  } catch {
    // ignore
  }

  const marginMm = options.marginMm ?? 10;
  const paddingPx = Math.round(marginMm * 3.2);
  const host = buildOffscreenClone(sourceEl, 794, options, paddingPx);

  try {
    const dataUrl = await captureElementPng(host, 2.5);
    if (!dataUrl) return false;

    const cleanName = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim() || 'Match';
    const prefix = lang === 'ar' ? 'تقرير_تحليل_مباراة' : 'Rapport_Analyse_Match';
    const fileName = `${prefix}_${cleanName(match.homeTeam.name)}_vs_${cleanName(match.awayTeam.name)}.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('PNG export failed', e);
    return false;
  } finally {
    document.body.removeChild(host);
  }
};
