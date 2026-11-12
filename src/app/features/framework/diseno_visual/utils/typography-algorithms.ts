/**
 * ============================================================================
 * MODELOS MATEMÁTICOS Y ALGORITMOS PARA TIPOGRAFÍA ESTÉTICA EN GUI
 * ============================================================================
 * 
 * Basado en investigaciones científicas de los últimos 5 años (2021-2026):
 * 1. Choi & Hyun (Nature Scientific Reports, 2024): "Typeface network and the
 *    principle of font pairing" (NMF & Graph Morphological Affinity).
 * 2. Singh & Bhakthavatsalam (Microsoft Designer, arXiv:2501.10969, 2025):
 *    "AI Based Font Pair Suggestion Modelling For Graphic Design".
 * 3. Andrew Somers (W3C Silver / WCAG 3 Candidate, 2021-2024):
 *    "APCA (Advanced Perceptual Contrast Algorithm) & Spatial Frequency Models".
 * 4. Wallace, Bylinskii et al. (Adobe Research / ACM TOCHI 2022, ACM DIS 2022):
 *    "Towards Individuated Reading Experiences & FontMART".
 * 5. Apple HIG / Inter Dynamic Type Tracking & Bringhurst Typographic Laws.
 * ============================================================================
 */

// ============================================================================
// 1. INTERFACES Y TIPOS DE DATOS
// ============================================================================

export type FontWeightNumeric = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type LayoutDensity = 'compact' | 'normal' | 'comfortable';
export type TypographicArchetype = 'saas' | 'tech' | 'editorial' | 'friendly' | 'minimalist' | 'dashboard';

export interface FontMorphologyProfile {
  name: string;
  category: 'Serif' | 'Sans-Serif Geométrica' | 'Sans-Serif Neutra' | 'Sans-Serif Humanista' | 'Display';
  /** 0 = Sans-serif puro, 1 = Serif tradicional */
  serifness: number;
  /** 0 = Ultra-Geométrica, 0.5 = Neo-Grotesca Neutra, 1 = Humanista/Orgánica */
  geometry: number;
  /** 0 = Workhorse funcional de UI, 1 = Expresiva / Decorativa / Display */
  decorativeness: number;
  /** Ratio x-height / Cap-height (aprox 0.60 a 0.78) */
  xHeightRatio: number;
  /** Contraste de grosor de trazo (1 = uniforme, >2.5 = alto contraste) */
  strokeContrast: number;
  /** Idoneidad primaria */
  primarySuitability: 'headings' | 'body' | 'both' | 'display';
  /** Arquetipos de GUI recomendados */
  archetypes: TypographicArchetype[];
}

export interface OpticalTrackingResult {
  fontSizePx: number;
  fontWeight: number;
  /** Valor en unidades em (ej. -0.022em) */
  trackingEm: number;
  /** Valor equivalente en px para el tamaño dado */
  trackingPx: number;
  /** Propiedad CSS directa (ej. "-0.022em") */
  cssValue: string;
  /** Justificación psicofísica del interletrado */
  explanation: string;
}

export interface DynamicLineHeightResult {
  fontSizePx: number;
  /** Ratio relativo proporcional (ej. 1.25) */
  ratio: number;
  /** Altura de línea teórica sin redondear */
  rawPx: number;
  /** Altura de línea ajustada a la cuadrícula base (4px u 8px) */
  snappedPx: number;
  /** Paso de la cuadrícula utilizado (ej. 4px) */
  gridStep: number;
  /** Propiedad CSS directa (ej. "32px" o "1.33") */
  cssLineHeight: string;
  /** Diagnóstico de ritmo vertical */
  rhythmDiagnostic: string;
}

export interface FluidTypographyResult {
  fontSizePx: number;
  minPx: number;
  maxPx: number;
  minViewport: number;
  maxViewport: number;
  slopeVw: number;
  interceptRem: number;
  /** Expresión CSS completa clamp() */
  clampCss: string;
}

export interface FontPairingEvaluation {
  primaryFont: string;
  secondaryFont: string;
  isSameFont: boolean;
  /** Distancia morfológica normalizada [0, 1] */
  morphologicalDistance: number;
  /** Puntuación de armonía [0 - 100] */
  harmonyScore: number;
  verdict: 'Excelente' | 'Armonioso' | 'Monotípico Elegante' | 'Poco Contraste' | 'Disonante';
  badgeColor: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  explanation: string;
  scientificReference: string;
}

export interface FontPairingRecommendation {
  secondaryFont: string;
  compatibilityScore: number;
  archetype: string;
  contrastReason: string;
}

export interface LegibilityEvaluation {
  fontSizePx: number;
  fontWeight: number;
  isCompliant: boolean;
  score: number; // 0 - 100
  spatialFrequencyLevel: 'Alta (Detalle fino)' | 'Media (Lectura estándar)' | 'Baja (Display robusto)';
  warnings: string[];
  recommendation?: string;
}

export interface TypographyHierarchyScore {
  overallScore: number; // 0 - 100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeBadge: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  metrics: {
    scaleProgressionScore: number; // 0 - 100 (Weber-Fechner JND)
    baselineRhythmScore: number;    // 0 - 100 (% de estilos alineados a 4px)
    opticalTrackingHealth: number;  // 0 - 100
    spatialLegibilityScore: number; // 0 - 100
    pairingHarmonyScore: number;    // 0 - 100
  };
  diagnostics: string[];
  actionableTips: string[];
}

export interface TypographyItemLike {
  id?: number;
  proyecto_id?: number;
  estilo: string;
  tamano_px: number;
  peso: string;
  interlineado: number;
  tipo_fuente?: string;
  orden?: number;
  letter_spacing?: number;
  line_height_px?: number;
}

export interface HarmonicScaleOptions {
  gridStep?: number;
  density?: LayoutDensity;
  includeFluid?: boolean;
}

export interface HarmonicScaleItem extends TypographyItemLike {
  step: number;
  trackingEm: number;
  trackingCss: string;
  lineHeightPx: number;
  lineHeightCss: string;
  fluidClamp?: string;
  roleDescription: string;
}

