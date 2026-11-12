import {
  calculateOpticalTracking,
  calculateDynamicLineHeight,
  calculateFluidTypography,
  evaluateFontPairing,
  recommendOptimalPairings,
  validateSpatialLegibility,
  calculateGuiTypographyScore,
  generateHarmonicScale,
  exportDesignTokens,
  FONT_MORPHOLOGY_CATALOG,
  extractNumericWeight
} from './typography-algorithms';

describe('Typography Mathematical Models & Algorithms', () => {

  describe('1. Model: Optical Dynamic Tracking', () => {
    it('debe aplicar tracking positivo a tamaños pequeños (<=14px) para evitar empastado de glifos', () => {
      const tracking12 = calculateOpticalTracking(12, 400);
      const tracking14 = calculateOpticalTracking(14, 400);

      expect(tracking12.trackingEm).toBeGreaterThan(0);
      expect(tracking14.trackingEm).toBeGreaterThan(0);
      expect(tracking12.trackingEm).toBeGreaterThan(tracking14.trackingEm);
      expect(tracking12.cssValue).toBe(`${tracking12.trackingEm}em`);
    });

    it('debe aplicar tracking neutral a 16px (lectura regular)', () => {
      const tracking16 = calculateOpticalTracking(16, 400);
      expect(tracking16.trackingEm).toBe(0.0);
      expect(tracking16.cssValue).toBe('0em');
    });

    it('debe aplicar tracking negativo a titulares grandes (>20px) para compactar el ritmo visual', () => {
      const tracking32 = calculateOpticalTracking(32, 700);
      const tracking48 = calculateOpticalTracking(48, 700);

      expect(tracking32.trackingEm).toBeLessThan(0);
      expect(tracking48.trackingEm).toBeLessThan(0);
      expect(tracking48.trackingEm).toBeLessThan(tracking32.trackingEm);
    });

    it('debe aplicar una corrección adicional más compacta para pesos gruesos (700+)', () => {
      const regular32 = calculateOpticalTracking(32, 400);
      const bold32 = calculateOpticalTracking(32, 700);

      expect(bold32.trackingEm).toBeLessThan(regular32.trackingEm);
    });
  });

  describe('2. Model: Dynamic Line-Height & 4px Baseline Grid Lock', () => {
    it('debe calcular interlineados hiperbólicos inversos (mayor ratio en pequeños, menor en titulares)', () => {
      const lhSmall = calculateDynamicLineHeight(12, 4);
      const lhBody = calculateDynamicLineHeight(16, 4);
      const lhTitle = calculateDynamicLineHeight(48, 4);

      expect(lhSmall.ratio).toBeGreaterThan(lhBody.ratio);
      expect(lhBody.ratio).toBeGreaterThan(lhTitle.ratio);
    });

    it('debe encajar exactamente la altura de línea (px) en múltiplos de la rejilla de 4px', () => {
      const sizes = [11, 13, 15, 17, 21, 27, 33, 45, 57];
      sizes.forEach(size => {
        const result = calculateDynamicLineHeight(size, 4);
        expect(result.snappedPx % 4).toBe(0);
      });
    });

    it('debe responder a la densidad seleccionada (compact vs comfortable)', () => {
      const normal = calculateDynamicLineHeight(16, 4, 'normal');
      const compact = calculateDynamicLineHeight(16, 4, 'compact');
      const comfortable = calculateDynamicLineHeight(16, 4, 'comfortable');

      expect(compact.snappedPx).toBeLessThanOrEqual(normal.snappedPx);
      expect(comfortable.snappedPx).toBeGreaterThanOrEqual(normal.snappedPx);
    });
  });

  describe('3. Model: Responsive Fluid Typography (CSS clamp)', () => {
    it('debe calcular la fórmula clamp() con pendiente en vw e intercepto en rem', () => {
      const fluid = calculateFluidTypography(16, 32, 375, 1440);

      expect(fluid.minPx).toBe(16);
      expect(fluid.maxPx).toBe(32);
      expect(fluid.slopeVw).toBeGreaterThan(0);
      expect(fluid.clampCss).toContain('clamp(');
      expect(fluid.clampCss).toContain('1rem');
      expect(fluid.clampCss).toContain('2rem');
      expect(fluid.clampCss).toContain('vw');
    });
  });

  describe('4. Model: Font Pairing Affinity (Choi & Hyun / Nature 2024)', () => {
    it('debe calificar con excelencia una superfamilia monotípica (misma fuente para título y cuerpo)', () => {
      const evalSame = evaluateFontPairing('Inter', 'Inter');
      expect(evalSame.isSameFont).toBeTrue();
      expect(evalSame.harmonyScore).toBeGreaterThanOrEqual(90);
      expect(evalSame.verdict).toBe('Monotípico Elegante');
    });

    it('debe detectar "Poco Contraste" cuando dos fuentes distintas son morfológicamente casi idénticas', () => {
      // Inter y Roboto son ambas Sans Neutras con métricas muy similares
      const evalSimilar = evaluateFontPairing('Inter', 'Roboto');
      expect(evalSimilar.morphologicalDistance).toBeLessThan(0.25);
      expect(evalSimilar.verdict).toBe('Poco Contraste');
      expect(evalSimilar.badgeColor).toBe('warning');
    });

    it('debe calificar como "Excelente" o "Armonioso" combinaciones complementarias contrastantes', () => {
      // Space Grotesk (Geométrica / Tech) + Inter (Neutra / UI)
      const evalTech = evaluateFontPairing('Space Grotesk', 'Inter');
      expect(evalTech.harmonyScore).toBeGreaterThanOrEqual(80);
      expect(['Excelente', 'Armonioso']).toContain(evalTech.verdict);

      // Playfair Display (Serif de alto contraste) + Montserrat / Inter (Sans)
      const evalEditorial = evaluateFontPairing('Playfair Display', 'Inter');
      expect(evalEditorial.harmonyScore).toBeGreaterThanOrEqual(80);
    });

    it('debe generar recomendaciones óptimas de fuentes secundarias', () => {
      const recommendations = recommendOptimalPairings('Space Grotesk', 'tech');
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].compatibilityScore).toBeGreaterThanOrEqual(75);
    });
  });

  describe('5. Model: Spatial Frequency Legibility (APCA / Somers)', () => {
    it('debe emitir advertencia si se usa peso Light (300) en tamaños pequeños (<16px)', () => {
      const evalLightSmall = validateSpatialLegibility(12, 'Light (300)');
      expect(evalLightSmall.isCompliant).toBeFalse();
      expect(evalLightSmall.warnings.length).toBeGreaterThan(0);
      expect(evalLightSmall.recommendation).toBeDefined();
    });

    it('debe emitir advertencia si se usa peso ExtraBold (800) en micro-textos (<=12px)', () => {
      const evalHeavySmall = validateSpatialLegibility(11, 'ExtraBold (800)');
      expect(evalHeavySmall.warnings.length).toBeGreaterThan(0);
    });

    it('debe calificar positivamente un texto de lectura estándar (16px, Regular 400)', () => {
      const evalBody = validateSpatialLegibility(16, 'Regular (400)');
      expect(evalBody.isCompliant).toBeTrue();
      expect(evalBody.score).toBe(100);
      expect(evalBody.warnings.length).toBe(0);
    });
  });

  describe('6. Model: Integrated Harmonic Scale Generator', () => {
    it('debe autogenerar una escala de 8 estilos con line-height en rejilla de 4px y tracking', () => {
      const scale = generateHarmonicScale(16, 1.25);

      expect(scale.length).toBe(9); // Display, H1-H5, Body, Small, Micro
      scale.forEach(item => {
        expect(item.tamano_px).toBeGreaterThanOrEqual(12);
        expect(item.lineHeightPx % 4).toBe(0); // Baseline lock
        expect(item.trackingEm).toBeDefined();
        expect(item.fluidClamp).toBeDefined();
      });

      const smallItem = scale.find(i => i.estilo === 'Small');
      const microItem = scale.find(i => i.estilo === 'Micro');
      expect(smallItem?.tamano_px).toBeGreaterThanOrEqual(14);
      expect(microItem?.tamano_px).toBeGreaterThanOrEqual(12);

      // El tamaño debe decrecer conforme baja el step
      for (let i = 0; i < scale.length - 1; i++) {
        expect(scale[i].tamano_px).toBeGreaterThanOrEqual(scale[i + 1].tamano_px);
      }
    });
  });

  describe('7. Model: Multi-factor GUI Typographic Hierarchy Index', () => {
    it('debe calcular una puntuación compuesta (0-100) con desglose y consejos', () => {
      const scale = generateHarmonicScale(16, 1.25);
      const score = calculateGuiTypographyScore(scale, 'Space Grotesk', 'Inter', 16);

      expect(score.overallScore).toBeGreaterThanOrEqual(70);
      expect(['S', 'A', 'B']).toContain(score.grade);
      expect(score.metrics.baselineRhythmScore).toBe(100);
      expect(score.metrics.scaleProgressionScore).toBeGreaterThan(80);
      expect(score.diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('8. Model: Design Tokens Exporter', () => {
    it('debe exportar CSS Custom Properties, Tailwind config y JSON DTCG válidos', () => {
      const scale = generateHarmonicScale(16, 1.25);
      const tokens = exportDesignTokens(scale, 'Outfit', 'Inter');

      expect(tokens.cssVariables).toContain(':root');
      expect(tokens.cssVariables).toContain('--font-family-heading');
      expect(tokens.cssVariables).toContain('--text-h1-line-height');
      expect(tokens.cssVariables).toContain('--text-h1-tracking');

      expect(tokens.tailwindConfig['theme']['extend']['fontSize']).toBeDefined();
      expect(tokens.tailwindConfig['theme']['extend']['fontFamily']['heading']).toBeDefined();

      const parsedJson = JSON.parse(tokens.w3cTokensJson);
      expect(parsedJson.typography).toBeDefined();
      expect(parsedJson.typography.h1.fontSize.$value).toBeDefined();
    });
  });

  describe('9. Helper: Extract Numeric Weight', () => {
    it('debe extraer correctamente pesos numéricos de strings variados', () => {
      expect(extractNumericWeight('Bold (700)')).toBe(700);
      expect(extractNumericWeight('Semibold (600)')).toBe(600);
      expect(extractNumericWeight('Light (300)')).toBe(300);
      expect(extractNumericWeight('Regular (400)')).toBe(400);
      expect(extractNumericWeight('ExtraBold (800)')).toBe(800);
      expect(extractNumericWeight(500)).toBe(500);
      expect(extractNumericWeight('medium')).toBe(500);
    });
  });
});
