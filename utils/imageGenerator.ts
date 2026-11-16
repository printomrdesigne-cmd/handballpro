import { toPng } from 'html-to-image';
import { AppLanguage } from '../types.ts';

/**
 * Capture an HTML element (e.g. #match-sheet-content) as a crisp, high-resolution PNG image.
 * Clones offscreen at exact A4 794x1123px so mobile zoom transforms never clip edges.
 */
export const captureElementAsImage = async (
  elementId: string
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number } | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return null;
  }

  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font readiness check skipped', e);
  }

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;
  const PIXEL_RATIO = 2.5;

  const host = document.createElement('div');
  host.setAttribute('data-html2canvas-ignore', 'true');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.height = `${A4_HEIGHT_PX}px`;
  host.style.overflow = 'visible';
  host.style.backgroundColor = '#ffffff';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minWidth = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.height = `${A4_HEIGHT_PX}px`;
  clone.style.minHeight = `${A4_HEIGHT_PX}px`;
  clone.style.maxHeight = `${A4_HEIGHT_PX}px`;
  clone.style.margin = '0';
  clone.style.padding = '5mm';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.letterSpacing = 'normal';

  host.appendChild(clone);
  document.body.appendChild(host);

  let dataUrl: string | null = null;

  try {
    const filter = (node: HTMLElement) => {
      if (node.tagName === 'LINK' || node.tagName === 'SCRIPT') return false;
      if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
        return false;
      }
      return true;
    };

    try {
      dataUrl = await toPng(clone, {
        pixelRatio: PIXEL_RATIO,
        quality: 1,
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: false,
        filter,
      });
    } catch (err) {
      console.warn('html-to-image PNG capture failed, trying html2canvas fallback:', err);
    }

    if (!dataUrl) {
      // @ts-ignore
      const html2canvasFn = window.html2canvas;
      if (html2canvasFn) {
        const canvas = await html2canvasFn(clone, {
          scale: PIXEL_RATIO,
          useCORS: true,
          letterRendering: false,
          backgroundColor: '#ffffff',
          logging: false,
        });
        dataUrl = canvas.toDataURL('image/png', 1.0);
      }
    }
  } finally {
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  if (!dataUrl) {
    console.error('All image capture methods failed');
    return null;
  }

  const res = await fetch(dataUrl);
  const blob = await res.blob();

  return {
    blob,
    dataUrl,
    width: Math.round(A4_WIDTH_PX * PIXEL_RATIO),
    height: Math.round(A4_HEIGHT_PX * PIXEL_RATIO),
  };
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
      : `🤾‍♂️ *Feuille de Match Officielle - Handball*\n🏆 *${homeTeam}* (${scoreHome}) 🆚 (${scoreAway}) *${awayTeam}*\n🥇 Vainqueur: *${winnerName}*\n📅 Date: ${date || "Aujourd'hui"}\n\n📄 Image officielle de la feuille de match FRMSS ci-jointe.`;

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
        return true;
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