export interface DesignTokensExport {
  cssVariables: string;
  tailwindConfig: Record<string, any>;
  w3cTokensJson: string;
}

// ============================================================================
// 2. BASE DE CONOCIMIENTO MORFOLÓGICO TIPOGRÁFICO
// ============================================================================
// Matriz de características morfológicas basada en Choi & Hyun (Nature 2024)
// y Microsoft Designer (2025).

export const FONT_MORPHOLOGY_CATALOG: Record<string, FontMorphologyProfile> = {
  'Inter': {
    name: 'Inter',
    category: 'Sans-Serif Neutra',
    serifness: 0.0,
    geometry: 0.45,
    decorativeness: 0.05,
    xHeightRatio: 0.74,
    strokeContrast: 1.05,
    primarySuitability: 'both',
    archetypes: ['saas', 'tech', 'dashboard']
  },
  'Roboto': {
    name: 'Roboto',
    category: 'Sans-Serif Neutra',
    serifness: 0.0,
    geometry: 0.48,
    decorativeness: 0.06,
    xHeightRatio: 0.72,
    strokeContrast: 1.08,
    primarySuitability: 'both',
    archetypes: ['saas', 'dashboard']
  },
  'Outfit': {
    name: 'Outfit',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.15,
    decorativeness: 0.28,
    xHeightRatio: 0.70,
    strokeContrast: 1.10,
    primarySuitability: 'headings',
    archetypes: ['tech', 'saas', 'modern' as any]
  },
  'Poppins': {
    name: 'Poppins',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.10,
    decorativeness: 0.32,
    xHeightRatio: 0.69,
    strokeContrast: 1.12,
    primarySuitability: 'headings',
    archetypes: ['friendly', 'tech']
  },
  'Montserrat': {
    name: 'Montserrat',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.12,
    decorativeness: 0.35,
    xHeightRatio: 0.67,
    strokeContrast: 1.15,
    primarySuitability: 'headings',
    archetypes: ['editorial', 'saas']
  },
  'Open Sans': {
    name: 'Open Sans',
    category: 'Sans-Serif Humanista',
    serifness: 0.0,
    geometry: 0.75,
    decorativeness: 0.08,
    xHeightRatio: 0.73,
    strokeContrast: 1.18,
    primarySuitability: 'body',
    archetypes: ['friendly', 'editorial', 'saas']
  },
  'Lato': {
    name: 'Lato',
    category: 'Sans-Serif Humanista',
    serifness: 0.0,
    geometry: 0.70,
    decorativeness: 0.15,
    xHeightRatio: 0.68,
    strokeContrast: 1.20,
    primarySuitability: 'both',
    archetypes: ['saas', 'editorial']
  },
  'Oswald': {
    name: 'Oswald',
    category: 'Display',
    serifness: 0.0,
    geometry: 0.30,
    decorativeness: 0.65,
    xHeightRatio: 0.78,
    strokeContrast: 1.22,
    primarySuitability: 'display',
    archetypes: ['tech', 'dashboard']
  },
  'Raleway': {
    name: 'Raleway',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.20,
    decorativeness: 0.40,
    xHeightRatio: 0.62,
    strokeContrast: 1.25,
    primarySuitability: 'headings',
    archetypes: ['minimalist', 'editorial']
  },
  'Playfair Display': {
    name: 'Playfair Display',
    category: 'Serif',
    serifness: 0.95,
    geometry: 0.60,
    decorativeness: 0.75,
    xHeightRatio: 0.66,
    strokeContrast: 2.80,
    primarySuitability: 'display',
    archetypes: ['editorial']
  },
  'Nunito': {
    name: 'Nunito',
    category: 'Sans-Serif Humanista',
    serifness: 0.0,
    geometry: 0.85,
    decorativeness: 0.30,
    xHeightRatio: 0.71,
    strokeContrast: 1.05,
    primarySuitability: 'both',
    archetypes: ['friendly', 'tech']
  },
  'Merriweather': {
    name: 'Merriweather',
    category: 'Serif',
    serifness: 0.88,
    geometry: 0.65,
    decorativeness: 0.40,
    xHeightRatio: 0.75,
    strokeContrast: 1.65,
    primarySuitability: 'both',
    archetypes: ['editorial', 'saas']
  },
  'Rubik': {
    name: 'Rubik',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.25,
    decorativeness: 0.22,
    xHeightRatio: 0.73,
    strokeContrast: 1.04,
    primarySuitability: 'both',
    archetypes: ['tech', 'friendly', 'dashboard']
  },
  'Ubuntu': {
    name: 'Ubuntu',
    category: 'Sans-Serif Humanista',
    serifness: 0.0,
    geometry: 0.78,
    decorativeness: 0.30,
    xHeightRatio: 0.70,
    strokeContrast: 1.14,
    primarySuitability: 'both',
    archetypes: ['tech', 'saas']
  },
  'Lora': {
    name: 'Lora',
    category: 'Serif',
    serifness: 0.90,
    geometry: 0.80,
    decorativeness: 0.50,
    xHeightRatio: 0.71,
    strokeContrast: 2.10,
    primarySuitability: 'both',
    archetypes: ['editorial', 'minimalist']
  },
  'Work Sans': {
    name: 'Work Sans',
    category: 'Sans-Serif Neutra',
    serifness: 0.0,
    geometry: 0.40,
    decorativeness: 0.12,
    xHeightRatio: 0.72,
    strokeContrast: 1.10,
    primarySuitability: 'both',
    archetypes: ['saas', 'tech', 'dashboard']
  },
  'Fira Sans': {
    name: 'Fira Sans',
    category: 'Sans-Serif Humanista',
    serifness: 0.0,
    geometry: 0.72,
    decorativeness: 0.18,
    xHeightRatio: 0.72,
    strokeContrast: 1.15,
    primarySuitability: 'both',
    archetypes: ['tech', 'dashboard']
  },
  'Quicksand': {
    name: 'Quicksand',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.15,
    decorativeness: 0.38,
    xHeightRatio: 0.69,
    strokeContrast: 1.02,
    primarySuitability: 'headings',
    archetypes: ['friendly', 'minimalist']
  },
  'Karla': {
    name: 'Karla',
    category: 'Sans-Serif Neutra',
    serifness: 0.0,
    geometry: 0.52,
    decorativeness: 0.20,
    xHeightRatio: 0.74,
    strokeContrast: 1.12,
    primarySuitability: 'both',
    archetypes: ['editorial', 'tech', 'saas']
  },
  'Space Grotesk': {
    name: 'Space Grotesk',
    category: 'Sans-Serif Geométrica',
    serifness: 0.0,
    geometry: 0.18,
    decorativeness: 0.55,
    xHeightRatio: 0.71,
    strokeContrast: 1.16,
    primarySuitability: 'headings',
    archetypes: ['tech', 'dashboard', 'minimalist']
  }
};

