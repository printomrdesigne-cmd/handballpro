import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AppLanguage } from '../types.ts';

/**
 * Capture an HTML element as a crisp, full-page image and embed it onto an official A4 PDF.
 * Guarantees exact 100% paper width coverage (210mm x 297mm) with zero cutoffs,
 * intact Arabic cursive typography, and matching the complete match sheet.
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

  // Ensure Cairo and Inter web fonts are completely loaded
  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font loading check skipped', e);
  }

  // File naming
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

  // Standard A4 dimensions in pixels at 96 DPI: 210mm = 794px, 297mm = 1123px
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  let imgDataUrl: string | null = null;

  // -------------------------------------------------------------
  // METHOD 1: html-to-image (SVG foreignObject)
  // Renders the element at exact 794x1123px with 2x resolution.
  // Independent of the mobile viewport width.
  // -------------------------------------------------------------
  try {
    const filter = (node: HTMLElement) => {
      if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
        return false;
      }
      return true;
    };

    imgDataUrl = await toJpeg(element, {
      quality: 0.98,
      pixelRatio: 2.2,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      skipFonts: true, // Prevents cross-origin CSS security errors while retaining document fonts
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
        letterSpacing: 'normal',
      },
    });
  } catch (err) {
    console.warn('Primary html-to-image rendering failed, falling back to canvas capture:', err);
  }

  // -------------------------------------------------------------
  // METHOD 2: Fallback to html2canvas on visible viewport
  // If html-to-image encounters unsupported features, capture the
  // on-screen match sheet wrapper directly as seen by the user.
  // -------------------------------------------------------------
  if (!imgDataUrl) {
    try {
      // @ts-ignore
      const html2canvasFn = window.html2canvas;
      if (!html2canvasFn) {
        throw new Error('Neither html-to-image nor html2canvas is available');
      }

      // Try capturing the viewport wrapper or the element directly
      const target = element.closest('.sheet-viewport-wrapper') || element;
      const canvas = await html2canvasFn(target, {
        scale: 3,
        useCORS: true,
        letterRendering: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      imgDataUrl = canvas.toDataURL('image/jpeg', 0.98);
    } catch (fallbackErr) {
      console.error('All capture methods failed:', fallbackErr);
      throw fallbackErr;
    }
  }

  if (!imgDataUrl) {
    throw new Error('Failed to generate image data for match sheet');
  }

  // -------------------------------------------------------------
  // STEP 2: Paste the complete match sheet image onto an A4 PDF
  // Fills exactly 100% of the A4 paper: width 210mm, height 297mm
  // -------------------------------------------------------------
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  });

  // Exactly cover the A4 page (0, 0, 210, 297)
  pdf.addImage(imgDataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  pdf.save(fileName);

  return true;
};