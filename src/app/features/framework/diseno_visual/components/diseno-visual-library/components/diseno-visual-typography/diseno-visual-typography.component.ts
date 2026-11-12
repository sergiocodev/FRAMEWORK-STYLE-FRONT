import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DisenoVisualService,
  TypographyItem,
  DisenoVisualConfig
} from '../../../../services/diseno-visual.service';
import { evaluateAPCA, auditProjectTypographyTokens } from '../../../../utils/apca-utils';
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
  LayoutDensity,
  TypographicArchetype,
  FontPairingEvaluation,
  TypographyHierarchyScore
} from '../../../../utils/typography-algorithms';

@Component({
  selector: 'app-diseno-visual-typography',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-typography.component.html',
  styleUrls: ['./diseno-visual-typography.component.scss']
})
export class DisenoVisualTypographyComponent {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  config = this.disenoVisualService.config;
  tipografias = this.disenoVisualService.tipografias;
  colores = this.disenoVisualService.colores;
  tipografiasPreview = signal<TypographyItem[] | null>(null);
  private lastSyncedSignature = '';

  // Sincronización en tiempo real con el Paso 1 (Colores del Proyecto) mediante APCA
  colorTextoPrincipal = computed(() => {
    const cols = this.colores() || [];
    const match =
      cols.find(c => c.uso.toLowerCase().includes('texto principal')) ||
      cols.find(c => c.uso.toLowerCase().includes('texto')) ||
      cols.find(c => c.uso === 'Principal');
    return match ? { nombre: match.nombre, hex: match.hex_code } : { nombre: 'Texto Base', hex: '#1E293B' };
  });

  colorFondoPrincipal = computed(() => {
    const cols = this.colores() || [];
    const match =
      cols.find(c => c.uso === 'Fondo' || c.nombre.toLowerCase().includes('fondo')) ||
      cols.find(c => c.uso === 'Superficie');
    return match ? { nombre: match.nombre, hex: match.hex_code } : { nombre: 'Fondo Base', hex: '#FFFFFF' };
  });

  apcaPaletteSync = computed(() => {
    const lista = this.tipografiasPreview() || this.tipografias() || [];
    const fg = this.colorTextoPrincipal().hex;
    const bg = this.colorFondoPrincipal().hex;
    const evaluation = evaluateAPCA(fg, bg);
    const audit = auditProjectTypographyTokens(lista, evaluation.absLc);
    return { evaluation, audit, fg, bg };
  });

  // Estados de control algorítmico y matemático
  layoutDensity = signal<LayoutDensity>('normal');
  baselineGridStep = signal<number>(4);
  enableFluidClamp = signal<boolean>(true);
  selectedArchetype = signal<TypographicArchetype>('saas');

  arquetipos: Array<{ id: TypographicArchetype; label: string; desc: string }> = [
    { id: 'saas', label: 'SaaS / Pro', desc: 'Interfaces corporativas y funcionales' },
    { id: 'tech', label: 'Tech / Modern', desc: 'Startups, Web3 y productos digitales' },
    { id: 'dashboard', label: 'Dashboard', desc: 'Alta densidad de información y métricas' },
    { id: 'editorial', label: 'Editorial', desc: 'Publicaciones, elegancia y autoridad' },
    { id: 'friendly', label: 'Amigable', desc: 'B2C, apps de consumo y calidez' },
    { id: 'minimalist', label: 'Minimalista', desc: 'Diseño sobrio, suizo y estructurado' }
  ];

  setArchetype(arch: TypographicArchetype) {
    this.selectedArchetype.set(arch);
  }

  // Modals state
  showTypographyModal = false;
  isNewTypography = false;
  editingTypography: Partial<TypographyItem> = {};

  // Modo de visualización dual UI/UX (Tokens vs Muestrario Visual)
  vistaModo: 'tokens' | 'visual' = 'tokens';
  modoAvanzado = false;
  mostrarGridOverlay = false;
  textoMuestra = 'El veloz murciélago hindú comía feliz cardillo y kiwi.';
  copiedTokenId: number | string | null = null;