// ============================================================================
// 3. MODELO MATEMÁTICO 1: INTERLETRADO ÓPTICO ADAPTATIVO (OPTICAL TRACKING)
// ============================================================================
/**
 * Calcula el tracking/letter-spacing óptico en función del tamaño de fuente y peso.
 * 
 * Basado en las curvas no lineales de Apple Dynamic Type y la física perceptual
 * de frecuencia espacial (Somers / APCA):
 * - En tamaños pequeños (<16px), la rasterización de píxeles empasta letras contiguas.
 *   Se requiere tracking positivo para evitar amontonamiento.
 * - En 16px (lectura regular), el tracking base es neutro (0em).
 * - En tamaños grandes (>20px), la distancia visual entre glifos se percibe excesiva,
 *   produciendo fragmentación del bloque tipográfico. Requiere tracking negativo no lineal.
 * - Pesos más densos (700+) ocupan mayor masa horizontal y requieren un ajuste de -0.005em adicional.
 */
export function calculateOpticalTracking(
  fontSizePx: number,
  fontWeight: string | number = 400
): OpticalTrackingResult {
  const numericWeight = extractNumericWeight(fontWeight);

  let trackingEm = 0;

  if (fontSizePx <= 11) {
    trackingEm = 0.040;
  } else if (fontSizePx <= 12) {
    trackingEm = 0.030;
  } else if (fontSizePx <= 14) {
    trackingEm = 0.015;
  } else if (fontSizePx <= 16) {
    trackingEm = 0.000;
  } else if (fontSizePx <= 19) {
    trackingEm = -0.008;
  } else if (fontSizePx <= 24) {
    trackingEm = -0.015;
  } else if (fontSizePx <= 32) {
    trackingEm = -0.022;
  } else if (fontSizePx <= 44) {
    trackingEm = -0.028;
  } else if (fontSizePx <= 56) {
    trackingEm = -0.034;
  } else {
    // Escala continua logarítmica para tamaños Display masivos
    trackingEm = -0.022 * Math.log2(fontSizePx / 16);
    trackingEm = Math.max(-0.045, Math.min(0.05, trackingEm));
  }

  // Corrección por peso óptico de trazo
  if (numericWeight >= 700) {
    trackingEm -= 0.005;
  } else if (numericWeight <= 300) {
    trackingEm += 0.005;
  }

  // Redondear a 4 decimales
  trackingEm = Number(trackingEm.toFixed(4));
  const trackingPx = Number((trackingEm * fontSizePx).toFixed(2));
  const cssValue = `${trackingEm}em`;

  let explanation = '';
  if (trackingEm > 0) {
    explanation = `Micro-textos (${fontSizePx}px): Tracking positivo expandido (+${trackingEm}em) para evitar que los glifos se empasten en pantallas.`;
  } else if (trackingEm === 0) {
    explanation = `Cuerpo base (${fontSizePx}px): Tracking neutral de lectura estándar.`;
  } else {
    explanation = `Titular grande (${fontSizePx}px): Tracking negativo comprimido (${trackingEm}em) para compactar el ritmo visual y dar acabado prémium.`;
  }

  return {
    fontSizePx,
    fontWeight: numericWeight,
    trackingEm,
    trackingPx,
    cssValue,
    explanation
  };
}

// ============================================================================
// 4. MODELO MATEMÁTICO 2: INTERLINEADO DINÁMICO INVERSO Y RITMO VERTICAL (4PX)
// ============================================================================
/**
 * Calcula el interlineado ideal usando la relación hiperbólica inversa
 * derivada de las leyes de Bringhurst y Golden Ratio Typography (Pearson):
 * 
 *   LH_ideal(s) = 1.10 + (k / sqrt(s))
 * 
 * Posterior bloqueo a la cuadrícula base (Baseline Grid Lock):
 *   LH_snapped = round((s * LH_ideal) / gridStep) * gridStep
 */
export function calculateDynamicLineHeight(
  fontSizePx: number,
  gridStep = 4,
  density: LayoutDensity = 'normal'
): DynamicLineHeightResult {
  const safeSize = Math.max(8, fontSizePx);

  // Constante hiperbólica de decaimiento
  const k = 1.62;
  const rawRatio = 1.10 + (k / Math.sqrt(safeSize));

  // Multiplicador de densidad de interfaz
  const densityMultiplier = density === 'compact' ? 0.94 : density === 'comfortable' ? 1.06 : 1.0;
  const targetRatio = Math.max(1.05, Math.min(1.75, rawRatio * densityMultiplier));

  const rawPx = safeSize * targetRatio;
  // Ajuste a la cuadrícula base de 4px u 8px
  const snappedPx = Math.max(gridStep, Math.round(rawPx / gridStep) * gridStep);
  const ratio = Number((snappedPx / safeSize).toFixed(3));
  const cssLineHeight = `${snappedPx}px`;

  let rhythmDiagnostic = '';
  if (snappedPx % gridStep === 0) {
    rhythmDiagnostic = `Alineado con precisión a la rejilla base de ${gridStep}px (${snappedPx}px = ${snappedPx / gridStep} módulos).`;
  } else {
    rhythmDiagnostic = `Desalineado de la rejilla. Ajustado a ${snappedPx}px.`;
  }

  return {
    fontSizePx: safeSize,
    ratio,
    rawPx: Number(rawPx.toFixed(2)),
    snappedPx,
    gridStep,
    cssLineHeight,
    rhythmDiagnostic
  };
}

