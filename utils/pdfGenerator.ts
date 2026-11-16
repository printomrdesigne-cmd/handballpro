import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AppLanguage } from '../types.ts';

/**
 * Creates a clean, unscaled offscreen clone at exact A4 96-DPI pixel geometry (794x1123)
 * so mobile viewport CSS transform/overflow-hidden never clips any border or Arabic glyph.
 */
const mountOffscreenA4Clone = (source: HTMLElement): { host: HTMLDivElement; clone: HTMLElement } => {
  const host = document.createElement('div');
  host.setAttribute('data-html2canvas-ignore', 'true');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.height = '1123px';
  host.style.overflow = 'visible';
  host.style.backgroundColor = '#ffffff';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.width = '794px';
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.height = '1123px';
  clone.style.minHeight = '1123px';
  clone.style.maxHeight = '1123px';
  clone.style.margin = '0';
  clone.style.padding = '5mm';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.letterSpacing = 'normal';

  host.appendChild(clone);
  document.body.appendChild(host);
  return { host, clone };
};

/**
 * Capture an HTML element as a crisp lossless PNG and embed it onto an official A4 PDF.
 * Guarantees exact 100% paper width & height coverage (210mm x 297mm) with zero cutoffs
 * and sharp 1px table borders + intact Arabic cursive typography.
 */
export const generateMatchSheetPDF = async (
  elementId: string,
  homeTeamName: string,
  awayTeamName: string,
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

  let prefix = 'Feuille_Match';
  let connector = 'vs';
  if (lang === 'ar') {
    prefix = 'ورقة_مباراة';
    connector = 'ضد';
  } else if (lang === 'en') {
    prefix = 'Scoresheet';
    connector = 'vs';
  }

  const fileName = `${prefix}_${cleanName(homeTeamName)}_${connector}_${cleanName(awayTeamName)}.pdf`;

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  let imgDataUrl: string | null = null;
  let imgFormat: 'PNG' | 'JPEG' = 'PNG';
  let offscreenHost: HTMLDivElement | null = null;

  try {
    const { host, clone } = mountOffscreenA4Clone(element);
    offscreenHost = host;

    const filter = (node: HTMLElement) => {
      if (node.tagName === 'LINK' || node.tagName === 'SCRIPT') return false;
      if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
        return false;
      }
      return true;
    };

    try {
      imgDataUrl = await toPng(clone, {
        quality: 1,
        pixelRatio: 2.5,
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: false,
        filter,
      });
      imgFormat = 'PNG';
    } catch (err) {
      console.warn('Primary html-to-image PNG rendering failed, falling back to html2canvas:', err);
    }

    if (!imgDataUrl) {
      // @ts-ignore
      const html2canvasFn = window.html2canvas;
      if (!html2canvasFn) {
        throw new Error('Neither html-to-image nor html2canvas is available');
      }

      const canvas = await html2canvasFn(clone, {
        scale: 2.5,
        useCORS: true,
        letterRendering: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      imgDataUrl = canvas.toDataURL('image/png', 1.0);
      imgFormat = 'PNG';
    }
  } finally {
    if (offscreenHost && offscreenHost.parentNode) {
      offscreenHost.parentNode.removeChild(offscreenHost);
    }
  }

  if (!imgDataUrl) {
    throw new Error('Failed to generate image data for match sheet');
  }

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  });

  pdf.addImage(imgDataUrl, imgFormat, 0, 0, 210, 297, undefined, 'FAST');
  pdf.save(fileName);

  return true;
};