  toggleModoAvanzado() {
    this.modoAvanzado = !this.modoAvanzado;
  }

  // Agrupaciones reactivas para la Vista Básica (Fuente Principal y Secundaria)
  tipografiasPrincipales = computed<TypographyItem[]>(() => {
    const lista = this.tipografiasPreview() || this.tipografias();
    return lista.filter(t => t.tipo_fuente === 'Principal');
  });

  tipografiasSecundarias = computed<TypographyItem[]>(() => {
    const lista = this.tipografiasPreview() || this.tipografias();
    return lista.filter(t => t.tipo_fuente === 'Secundaria');
  });

  estiloTitularPreview = computed<TypographyItem | undefined>(() => {
    const lista = this.tipografiasPrincipales();
    return lista.find(t => t.estilo === 'Display') || lista.find(t => t.estilo === 'H1') || lista[0];
  });

  estiloCuerpoPreview = computed<TypographyItem | undefined>(() => {
    const lista = this.tipografiasSecundarias();
    return lista.find(t => t.estilo === 'Body') || lista[0];
  });

  // Progresión ordenada de menor a mayor para el visualizador gráfico (Equalizer/Stepper)
  progresionAscendente = computed(() => {
    const lista = this.tipografiasPreview() || this.tipografias();
    return [...lista].sort((a, b) => a.tamano_px - b.tamano_px);
  });

  // Tamaño máximo para calcular las alturas relativas del ecualizador
  maxTamanoPx = computed(() => {
    const lista = this.progresionAscendente();
    if (lista.length === 0) return 64;
    return Math.max(...lista.map(t => t.tamano_px));
  });

  getBarHeightPercentage(tamanoPx: number): number {
    const max = this.maxTamanoPx();
    if (max <= 0) return 30;
    const raw = (tamanoPx / max) * 100;
    return Math.max(16, Math.min(100, Math.round(raw)));
  }

  escalaBase = 16;
  escalaRatio = 1.25;

  fuentesDisponibles = [
    'Inter', 'Roboto', 'Outfit', 'Poppins', 'Montserrat',
    'Open Sans', 'Lato', 'Oswald', 'Raleway', 'Playfair Display',
    'Nunito', 'Merriweather', 'Rubik', 'Ubuntu', 'Lora',
    'Work Sans', 'Fira Sans', 'Quicksand', 'Karla', 'Space Grotesk'
  ];

  ratios = [
    { nombre: 'Minor Second (1.067)', valor: 1.067 },
    { nombre: 'Major Second (1.125)', valor: 1.125 },
    { nombre: 'Minor Third (1.200)', valor: 1.200 },
    { nombre: 'Major Third (1.250)', valor: 1.250 },
    { nombre: 'Perfect Fourth (1.333)', valor: 1.333 },
    { nombre: 'Augmented Fourth (1.414)', valor: 1.414 },
    { nombre: 'Golden Ratio (1.618)', valor: 1.618 }
  ];