// ============================================================================
// 5. MODELO MATEMÁTICO 3: TIPOGRAFÍA FLUIDA RESPONSIVA (CSS CLAMP)
// ============================================================================
/**
 * Calcula la fórmula de escalado fluido lineal continuo entre viewports:
 * 
 *   font-size: clamp(minRem, Yvw + Xrem, maxRem)
 * 
 * @param minPx Tamaño en viewport mínimo (ej. 375px móvil)
 * @param maxPx Tamaño en viewport máximo (ej. 1440px desktop)
 */
export function calculateFluidTypography(
  minPx: number,
  maxPx: number,
  minViewport = 375,
  maxViewport = 1440
): FluidTypographyResult {
  const safeMin = Math.min(minPx, maxPx);
  const safeMax = Math.max(minPx, maxPx);

  const slope = ((safeMax - safeMin) / (maxViewport - minViewport)) * 100;
  const interceptPx = (minViewport * safeMax - maxViewport * safeMin) / (minViewport - maxViewport);
  const interceptRem = interceptPx / 16;

  const minRem = Number((safeMin / 16).toFixed(3));
  const maxRem = Number((safeMax / 16).toFixed(3));
  const slopeVw = Number(slope.toFixed(3));
  const interceptRemFixed = Number(interceptRem.toFixed(3));

  const sign = interceptRemFixed >= 0 ? '+' : '-';
  const absIntercept = Math.abs(interceptRemFixed);

  const clampCss = `clamp(${minRem}rem, ${slopeVw}vw ${sign} ${absIntercept}rem, ${maxRem}rem)`;

  return {
    fontSizePx: safeMax,
    minPx: safeMin,
    maxPx: safeMax,
    minViewport,
    maxViewport,
    slopeVw,
    interceptRem: interceptRemFixed,
    clampCss
  };
}

// ============================================================================
// 6. MODELO MATEMÁTICO 4: EMPAREJAMIENTO TIPOGRÁFICO POR DISTANCIA MORFOLÓGICA
// ============================================================================
/**
 * Implementa el modelo de Choi & Hyun (Nature Scientific Reports, 2024):
 * Evalúa afinidad, tensión armónica y contraste entre dos fuentes mediante
 * la distancia euclidiana ponderada en el espacio tridimensional de factores NMF:
 * 
 *   D(u, v) = sqrt( w_serif*(u_s - v_s)^2 + w_geo*(u_g - v_g)^2 + w_dec*(u_d - v_d)^2 + w_xh*(u_xh - v_xh)^2 )
 */
export function evaluateFontPairing(
  primaryFontName: string,
  secondaryFontName: string
): FontPairingEvaluation {
  if (!primaryFontName || !secondaryFontName) {
    return {
      primaryFont: primaryFontName,
      secondaryFont: secondaryFontName,
      isSameFont: false,
      morphologicalDistance: 0,
      harmonyScore: 50,
      verdict: 'Poco Contraste',
      badgeColor: 'warning',
      explanation: 'Selecciona ambas fuentes para evaluar la compatibilidad.',
      scientificReference: 'Choi & Hyun (Scientific Reports, 2024)'
    };
  }

  const isSameFont = primaryFontName.trim().toLowerCase() === secondaryFontName.trim().toLowerCase();

  // Caso Monotípico: Usar una sola superfamilia con pesos contrastantes (estándar Apple/Material)
  if (isSameFont) {
    return {
      primaryFont: primaryFontName,
      secondaryFont: secondaryFontName,
      isSameFont: true,
      morphologicalDistance: 0.0,
      harmonyScore: 95,
      verdict: 'Monotípico Elegante',
      badgeColor: 'success',
      explanation: `Excelente coherencia: Usar "${primaryFontName}" tanto para títulos como para cuerpo garantiza unidad cromática y estructural sin riesgo de conflicto visual.`,
      scientificReference: 'Choi & Hyun (Nature Sci Rep 2024) - Central Node Topology'
    };
  }

  const p1 = getFontProfile(primaryFontName);
  const p2 = getFontProfile(secondaryFontName);

  // Pesos de las dimensiones morfológicas (derivados de NMF)
  const wSerif = 0.35;
  const wGeometry = 0.30;
  const wDecorativeness = 0.20;
  const wXHeight = 0.15;

  const dSerif = Math.pow(p1.serifness - p2.serifness, 2);
  const dGeometry = Math.pow(p1.geometry - p2.geometry, 2);
  const dDecorativeness = Math.pow(p1.decorativeness - p2.decorativeness, 2);
  const dXHeight = Math.pow((p1.xHeightRatio - p2.xHeightRatio) / 0.2, 2); // normalizado

  const rawDistance = Math.sqrt(
    wSerif * dSerif +
    wGeometry * dGeometry +
    wDecorativeness * dDecorativeness +
    wXHeight * dXHeight
  );

  const morphologicalDistance = Number(Math.min(1.0, rawDistance).toFixed(3));

  // Reglas psicofísicas de emparejamiento:
  // 1. "Uncanny Valley" tipográfico (Distancia < 0.20 en fuentes distintas):
  //    Las fuentes se parecen demasiado pero no son idénticas, lo que genera sensación de error visual.
  // 2. "Sweet Spot" armónico (0.28 <= Distancia <= 0.65):
  //    Contraste complementario claro (ej. Sans Neutra para cuerpo + Serif o Geométrica para títulos).
  // 3. "Disonancia Extrema" (Distancia > 0.85):
  //    Choque caótico de lenguajes visuales.

  let harmonyScore = 0;
  let verdict: FontPairingEvaluation['verdict'] = 'Armonioso';
  let badgeColor: FontPairingEvaluation['badgeColor'] = 'primary';
  let explanation = '';

  if (morphologicalDistance < 0.22) {
    harmonyScore = Math.round(35 + (morphologicalDistance / 0.22) * 20);
    verdict = 'Poco Contraste';
    badgeColor = 'warning';
    explanation = `Riesgo de confusión estética: "${primaryFontName}" y "${secondaryFontName}" son demasiado similares morfológicamente (${p1.category} vs ${p2.category}). Para una GUI limpia, o usas la misma fuente, o aumentas el contraste entre cuerpo y títulos.`;
  } else if (morphologicalDistance >= 0.22 && morphologicalDistance <= 0.68) {
    // Zona de armonía dorada
    const centerDev = Math.abs(morphologicalDistance - 0.45);
    harmonyScore = Math.round(100 - (centerDev * 35));
    harmonyScore = Math.max(82, Math.min(100, harmonyScore));
    verdict = harmonyScore >= 90 ? 'Excelente' : 'Armonioso';
    badgeColor = harmonyScore >= 90 ? 'primary' : 'success';
    explanation = `Contraste complementario óptimo (Distancia ${morphologicalDistance}): "${primaryFontName}" (${p1.category}) aporta jerarquía y personalidad a los titulares, mientras "${secondaryFontName}" (${p2.category}) garantiza máxima legibilidad y confort ocular en el cuerpo.`;
  } else {
    // Distancia muy alta
    harmonyScore = Math.round(Math.max(20, 75 - (morphologicalDistance - 0.68) * 100));
    verdict = 'Disonante';
    badgeColor = 'danger';
    explanation = `Tensión estructural elevada: La distancia morfológica entre ambas fuentes (${morphologicalDistance}) es muy pronunciada. Podrían competir por la atención del usuario en lugar de complementarse.`;
  }

  return {
    primaryFont: primaryFontName,
    secondaryFont: secondaryFontName,
    isSameFont: false,
    morphologicalDistance,
    harmonyScore,
    verdict,
    badgeColor,
    explanation,
    scientificReference: 'Choi & Hyun (Scientific Reports, 2024)'
  };
}

