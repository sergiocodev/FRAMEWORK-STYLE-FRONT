// APCA (Advanced Perceptual Contrast Algorithm) - WCAG 3 Candidate Standard
import { calcAPCA, fontLookupAPCA } from 'apca-w3';
import { TypographyItem } from '../services/diseno-visual.service';
import { extractNumericWeight } from './typography-algorithms';

export type ApcaLevel = 'Lc90' | 'Lc75' | 'Lc60' | 'Lc45' | 'Lc30' | 'Fail';
export type ApcaPolarity = 'dark-on-light' | 'light-on-dark';

export interface ApcaFontRequirement {
  weight: number;
  minSizePx: number | null;
  status: 'allowed' | 'non-text-only' | 'prohibited';
}

export interface TypographyTokenAudit {
  token: TypographyItem;
  numericWeight: number;
  minRequiredPx: number | null;
  cumple: boolean;
  diferenciaPx: number;
  badgeClass: string;
  estadoLabel: string;
  solucionTipografica: string | null;
}

export interface ProjectTypographyAuditSummary {
  audits: TypographyTokenAudit[];
  total: number;
  cumplen: number;
  fallan: number;
  porcentajeCumplimiento: number;
  resumenAprobados: string[];
  resumenFallidos: string[];
}

export interface ApcaEvaluation {
  lc: number;
  absLc: number;
  level: ApcaLevel;
  levelLabel: string;
  badgeClass: string;
  polarity: ApcaPolarity;
  polarityLabel: string;
  description: string;
  isContentReadable: boolean;
  isBodyTextReadable: boolean;
  isFluentTextReadable: boolean;
  minFontSizeNormal: number | null;
  minFontSizeBold: number | null;
  fontRequirements: ApcaFontRequirement[];
}

/**
 * Valida si una cadena es un código hexadecimal de color válido (#RGB, #RRGGBB o #RRGGBBAA).
 */
export function isValidHex(hex: string | null | undefined): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex.trim());
}

/**
 * Normaliza un código hexadecimal garantizando formato de 6 caracteres con prefijo '#'.
 */
export function normalizeHex(hex: string): string {
  if (!isValidHex(hex)) return '#000000';
  let clean = hex.trim();
  if (clean.length === 4) {
    clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
  }
  return clean.toUpperCase();
}

/**
 * Calcula el contraste perceptual APCA (Advanced Perceptual Contrast Algorithm).
 * Retorna un número flotante con signo (Lc).
 * - Lc positivo: texto oscuro sobre fondo claro (BoW: Black on White).
 * - Lc negativo: texto claro sobre fondo oscuro (WoB: White on Black).
 */