  constructor() {
    // Carga reactiva de Google Fonts cuando cambia la configuración
    effect(() => {
      const cfg = this.config();
      if (cfg) {
        this.loadGoogleFont(cfg.fuente_principal);
        this.loadGoogleFont(cfg.fuente_secundaria);
      }
    });

    // Sincronizar automáticamente escalaBase y escalaRatio desde los tokens guardados del proyecto
    effect(() => {
      const lista = this.tipografias();
      if (lista && lista.length > 0 && !this.tipografiasPreview()) {
        const sig = lista.map(t => `${t.estilo}:${t.tamano_px}`).join('|');
        if (sig !== this.lastSyncedSignature) {
          this.lastSyncedSignature = sig;
          const bodyItem = lista.find(t => t.estilo.toUpperCase() === 'BODY');
          if (bodyItem && bodyItem.tamano_px >= 12) {
            this.escalaBase = bodyItem.tamano_px;
          }

          const base = this.escalaBase || 16;
          const h2Item = lista.find(t => t.estilo.toUpperCase() === 'H2');
          const h1Item = lista.find(t => t.estilo.toUpperCase() === 'H1');
          let estimatedRatio = 1.25;
          if (h2Item && h2Item.tamano_px > base) {
            estimatedRatio = Math.pow(h2Item.tamano_px / base, 1 / 4);
          } else if (h1Item && h1Item.tamano_px > base) {
            estimatedRatio = Math.pow(h1Item.tamano_px / base, 1 / 5);
          }

          let closest = this.ratios[3]; // 1.250 por defecto
          let minDiff = Infinity;
          for (const r of this.ratios) {
            const diff = Math.abs(r.valor - estimatedRatio);
            if (diff < minDiff) {
              minDiff = diff;
              closest = r;
            }
          }
          this.escalaRatio = closest.valor;
        }
      }
    });
  }