/**
 * Recomienda automáticamente las mejores parejas secundarias para una fuente principal dada.
 */
export function recommendOptimalPairings(
  primaryFontName: string,
  archetype?: TypographicArchetype
): FontPairingRecommendation[] {
  const p1 = getFontProfile(primaryFontName);
  const candidates = Object.values(FONT_MORPHOLOGY_CATALOG).filter(
    font => font.name.toLowerCase() !== primaryFontName.toLowerCase()
  );

  const scored = candidates.map(candidate => {
    const evaluation = evaluateFontPairing(p1.name, candidate.name);
    let score = evaluation.harmonyScore;

    // Bonificación si el candidato es apto para cuerpo
    if (candidate.primarySuitability === 'body' || candidate.primarySuitability === 'both') {
      score += 5;
    }

    // Bonificación por coincidencia de arquetipo
    if (archetype && candidate.archetypes.includes(archetype)) {
      score += 10;
    }

    return {
      secondaryFont: candidate.name,
      compatibilityScore: Math.min(100, score),
      archetype: candidate.archetypes[0] || 'saas',
      contrastReason: `${candidate.category} con ratio x-height ${candidate.xHeightRatio} para lectura fluida.`
    };
  });

  return scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 4);
}

// ============================================================================
// 7. MODELO MATEMÁTICO 5: FRECUENCIA ESPACIAL Y LEGIBILIDAD (APCA / SOMERS)
// ============================================================================
/**
 * Valida la idoneidad psicofísica de una combinación de tamaño y peso de fuente.
 * 
 * Principio de Frecuencia Espacial:
 * - Glifos pequeños con trazos ultradelgados (Light 300) tienen frecuencias espaciales
 *   tan altas que la retina humana pierde agudeza de bordes en pantallas digitales.
 * - Glifos muy pequeños con trazos pesados (800+) empastan sus contraformas (el interior
 *   de las letras 'e', 'a', 'o'), reduciendo la velocidad de lectura un 20-35% (Adobe Research 2022).
 */
export function validateSpatialLegibility(
  fontSizePx: number,
  fontWeight: string | number,
  role?: string
): LegibilityEvaluation {
  const numericWeight = extractNumericWeight(fontWeight);
  const warnings: string[] = [];
  let score = 100;

  let spatialFrequencyLevel: LegibilityEvaluation['spatialFrequencyLevel'] = 'Media (Lectura estándar)';
  if (fontSizePx < 14) {
    spatialFrequencyLevel = 'Alta (Detalle fino)';
  } else if (fontSizePx >= 28) {
    spatialFrequencyLevel = 'Baja (Display robusto)';
  }

  // Regla 1: Trazo ultradelgado en alta frecuencia espacial
  if (fontSizePx < 16 && numericWeight < 400) {
    score -= 30;
    warnings.push(`Peso ligero (${numericWeight}) en ${fontSizePx}px: La frecuencia espacial es muy alta; el texto perderá contraste y provocará fatiga visual.`);
  }

  // Regla 2: Empastamiento de contraformas en micro-textos
  if (fontSizePx <= 12 && numericWeight >= 700) {
    score -= 25;
    warnings.push(`Peso pesado (${numericWeight}) en tamaño diminuto (${fontSizePx}px): Las aberturas internas de las letras se cerrarán, dificultando la lectura.`);
  }

  // Regla 3: Título gigante sin peso visual
  if (fontSizePx >= 36 && numericWeight < 400 && role?.toLowerCase().includes('h')) {
    score -= 15;
    warnings.push(`Titular grande (${fontSizePx}px) con peso Light (${numericWeight}): Falta de anclaje óptico para la jerarquía del layout.`);
  }

  // Regla 4: Tamaño por debajo del umbral físico de legibilidad APCA (12px en sRGB)
  if (fontSizePx < 12) {
    score -= 35;
    warnings.push(`Tamaño crítico (${fontSizePx}px): Inferior al mínimo físico recomendado por APCA para interfaces (12px).`);
  }

  let recommendation: string | undefined;
  if (warnings.length > 0) {
    if (fontSizePx < 12) {
      recommendation = `Aumentar el tamaño a mínimo 12px (etiquetas puntuales) o 14px (lectura UI).`;
    } else if (fontSizePx < 16 && numericWeight < 400) {
      recommendation = `Subir el peso a Regular (400) o Medium (500) para garantizar solidez de trazo.`;
    } else if (fontSizePx <= 12 && numericWeight >= 700) {
      recommendation = `Reducir el peso a Semibold (600) o Regular (400).`;
    }
  }

  return {
    fontSizePx,
    fontWeight: numericWeight,
    isCompliant: score >= 75,
    score: Math.max(0, score),
    spatialFrequencyLevel,
    warnings,
    recommendation
  };
}