export function calculateAPCA(textColor: string, bgColor: string, places: number = 1): number {
  if (!isValidHex(textColor) || !isValidHex(bgColor)) {
    return 0;
  }

  try {
    const rawLc = calcAPCA(textColor, bgColor, places);
    const num = Number(rawLc);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

/**
 * Determina el nivel de cumplimiento APCA según el valor absoluto de contraste (|Lc|).
 */
export function getApcaLevel(absLc: number): ApcaLevel {
  if (absLc >= 90) return 'Lc90';
  if (absLc >= 75) return 'Lc75';
  if (absLc >= 60) return 'Lc60';
  if (absLc >= 45) return 'Lc45';
  if (absLc >= 30) return 'Lc30';
  return 'Fail';
}

/**
 * Obtiene las clases CSS de Bootstrap / estilos para la etiqueta de nivel APCA.
 */
export function getApcaBadgeClass(level: ApcaLevel): string {
  switch (level) {
    case 'Lc90':
      return 'bg-success text-white border border-success';
    case 'Lc75':
      return 'bg-success bg-opacity-75 text-white border border-success';
    case 'Lc60':
      return 'bg-info bg-opacity-75 text-dark border border-info';
    case 'Lc45':
      return 'bg-warning text-dark border border-warning';
    case 'Lc30':
      return 'bg-secondary text-white border border-secondary';
    case 'Fail':
    default:
      return 'bg-danger text-white border border-danger';
  }
}

/**
 * Devuelve la etiqueta descriptiva legible del nivel APCA.
 */
export function getApcaLevelLabel(level: ApcaLevel): string {
  switch (level) {
    case 'Lc90':
      return 'Lc 90+ (Excelente)';
    case 'Lc75':
      return 'Lc 75+ (Aprobado Cuerpo)';
    case 'Lc60':
      return 'Lc 60+ (Texto Destacado)';
    case 'Lc45':
      return 'Lc 45+ (Encabezados / UI)';
    case 'Lc30':
      return 'Lc 30+ (Decorativo)';
    case 'Fail':
    default:
      return 'Insuficiente (Fail)';
  }
}

/**
 * Obtiene la descripción detallada del uso recomendado para un nivel APCA.
 */
export function getApcaDescription(level: ApcaLevel): string {
  switch (level) {
    case 'Lc90':
      return 'Excelente legibilidad para lectura fluida, textos largos y fuentes ligeras o estándar (14-16px).';
    case 'Lc75':
      return 'Contraste óptimo para cuerpo de texto normal (16px, peso regular 400) y contenido principal.';
    case 'Lc60':
      return 'Válido para títulos medianos o texto grande (24px regular o 16px en negrita).';
    case 'Lc45':
      return 'Adecuado para encabezados prominentes (32px+), iconos informativos y controles UI clave.';
    case 'Lc30':
      return 'Válido únicamente para bordes decorativos, líneas de separación o textos deshabilitados.';
    case 'Fail':
    default:
      return 'Contraste por debajo del umbral mínimo perceptual. No recomendado para contenido funcional.';
  }
}

/**
 * Obtiene los requisitos de tamaño de fuente por cada peso tipográfico (100 a 900)
 * utilizando el lookup oficial de APCA.
 */
export function getApcaFontRequirements(absLc: number): ApcaFontRequirement[] {
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  try {
    const rawLookup = fontLookupAPCA(absLc);
    if (!Array.isArray(rawLookup) || rawLookup.length < 10) {
      return fallbackFontRequirements(absLc);
    }

    return weights.map((weight, idx) => {
      const val = Number(rawLookup[idx + 1]);
      if (isNaN(val) || val === 999) {
        return { weight, minSizePx: null, status: 'prohibited' };
      }
      if (val === 777) {
        return { weight, minSizePx: null, status: 'non-text-only' };
      }
      return { weight, minSizePx: Math.round(val), status: 'allowed' };
    });
  } catch {
    return fallbackFontRequirements(absLc);
  }
}

/**
 * Genera requisitos tipográficos de contingencia en caso de fallo del lookup nativo.
 */
function fallbackFontRequirements(absLc: number): ApcaFontRequirement[] {
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  if (absLc < 30) {
    return weights.map((weight) => ({ weight, minSizePx: null, status: 'prohibited' }));
  }
  if (absLc < 45) {
    return weights.map((weight) => ({ weight, minSizePx: null, status: 'non-text-only' }));
  }

  return weights.map((weight) => {
    let size = 16;
    if (absLc < 60) size = weight >= 700 ? 24 : 32;
    else if (absLc < 75) size = weight >= 700 ? 16 : 24;
    else if (absLc < 90) size = weight >= 700 ? 14 : 16;
    else size = weight >= 700 ? 12 : 14;
    return { weight, minSizePx: size, status: 'allowed' };
  });
}

/**
 * Evaluación completa y detallada de un par de colores según el estándar APCA.
 */
export function evaluateAPCA(textColor: string, bgColor: string): ApcaEvaluation {
  const lc = calculateAPCA(textColor, bgColor, 1);
  const absLc = Math.abs(lc);
  const level = getApcaLevel(absLc);
  const polarity: ApcaPolarity = lc >= 0 ? 'dark-on-light' : 'light-on-dark';
  const polarityLabel = lc >= 0 ? 'Texto Oscuro sobre Fondo Claro' : 'Texto Claro sobre Fondo Oscuro';
  const fontReqs = getApcaFontRequirements(absLc);

  const reqNormal = fontReqs.find((r) => r.weight === 400);
  const reqBold = fontReqs.find((r) => r.weight === 700);

  return {
    lc,
    absLc,
    level,
    levelLabel: getApcaLevelLabel(level),
    badgeClass: getApcaBadgeClass(level),
    polarity,
    polarityLabel,
    description: getApcaDescription(level),
    isContentReadable: absLc >= 60,
    isBodyTextReadable: absLc >= 75,
    isFluentTextReadable: absLc >= 90,
    minFontSizeNormal: reqNormal?.minSizePx ?? null,
    minFontSizeBold: reqBold?.minSizePx ?? null,
    fontRequirements: fontReqs
  };
}

/**
 * Audita los tokens tipográficos reales del proyecto frente al contraste perceptual APCA.
 * Compara tamaño real vs mínimo exigido y genera la solución tipográfica alternativa.
 */
export function auditProjectTypographyTokens(
  tokens: TypographyItem[],
  absLc: number
): ProjectTypographyAuditSummary {
  if (!tokens || tokens.length === 0) {
    return {
      audits: [],
      total: 0,
      cumplen: 0,
      fallan: 0,
      porcentajeCumplimiento: 0,
      resumenAprobados: [],
      resumenFallidos: []
    };
  }

  const fontReqs = getApcaFontRequirements(absLc);

  const audits: TypographyTokenAudit[] = tokens.map((token) => {
    const numericWeight = extractNumericWeight(token.peso);
    const clampedWeight = Math.min(900, Math.max(100, Math.round(numericWeight / 100) * 100));
    const req = fontReqs.find((r) => r.weight === clampedWeight) || fontReqs.find((r) => r.weight === 400);

    const minRequiredPx = req?.minSizePx ?? null;
    const isProhibited = req?.status === 'prohibited' || req?.status === 'non-text-only' || minRequiredPx === null;

    let cumple = false;
    let diferenciaPx = 0;

    if (!isProhibited && minRequiredPx !== null) {
      cumple = token.tamano_px >= minRequiredPx;
      diferenciaPx = minRequiredPx - token.tamano_px;
    }

    let badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    let estadoLabel = 'No cumple';
    let solucionTipografica: string | null = null;

    if (cumple) {
      badgeClass = 'bg-success-subtle text-success border border-success-subtle';
      estadoLabel = 'Cumple';
      solucionTipografica = null;
    } else {
      if (isProhibited) {
        estadoLabel = 'Contraste insuficiente';
        solucionTipografica = 'El contraste actual es demasiado bajo para este peso; requiere oscurecer/aclarar el color.';
      } else if (minRequiredPx !== null) {
        // Buscar si un peso más grueso con el mismo tamaño pasaría
        const heavierPassWeight = fontReqs.find(
          (r) => r.weight > clampedWeight && r.minSizePx !== null && r.minSizePx <= token.tamano_px
        );

        if (heavierPassWeight) {
          solucionTipografica = `Engrosar a w${heavierPassWeight.weight} (requiere min ${heavierPassWeight.minSizePx}px) o aumentar tamaño a ${minRequiredPx}px.`;
        } else {
          solucionTipografica = `Aumentar tamaño de ${token.tamano_px}px a ${minRequiredPx}px manteniendo peso w${clampedWeight}.`;
        }
      }
    }

    return {
      token,
      numericWeight,
      minRequiredPx,
      cumple,
      diferenciaPx,
      badgeClass,
      estadoLabel,
      solucionTipografica
    };
  });

  const cumplen = audits.filter((a) => a.cumple).length;
  const fallan = audits.length - cumplen;
  const porcentajeCumplimiento = Math.round((cumplen / audits.length) * 100);
  const resumenAprobados = audits.filter((a) => a.cumple).map((a) => a.token.estilo);
  const resumenFallidos = audits.filter((a) => !a.cumple).map((a) => a.token.estilo);

  return {
    audits,
    total: audits.length,
    cumplen,
    fallan,
    porcentajeCumplimiento,
    resumenAprobados,
    resumenFallidos
  };
}
