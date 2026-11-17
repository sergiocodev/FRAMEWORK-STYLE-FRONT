import {
  calculateAPCA,
  evaluateAPCA,
  getApcaLevel,
  getApcaBadgeClass,
  getApcaFontRequirements,
  auditProjectTypographyTokens,
  isValidHex,
  normalizeHex
} from './apca-utils';

describe('APCA Mathematical Contrast Utilities', () => {

  describe('1. Hex Validation and Normalization', () => {
    it('debe validar hexadecimales válidos (#RGB y #RRGGBB)', () => {
      expect(isValidHex('#FFF')).toBeTrue();
      expect(isValidHex('#ffffff')).toBeTrue();
      expect(isValidHex('#001122')).toBeTrue();
      expect(isValidHex('invalid')).toBeFalse();
      expect(isValidHex('')).toBeFalse();
      expect(isValidHex(null)).toBeFalse();
    });

    it('debe expandir y normalizar correctamente #RGB a #RRGGBB', () => {
      expect(normalizeHex('#FFF')).toBe('#FFFFFF');
      expect(normalizeHex('#123')).toBe('#112233');
      expect(normalizeHex('#0044CC')).toBe('#0044CC');
    });
  });

  describe('2. APCA Contrast Calculation', () => {
    it('debe calcular contraste positivo para texto negro sobre fondo blanco (BoW)', () => {
      const lc = calculateAPCA('#000000', '#FFFFFF');
      expect(lc).toBeGreaterThan(100);
    });

    it('debe calcular contraste negativo para texto blanco sobre fondo negro (WoB)', () => {
      const lc = calculateAPCA('#FFFFFF', '#000000');
      expect(lc).toBeLessThan(-100);
    });

    it('debe retornar 0 para colores idénticos', () => {
      const lc = calculateAPCA('#FFFFFF', '#FFFFFF');
      expect(Math.abs(lc)).toBe(0);
    });

    it('debe retornar 0 de forma segura cuando los colores son inválidos', () => {
      expect(calculateAPCA('invalido', '#FFFFFF')).toBe(0);
      expect(calculateAPCA('#FFFFFF', 'invalido')).toBe(0);
    });
  });

  describe('3. APCA Levels and Categorization', () => {
    it('debe clasificar correctamente según el valor absoluto de Lc', () => {
      expect(getApcaLevel(105)).toBe('Lc90');
      expect(getApcaLevel(90)).toBe('Lc90');
      expect(getApcaLevel(80)).toBe('Lc75');
      expect(getApcaLevel(65)).toBe('Lc60');
      expect(getApcaLevel(50)).toBe('Lc45');
      expect(getApcaLevel(35)).toBe('Lc30');
      expect(getApcaLevel(20)).toBe('Fail');
    });

    it('debe asignar clases visuales correctas según nivel', () => {
      expect(getApcaBadgeClass('Lc90')).toContain('bg-success');
      expect(getApcaBadgeClass('Lc45')).toContain('bg-warning');
      expect(getApcaBadgeClass('Fail')).toContain('bg-danger');
    });
  });

  describe('4. Complete APCA Evaluation & Typography Lookup', () => {
    it('debe evaluar pares de alto contraste como legibles para lectura fluida', () => {
      const evalBlackOnWhite = evaluateAPCA('#000000', '#FFFFFF');
      expect(evalBlackOnWhite.isFluentTextReadable).toBeTrue();
      expect(evalBlackOnWhite.isBodyTextReadable).toBeTrue();
      expect(evalBlackOnWhite.polarity).toBe('dark-on-light');
      expect(evalBlackOnWhite.minFontSizeNormal).not.toBeNull();
      expect(evalBlackOnWhite.minFontSizeNormal!).toBeLessThanOrEqual(16);
    });

    it('debe evaluar polaridad inversa para modo oscuro', () => {
      const evalWhiteOnDark = evaluateAPCA('#FFFFFF', '#121212');
      expect(evalWhiteOnDark.polarity).toBe('light-on-dark');
      expect(evalWhiteOnDark.absLc).toBeGreaterThan(90);
    });

    it('debe evaluar combinaciones de bajo contraste como no aptas', () => {
      const evalLow = evaluateAPCA('#888888', '#999999');
      expect(evalLow.level).toBe('Fail');
      expect(evalLow.isContentReadable).toBeFalse();
    });

    it('debe obtener requerimientos de fuentes para 9 pesos tipográficos', () => {
      const reqs = getApcaFontRequirements(90);
      expect(reqs.length).toBe(9);
      expect(reqs[3].weight).toBe(400);
      expect(reqs[6].weight).toBe(700);
    });
  });

  describe('5. Audit Project Typography Tokens (Integration)', () => {
    const mockTokens = [
      { id: 1, proyecto_id: 1, estilo: 'H1', tamano_px: 32, peso: 'Bold', interlineado: 1.2 },
      { id: 2, proyecto_id: 1, estilo: 'H2', tamano_px: 24, peso: 'Semi-Bold', interlineado: 1.3 },
      { id: 3, proyecto_id: 1, estilo: 'Body', tamano_px: 16, peso: 'Regular', interlineado: 1.5 },
      { id: 4, proyecto_id: 1, estilo: 'Caption', tamano_px: 12, peso: 'Regular', interlineado: 1.4 }
    ];

    it('debe auditar correctamente tokens con contraste moderado Lc 63.8', () => {
      const auditResult = auditProjectTypographyTokens(mockTokens, 63.8);

      expect(auditResult.total).toBe(4);
      // H1 (32px Bold) debe cumplir
      const h1Audit = auditResult.audits.find(a => a.token.estilo === 'H1');
      expect(h1Audit?.cumple).toBeTrue();

      // Body (16px Regular) debe fallar (requiere ~23px)
      const bodyAudit = auditResult.audits.find(a => a.token.estilo === 'Body');
      expect(bodyAudit?.cumple).toBeFalse();
      expect(bodyAudit?.solucionTipografica).not.toBeNull();
    });

    it('debe retornar lista vacía si no se proporcionan tokens', () => {
      const emptyResult = auditProjectTypographyTokens([], 80);
      expect(emptyResult.total).toBe(0);
      expect(emptyResult.cumplen).toBe(0);
    });
  });

});