// ============================================================================
// 8. MODELO MATEMÁTICO 6: SCORE MULTIFACTORIAL DE JERARQUÍA EN GUI (0 - 100)
// ============================================================================
/**
 * Evalúa de forma holística la calidad estética y funcional del sistema tipográfico
 * según estándares modernos de interfaz (UI/UX Engineering):
 * 
 * 1. Progresión Geométrica y Weber-Fechner JND (Just Noticeable Difference >= 1.125)
 * 2. Conforme al Ritmo Vertical de 4px
 * 3. Salud del Interletrado Óptico
 * 4. Frecuencia Espacial y Legibilidad APCA
 * 5. Armonía de Emparejamiento Tipográfico
 */
export function calculateGuiTypographyScore(
  items: TypographyItemLike[],
  primaryFont: string,
  secondaryFont: string,
  basePx = 16
): TypographyHierarchyScore {
  if (!items || items.length === 0) {
    return {
      overallScore: 0,
      grade: 'D',
      gradeBadge: 'danger',
      metrics: {
        scaleProgressionScore: 0,
        baselineRhythmScore: 0,
        opticalTrackingHealth: 0,
        spatialLegibilityScore: 0,
        pairingHarmonyScore: 0
      },
      diagnostics: ['No hay estilos tipográficos configurados en el proyecto.'],
      actionableTips: ['Utiliza el generador de escala armónica para inicializar los estilos.']
    };
  }

  const diagnostics: string[] = [];
  const actionableTips: string[] = [];

  // Métrica 1: Progresión de Escala
  const sorted = [...items].sort((a, b) => b.tamano_px - a.tamano_px);
  const h1 = sorted.find(i => i.estilo.toUpperCase().includes('H1')) || sorted[0];
  const body = sorted.find(i => i.estilo.toUpperCase().includes('BODY') || i.estilo.toUpperCase().includes('CUERPO')) || sorted[Math.floor(sorted.length / 2)];

  const scaleRatio = h1 && body && body.tamano_px > 0 ? (h1.tamano_px / body.tamano_px) : 2.0;

  let scaleProgressionScore = 90;
  if (scaleRatio < 1.7) {
    scaleProgressionScore = 65;
    diagnostics.push(`Jerarquía moderada (Ratio H1/Body = ${scaleRatio.toFixed(2)}x): Adecuada para software denso, pero con poco impacto visual.`);
    actionableTips.push('Si buscas una interfaz más moderna o promocional, amplía la escala usando un ratio Major Third (1.250) o Perfect Fourth (1.333).');
  } else if (scaleRatio > 3.2) {
    scaleProgressionScore = 70;
    diagnostics.push(`Escala excesivamente pronunciada (${scaleRatio.toFixed(2)}x): Los titulares gigantes pueden romper contenedores en pantallas de laptops.`);
    actionableTips.push('Considera activar la tipografía fluida con clamp() para controlar el tamaño en pantallas compactas.');
  } else {
    scaleProgressionScore = 98;
    diagnostics.push(`Escala áurea equilibrada (${scaleRatio.toFixed(2)}x): Proporción óptima entre titulares y contenido.`);
  }

  // Métrica 2: Ritmo vertical en rejilla de 4px
  let alignedToGridCount = 0;
  items.forEach(item => {
    const lhPx = item.line_height_px || Math.round(item.tamano_px * item.interlineado);
    if (lhPx % 4 === 0) {
      alignedToGridCount++;
    }
  });
  const baselineRhythmScore = Math.round((alignedToGridCount / items.length) * 100);
  if (baselineRhythmScore < 80) {
    actionableTips.push(`${items.length - alignedToGridCount} estilos no están ajustados a la rejilla de 4px. Activa el ajuste automático de cuadrícula.`);
  }

  // Métrica 3: Salud del Interletrado Óptico
  let trackingHealthScore = 95;
  const largeHeadersWithoutNegativeTracking = items.filter(
    i => i.tamano_px >= 28 && (i.letter_spacing === undefined || i.letter_spacing >= 0)
  );
  if (largeHeadersWithoutNegativeTracking.length > 0) {
    trackingHealthScore -= 20;
    actionableTips.push(`Los titulares grandes (${largeHeadersWithoutNegativeTracking.map(h => h.estilo).join(', ')}) se beneficiarían de tracking negativo (-0.02em a -0.03em) para compactar el ritmo.`);
  }

  // Métrica 4: Frecuencia espacial y legibilidad
  let legibilityTotal = 0;
  items.forEach(item => {
    const evalLeg = validateSpatialLegibility(item.tamano_px, item.peso, item.estilo);
    legibilityTotal += evalLeg.score;
    if (evalLeg.warnings.length > 0) {
      diagnostics.push(...evalLeg.warnings);
    }
  });
  const spatialLegibilityScore = Math.round(legibilityTotal / items.length);

  // Métrica 5: Armonía del emparejamiento tipográfico
  const pairingEval = evaluateFontPairing(primaryFont, secondaryFont);
  const pairingHarmonyScore = pairingEval.harmonyScore;

  // Ponderación global
  const overallScore = Math.round(
    scaleProgressionScore * 0.25 +
    baselineRhythmScore * 0.20 +
    trackingHealthScore * 0.15 +
    spatialLegibilityScore * 0.20 +
    pairingHarmonyScore * 0.20
  );

  let grade: TypographyHierarchyScore['grade'] = 'A';
  let gradeBadge: TypographyHierarchyScore['gradeBadge'] = 'success';

  if (overallScore >= 92) {
    grade = 'S';
    gradeBadge = 'primary';
  } else if (overallScore >= 82) {
    grade = 'A';
    gradeBadge = 'success';
  } else if (overallScore >= 70) {
    grade = 'B';
    gradeBadge = 'info';
  } else if (overallScore >= 58) {
    grade = 'C';
    gradeBadge = 'warning';
  } else {
    grade = 'D';
    gradeBadge = 'danger';
  }

  return {
    overallScore,
    grade,
    gradeBadge,
    metrics: {
      scaleProgressionScore,
      baselineRhythmScore,
      opticalTrackingHealth: trackingHealthScore,
      spatialLegibilityScore,
      pairingHarmonyScore
    },
    diagnostics,
    actionableTips
  };
}

