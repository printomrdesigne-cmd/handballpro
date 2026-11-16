/**
 * Color & Contrast Utilities for Light Mode, Dark Mode, and A4 Print/Export.
 */

const parseHexColor = (hex?: string): { r: number; g: number; b: number } | null => {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

/** Relative perceptual luminance (0 = black, 1 = white) */
export const getColorLuminance = (hex?: string): number => {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0.3;
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
};

/** Returns crisp white (#ffffff) or deep slate (#0f172a) text depending on background brightness */
export const getContrastTextColor = (bgHex?: string): '#ffffff' | '#0f172a' => {
  const lum = getColorLuminance(bgHex);
  return lum > 0.42 ? '#0f172a' : '#ffffff';
};

/** Adjusts team text color so team names always stay legible in Light Mode or Dark Mode */
export const getSafeTeamTextColor = (teamHex: string | undefined, isDarkMode: boolean): string => {
  const rgb = parseHexColor(teamHex);
  if (!rgb) return isDarkMode ? '#e2e8f0' : '#0f172a';
  const lum = getColorLuminance(teamHex);

  if (isDarkMode && lum < 0.22) {
    // Mix 55% toward white so dark colors stay vibrant and readable on dark cards
    const r = Math.round(rgb.r + (255 - rgb.r) * 0.55);
    const g = Math.round(rgb.g + (255 - rgb.g) * 0.55);
    const b = Math.round(rgb.b + (255 - rgb.b) * 0.55);
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (!isDarkMode && lum > 0.68) {
    // Darken very bright colors (yellow/lime/white) on light cards
    const r = Math.round(rgb.r * 0.6);
    const g = Math.round(rgb.g * 0.6);
    const b = Math.round(rgb.b * 0.6);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return teamHex || (isDarkMode ? '#e2e8f0' : '#0f172a');
};