  loadGoogleFont(fontFamily: string) {
    if (!fontFamily) return;
    const fontNameFormatted = fontFamily.trim().replace(/ /g, '+');
    const linkId = `google-font-${fontNameFormatted.toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontNameFormatted}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
  }

  // =========================================================================
  // MODELO 4: EVALUACIÓN DE EMPAREJAMIENTO TIPOGRÁFICO (NMF / CHOI & HYUN 2024)
  // =========================================================================
  pairingEvaluation = computed<FontPairingEvaluation>(() => {
    const cfg = this.config();
    const principal = cfg?.fuente_principal || 'Inter';
    const secundaria = cfg?.fuente_secundaria || 'Inter';
    return evaluateFontPairing(principal, secundaria);
  });

  recommendedPairings = computed(() => {
    const cfg = this.config();
    const principal = cfg?.fuente_principal || 'Inter';
    return recommendOptimalPairings(principal, this.selectedArchetype());
  });

  advertenciaTipografica = computed<string | null>(() => {
    const evaluation = this.pairingEvaluation();
    if (evaluation.verdict === 'Poco Contraste' || evaluation.verdict === 'Disonante') {
      return evaluation.explanation;
    }
    return null;
  });

  aplicarParejaRecomendada(fontName: string) {
    const currentConfig = this.config();
    if (currentConfig) {
      currentConfig.fuente_secundaria = fontName;
      this.actualizarConfiguracion();
    }
  }

  // =========================================================================
  // MODELO 7 & 1 & 2: GENERADOR DE ESCALA ARMÓNICA INTEGRADA (GRID 4PX + TRACKING)
  // =========================================================================
  previewEscala() {
    const scaleItems = generateHarmonicScale(this.escalaBase, this.escalaRatio, {
      gridStep: this.baselineGridStep(),
      density: this.layoutDensity(),
      includeFluid: this.enableFluidClamp()
    });

    const nuevasTipografias: TypographyItem[] = scaleItems.map(item => ({
      proyecto_id: this.proyectoId,
      estilo: item.estilo,
      tamano_px: item.tamano_px,
      peso: item.peso,
      interlineado: item.interlineado,
      tipo_fuente: item.tipo_fuente,
      orden: item.orden,
      letter_spacing: item.letter_spacing,
      line_height_px: item.line_height_px
    }));

    this.tipografiasPreview.set(nuevasTipografias);
  }

  guardarEscalaPreview() {
    const preview = this.tipografiasPreview();
    if (preview) {
      this.disenoVisualService.reemplazarTipografias(this.proyectoId, preview).subscribe(() => {
        this.tipografiasPreview.set(null);
      });
    }
  }

  cancelarEscalaPreview() {
    this.tipografiasPreview.set(null);
  }

  // =========================================================================
  // MODELO 6: SCORE MULTIFACTORIAL DE JERARQUÍA EN GUI (0 - 100)
  // =========================================================================
  hierarchyScore = computed<TypographyHierarchyScore>(() => {
    const lista = this.tipografiasPreview() || this.tipografias();
    const cfg = this.config();
    return calculateGuiTypographyScore(
      lista,
      cfg?.fuente_principal || 'Inter',
      cfg?.fuente_secundaria || 'Inter',
      this.escalaBase
    );
  });

  scoreLecturabilidad = computed(() => {
    const h = this.hierarchyScore();
    return {
      score: `Grado ${h.grade} (${h.overallScore}/100)`,
      color: h.gradeBadge,
      mensaje: h.diagnostics[0] || 'Jerarquía balanceada para interfaces gráficas modernas.'
    };
  });

  get estiloH1() {
    return this.getEstiloActivo('H1');
  }

  get estiloBody() {
    return this.getEstiloActivo('Body');
  }

  getEstiloActivo(nombre: string) {
    const lista = this.tipografiasPreview() || this.tipografias();
    return lista?.find((t: any) => t.estilo === nombre);
  }

  // =========================================================================
  // MODELO 1: TRACKING ÓPTICO PARA RENDERIZADO
  // =========================================================================
  getTracking(size: number, weight: string): string {
    return calculateOpticalTracking(size, weight).cssValue;
  }

  // =========================================================================
  // MODELO 2: RITMO VERTICAL A 4PX
  // =========================================================================
  getLineHeightPx(size: number, interlineado?: number): number {
    if (interlineado) {
      return Math.round(size * interlineado);
    }
    return calculateDynamicLineHeight(size, this.baselineGridStep(), this.layoutDensity()).snappedPx;
  }

  // =========================================================================
  // MODELO 5: FRECUENCIA ESPACIAL Y LEGIBILIDAD APCA / SOMERS
  // =========================================================================
  get advertenciaProporciones(): string | null {
    if (!this.editingTypography || !this.editingTypography.tamano_px) return null;
    const size = this.editingTypography.tamano_px;
    const lh = this.editingTypography.interlineado;
    const weight = this.editingTypography.peso || 'Regular (400)';
    const estilo = this.editingTypography.estilo || '';

    const apcaValidation = validateSpatialLegibility(size, weight, estilo);
    if (!apcaValidation.isCompliant && apcaValidation.warnings.length > 0) {
      return apcaValidation.warnings.join(' ') + (apcaValidation.recommendation ? ` Sugerencia: ${apcaValidation.recommendation}` : '');
    }

    // Regla 1: Titulares grandes necesitan interlineado corto
    if (size > 32 && lh && lh > 1.3) {
      return `Los textos grandes (${size}px) se ven desconectados con tanto interlineado (${lh}). Te sugerimos reducirlo a 1.1 o 1.2.`;
    }

    // Regla 2: Textos de párrafo necesitan interlineado amplio
    if (size <= 18 && lh && lh < 1.4) {
      return `Los textos pequeños para lectura requieren más "aire". Un interlineado de ${lh} dificulta la lectura. Sugerido: 1.5 o mayor.`;
    }

    return null;
  }

  // =========================================================================
  // EXPORTACIÓN DE TOKENS
  // =========================================================================
  tokensExport = computed(() => {
    const lista = this.tipografiasPreview() || this.tipografias();
    const cfg = this.config();
    return exportDesignTokens(lista, cfg?.fuente_principal || 'Inter', cfg?.fuente_secundaria || 'Inter', cfg);
  });

  abrirModalTipografia(tipo?: TypographyItem) {
    if (tipo) {
      this.isNewTypography = false;
      this.editingTypography = { ...tipo };
    } else {
      this.isNewTypography = true;
      const lhDefault = calculateDynamicLineHeight(16, this.baselineGridStep(), this.layoutDensity());
      const trackingDefault = calculateOpticalTracking(16, 'Regular (400)');
      this.editingTypography = {
        proyecto_id: this.proyectoId,
        estilo: 'Nuevo Estilo',
        tamano_px: 16,
        peso: 'Regular (400)',
        interlineado: lhDefault.ratio,
        tipo_fuente: 'Principal',
        orden: this.tipografias().length,
        letter_spacing: trackingDefault.trackingEm,
        line_height_px: lhDefault.snappedPx
      };
    }
    this.showTypographyModal = true;
  }

  cerrarModalTipografia() {
    this.showTypographyModal = false;
  }

  guardarTipografia() {
    // Si no tiene line_height_px o letter_spacing, calcularlos automáticamente
    if (this.editingTypography.tamano_px) {
      const size = this.editingTypography.tamano_px;
      const weight = this.editingTypography.peso || 'Regular (400)';
      if (!this.editingTypography.letter_spacing) {
        this.editingTypography.letter_spacing = calculateOpticalTracking(size, weight).trackingEm;
      }
      if (!this.editingTypography.line_height_px && this.editingTypography.interlineado) {
        this.editingTypography.line_height_px = Math.round(size * this.editingTypography.interlineado);
      }
    }

    if (this.isNewTypography) {
      this.disenoVisualService.agregarTipografia(this.editingTypography as TypographyItem).subscribe(() => {
        this.cerrarModalTipografia();
      });
    } else {
      this.disenoVisualService.actualizarTipografia(this.editingTypography as TypographyItem).subscribe(() => {
        this.cerrarModalTipografia();
      });
    }
  }

  eliminarTipografia(id: number | undefined) {
    if (id) {
      this.disenoVisualService.eliminarTipografia(id).subscribe();
    }
  }

  actualizarConfiguracion() {
    const currentConfig = this.config();
    if (currentConfig) {
      this.disenoVisualService.actualizarConfig(currentConfig).subscribe();
    }
  }

  // =========================================================================
  // UI/UX HELPERS: PRESETS, CONVERSIÓN DE PESO Y COPIADO DE CSS
  // =========================================================================
  setPresetTexto(preset: 'pangram' | 'headline' | 'numbers') {
    switch (preset) {
      case 'headline':
        this.textoMuestra = 'Diseño de Interfaces Modernas y Sistemas Escalables';
        break;
      case 'numbers':
        this.textoMuestra = '0123456789 • +34 912 345 678 • $1,280,450.00 USD';
        break;
      case 'pangram':
      default:
        this.textoMuestra = 'El veloz murciélago hindú comía feliz cardillo y kiwi.';
        break;
    }
  }

  getFontWeightNumber(peso: string | undefined): number {
    if (!peso) return 400;
    if (peso.includes('800')) return 800;
    if (peso.includes('700')) return 700;
    if (peso.includes('600')) return 600;
    if (peso.includes('500')) return 500;
    if (peso.includes('300')) return 300;
    return 400;
  }

  copiarTokenCSS(tipo: TypographyItem) {
    const fontFamily = tipo.tipo_fuente === 'Principal'
      ? this.config()?.fuente_principal || 'Inter'
      : this.config()?.fuente_secundaria || 'Inter';
    const tracking = this.getTracking(tipo.tamano_px, tipo.peso);
    const lhPx = this.getLineHeightPx(tipo.tamano_px, tipo.interlineado);
    const weightNum = this.getFontWeightNumber(tipo.peso);
    const remValue = (tipo.tamano_px / this.escalaBase).toFixed(3);

    const cssSnippet = `/* Token Tipográfico: ${tipo.estilo} */\nfont-family: '${fontFamily}', sans-serif;\nfont-size: ${tipo.tamano_px}px; /* ${remValue}rem */\nline-height: ${lhPx}px; /* ratio: ${tipo.interlineado} */\nfont-weight: ${weightNum};\nletter-spacing: ${tracking};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cssSnippet).then(() => {
        const idKey = tipo.id ?? tipo.estilo;
        this.copiedTokenId = idKey;
        setTimeout(() => {
          if (this.copiedTokenId === idKey) {
            this.copiedTokenId = null;
          }
        }, 2200);
      }).catch(err => {
        console.warn('Error al copiar CSS:', err);
      });
    }
  }
}
