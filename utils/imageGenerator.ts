import { toPng, toJpeg } from 'html-to-image';
import { AppLanguage } from '../types.ts';

/**
 * Capture an HTML element (e.g. #match-sheet-content) as a crisp, high-resolution PNG image.
 * Uses html-to-image with html2canvas fallback for 100% full-width capture.
 */
export const captureElementAsImage = async (
  elementId: string
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number } | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return null;
  }

  // Ensure all fonts (Cairo, Inter) are loaded
  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font readiness check skipped', e);
  }

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  let dataUrl: string | null = null;

  // 1. Try html-to-image (SVG foreignObject)
  try {
    const filter = (node: HTMLElement) => {
      if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
        return false;
      }
      return true;
    };

    dataUrl = await toPng(element, {
      pixelRatio: 2,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      skipFonts: true,
      filter,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        width: `${A4_WIDTH_PX}px`,
        minWidth: `${A4_WIDTH_PX}px`,
        maxWidth: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        maxHeight: `${A4_HEIGHT_PX}px`,
        margin: '0',
        padding: '5mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('html-to-image PNG capture failed, trying html2canvas fallback:', err);
  }

  // 2. Fallback to html2canvas on visible viewport
  if (!dataUrl) {
    // @ts-ignore
    const html2canvasFn = window.html2canvas;
    if (html2canvasFn) {
      const target = element.closest('.sheet-viewport-wrapper') || element;
      const canvas = await html2canvasFn(target, {
        scale: 2.5,
        useCORS: true,
        letterRendering: false,
        backgroundColor: '#ffffff',
        logging: false,
      });
      dataUrl = canvas.toDataURL('image/png', 0.98);
    }
  }

  if (!dataUrl) {
    console.error('All image capture methods failed');
    return null;
  }

  // Convert dataUrl to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  return { blob, dataUrl, width: A4_WIDTH_PX * 2, height: A4_HEIGHT_PX * 2 };
};

/**
 * Trigger native WhatsApp image sharing or direct Web Share API
 */
export const shareMatchSheetImage = async ({
  imageBlob,
  homeTeam,
  awayTeam,
  scoreHome,
  scoreAway,
  winnerName,
  date,
  lang = 'ar',
}: {
  imageBlob: Blob;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number;
  scoreAway: number;
  winnerName: string;
  date?: string;
  lang?: AppLanguage;
}): Promise<boolean> => {
  const cleanHome = homeTeam.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim();
  const cleanAway = awayTeam.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-]/gi, '_').trim();
  const fileName = `ورقة_مباراة_${cleanHome}_ضد_${cleanAway}.png`;

  const file = new File([imageBlob], fileName, { type: 'image/png' });

  const summaryText =
    lang === 'ar'
      ? `🤾‍♂️ *ورقة التحكيم الرسمية لمباراة كرة اليد*\n🏆 *${homeTeam}* (${scoreHome}) 🆚 (${scoreAway}) *${awayTeam}*\n🥇 الفائز: *${winnerName}*\n📅 التاريخ: ${date || 'اليوم'}\n\n📄 مرفق صورة ورقة المباراة الرسمية FRMSS المصادق عليها.`
      : `🤾‍♂️ *Feuille de Match Officielle - Handball*\n🏆 *${homeTeam}* (${scoreHome}) 🆚 (${scoreAway}) *${awayTeam}*\n🥇 Vainqueur: *${winnerName}*\n📅 Date: ${date || 'Aujourd\'hui'}\n\n📄 Image officielle de la feuille de match FRMSS ci-jointe.`;

  // Test if Web Share API with files is supported
  // @ts-ignore
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `ورقة مباراة: ${homeTeam} ضد ${awayTeam}`,
        text: summaryText,
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return true; // user closed sheet voluntarily
      }
      console.warn('Native Web Share failed, falling back', err);
    }
  }

  return false;
};

/**
 * Trigger browser download of the image
 */
export const downloadImageFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Copy image blob to clipboard for direct Ctrl+V / Paste in WhatsApp
 */
export const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    return false;
  }
  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed', err);
    return false;
  }
};