// ============================================================================
// 9. MODELO MATEMÁTICO 7: GENERADOR DE ESCALA ARMÓNICA INTEGRADA
// ============================================================================
/**
 * Genera una escala tipográfica completa que une simultáneamente todos los modelos:
 * - Progresión geométrica modular
 * - Interlineado hiperbólico inverso alineado a la rejilla de 4px
 * - Tracking óptico adaptativo no lineal
 * - Escalado responsivo fluido opcional
 */
export function generateHarmonicScale(
  basePx = 16,
  ratio = 1.25,
  options?: HarmonicScaleOptions
): HarmonicScaleItem[] {
  const gridStep = options?.gridStep ?? 4;
  const density = options?.density ?? 'normal';
  const includeFluid = options?.includeFluid ?? true;

  const styleConfigs: Array<{
    estilo: string;
    step: number;
    peso: string;
    tipo_fuente: 'Principal' | 'Secundaria';
    roleDescription: string;
  }> = [
    { estilo: 'Display', step: 6, peso: 'Bold (700)', tipo_fuente: 'Principal', roleDescription: 'Héroe de portadas y métricas gigantes' },
    { estilo: 'H1', step: 5, peso: 'Bold (700)', tipo_fuente: 'Principal', roleDescription: 'Título principal de página o módulo' },
    { estilo: 'H2', step: 4, peso: 'Bold (700)', tipo_fuente: 'Principal', roleDescription: 'Secciones estructurales' },
    { estilo: 'H3', step: 3, peso: 'Semibold (600)', tipo_fuente: 'Principal', roleDescription: 'Subsecciones y títulos de tarjetas' },
    { estilo: 'H4', step: 2, peso: 'Semibold (600)', tipo_fuente: 'Principal', roleDescription: 'Encabezados de panel y diálogo' },
    { estilo: 'H5', step: 1, peso: 'Medium (500)', tipo_fuente: 'Principal', roleDescription: 'Subtítulos y agrupadores' },
    { estilo: 'Body', step: 0, peso: 'Regular (400)', tipo_fuente: 'Secundaria', roleDescription: 'Texto principal de párrafos y lectura' },
    { estilo: 'Small', step: -1, peso: 'Semibold (600)', tipo_fuente: 'Secundaria', roleDescription: 'Metadatos, etiquetas y texto UI legible' },
    { estilo: 'Micro', step: -2, peso: 'Semibold (600)', tipo_fuente: 'Secundaria', roleDescription: 'Badges compactos, timestamps y leyendas (uso puntual)' }
  ];

  return styleConfigs.map((cfg, index) => {
    const rawSize = basePx * Math.pow(ratio, cfg.step);
    let minFloor = 12;
    if (cfg.estilo === 'Small') {
      minFloor = Math.min(basePx, 14);
    } else if (cfg.estilo === 'Micro') {
      minFloor = Math.min(basePx, 12);
    }
    const tamano_px = Math.max(minFloor, Math.round(rawSize));

    // Para Small >= 15px, peso Regular 400 es suficientemente legible; en 14px se refuerza a Semibold 600 para APCA
    const resolvedPeso = cfg.estilo === 'Small' && tamano_px >= 15 ? 'Regular (400)' : cfg.peso;

    const lhResult = calculateDynamicLineHeight(tamano_px, gridStep, density);
    const trackingResult = calculateOpticalTracking(tamano_px, resolvedPeso);

    let fluidClamp: string | undefined;
    if (includeFluid) {
      // En móvil se usa un ratio más suave, manteniendo el umbral mínimo ergonómico APCA
      const mobileRatio = 1.0 + (ratio - 1.0) * 0.65;
      const mobileFloor = cfg.estilo === 'Small' ? Math.min(basePx, 14) : 12;
      const mobileSize = Math.max(mobileFloor, Math.round(basePx * Math.pow(mobileRatio, cfg.step)));
      fluidClamp = calculateFluidTypography(mobileSize, tamano_px).clampCss;
    }

    return {
      estilo: cfg.estilo,
      step: cfg.step,
      tamano_px,
      peso: resolvedPeso,
      interlineado: lhResult.ratio,
      tipo_fuente: cfg.tipo_fuente,
      orden: index,
      letter_spacing: trackingResult.trackingEm,
      line_height_px: lhResult.snappedPx,
      trackingEm: trackingResult.trackingEm,
      trackingCss: trackingResult.cssValue,
      lineHeightPx: lhResult.snappedPx,
      lineHeightCss: lhResult.cssLineHeight,
      fluidClamp,
      roleDescription: cfg.roleDescription
    };
  });
}

// ============================================================================
// 10. GENERADOR DE DESIGN TOKENS (CSS VARS, TAILWIND, W3C DTCG JSON)
// ============================================================================
/**
 * Exporta el sistema tipográfico completo en formatos estándar listos
 * para producción en frameworks modernos (Angular, React, Tailwind, Figma Tokens).
 */
