export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Convierte un código HEX a objeto RGB {r, g, b}
 */
export function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula la luminancia relativa conforme a las directrices WCAG 2.1
 */
export function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calcula el ratio de contraste entre dos colores HEX
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Convierte valores numéricos RGB a código HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}

/**
 * Convierte un código HEX a modelo HSL {h, s, l}
 */
export function hexToHsl(hex: string): HslColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

/**
 * Convierte valores HSL a código HEX
 */
export function hslToHex(h: number, s: number, l: number): string {
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Sugiere un color accesible ajustando luminosidad de forma iterativa hasta cumplir el ratio objetivo
 */
export function suggestAccessibleColor(
  fgHex: string,
  bgHex: string,
  targetRatio: number = 4.5
): string | null {
  let currentRatio = contrastRatio(fgHex, bgHex);
  if (currentRatio >= targetRatio) return null;

  const bgRgb = hexToRgb(bgHex);
  if (!bgRgb) return null;
  const bgLum = luminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const isBgLight = bgLum > 0.5;

  const fgHsl = hexToHsl(fgHex);
  if (!fgHsl) return null;

  const h = fgHsl.h;
  const s = fgHsl.s;
  let l = fgHsl.l;
  const step = 0.05; // 5% lightness step
  let attempts = 0;
  let bestHex = fgHex;

  while (currentRatio < targetRatio && attempts < 20) {
    if (isBgLight) {
      l = Math.max(0, l - step); // Darken
    } else {
      l = Math.min(1, l + step); // Lighten
    }

    bestHex = hslToHex(h, s, l);
    currentRatio = contrastRatio(bestHex, bgHex);
    attempts++;

    if (l <= 0 || l >= 1) break; // Reached black or white
  }

  return currentRatio >= targetRatio ? bestHex : isBgLight ? '#000000' : '#FFFFFF';
}