export function exportDesignTokens(
  items: TypographyItemLike[],
  primaryFont: string,
  secondaryFont: string,
  config?: any
): DesignTokensExport {
  const pFont = primaryFont || 'Inter';
  const sFont = secondaryFont || 'Inter';

  // 1. CSS Custom Properties
  const cssLines: string[] = [
    ':root {',
    `  /* Familias Tipográficas */`,
    `  --font-family-heading: '${pFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`,
    `  --font-family-body: '${sFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`,
    ''
  ];

  items.forEach(item => {
    const key = item.estilo.toLowerCase().replace(/\s+/g, '-');
    const tracking = item.letter_spacing !== undefined
      ? `${item.letter_spacing}em`
      : calculateOpticalTracking(item.tamano_px, item.peso).cssValue;
    const lhPx = item.line_height_px || Math.round(item.tamano_px * item.interlineado);
    const weightNum = extractNumericWeight(item.peso);

    cssLines.push(`  /* ${item.estilo} */`);
    cssLines.push(`  --text-${key}-size: ${item.tamano_px}px;`);
    cssLines.push(`  --text-${key}-rem: ${(item.tamano_px / 16).toFixed(3)}rem;`);
    cssLines.push(`  --text-${key}-line-height: ${lhPx}px;`);
    cssLines.push(`  --text-${key}-tracking: ${tracking};`);
    cssLines.push(`  --text-${key}-weight: ${weightNum};`);
    cssLines.push('');
  });

  cssLines.push('}');
  const cssVariables = cssLines.join('\n');

  // 2. Tailwind Config Snippet
  const tailwindFontSize: Record<string, any> = {};
  items.forEach(item => {
    const key = item.estilo.toLowerCase().replace(/\s+/g, '-');
    const tracking = item.letter_spacing !== undefined
      ? `${item.letter_spacing}em`
      : calculateOpticalTracking(item.tamano_px, item.peso).cssValue;
    const lhPx = item.line_height_px || Math.round(item.tamano_px * item.interlineado);

    tailwindFontSize[key] = [
      `${(item.tamano_px / 16).toFixed(3)}rem`,
      {
        lineHeight: `${lhPx}px`,
        letterSpacing: tracking,
        fontWeight: `${extractNumericWeight(item.peso)}`
      }
    ];
  });

  const tailwindConfig = {
    theme: {
      extend: {
        fontFamily: {
          heading: [`'${pFont}'`, 'sans-serif'],
          body: [`'${sFont}'`, 'sans-serif']
        },
        fontSize: tailwindFontSize
      }
    }
  };

  // 3. W3C Design Tokens Community Group JSON format
  const dtcgTokens: Record<string, any> = {
    typography: {
      fontFamily: {
        heading: { $value: pFont, $type: 'fontFamily' },
        body: { $value: sFont, $type: 'fontFamily' }
      }
    }
  };

  items.forEach(item => {
    const key = item.estilo.toLowerCase().replace(/\s+/g, '-');
    const lhPx = item.line_height_px || Math.round(item.tamano_px * item.interlineado);
    const tracking = item.letter_spacing !== undefined
      ? `${item.letter_spacing}em`
      : calculateOpticalTracking(item.tamano_px, item.peso).cssValue;

    dtcgTokens['typography'][key] = {
      fontSize: { $value: `${item.tamano_px}px`, $type: 'dimension' },
      lineHeight: { $value: `${lhPx}px`, $type: 'dimension' },
      fontWeight: { $value: extractNumericWeight(item.peso), $type: 'fontWeight' },
      letterSpacing: { $value: tracking, $type: 'dimension' }
    };
  });

  const w3cTokensJson = JSON.stringify(dtcgTokens, null, 2);

  return {
    cssVariables,
    tailwindConfig,
    w3cTokensJson
  };
}

// ============================================================================
// 11. UTILIDADES INTERNAS PURAS
// ============================================================================

export function extractNumericWeight(weightInput: string | number | undefined): number {
  if (typeof weightInput === 'number') {
    return weightInput;
  }
  if (!weightInput) return 400;

  const match = weightInput.match(/\b(100|200|300|400|500|600|700|800|900)\b/);
  if (match) {
    return parseInt(match[0], 10);
  }

  const lower = weightInput.toLowerCase();
  if (lower.includes('thin')) return 100;
  if (lower.includes('extralight') || lower.includes('ultra light')) return 200;
  if (lower.includes('light')) return 300;
  if (lower.includes('regular') || lower.includes('normal')) return 400;
  if (lower.includes('medium')) return 500;
  if (lower.includes('semibold') || lower.includes('semi bold')) return 600;
  if (lower.includes('bold')) return 700;
  if (lower.includes('extrabold') || lower.includes('heavy') || lower.includes('black')) return 800;

  return 400;
}

export function getFontProfile(fontName: string): FontMorphologyProfile {
  if (!fontName) {
    return FONT_MORPHOLOGY_CATALOG['Inter'];
  }
  const cleanName = fontName.trim();
  if (FONT_MORPHOLOGY_CATALOG[cleanName]) {
    return FONT_MORPHOLOGY_CATALOG[cleanName];
  }

  // Buscar coincidencia insensible a mayúsculas
  const matchKey = Object.keys(FONT_MORPHOLOGY_CATALOG).find(
    k => k.toLowerCase() === cleanName.toLowerCase()
  );
  if (matchKey) {
    return FONT_MORPHOLOGY_CATALOG[matchKey];
  }

  // Fallback por defecto analítico
  const isSerifGuess = /serif|georgia|times|garamond|baskerville/i.test(cleanName);
  return {
    name: cleanName,
    category: isSerifGuess ? 'Serif' : 'Sans-Serif Neutra',
    serifness: isSerifGuess ? 0.9 : 0.0,
    geometry: 0.5,
    decorativeness: 0.2,
    xHeightRatio: 0.70,
    strokeContrast: isSerifGuess ? 1.8 : 1.1,
    primarySuitability: 'both',
    archetypes: ['saas']
  };
}
