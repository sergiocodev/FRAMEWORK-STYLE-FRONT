import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DisenoVisualService } from '../../services/diseno-visual.service';
import { ICON_LIBRARIES } from '../../utils/icon-libraries';
import { hexToRgb, hexToHsl, hslToHex } from '../../utils/color-utils';

@Component({
  selector: 'app-diseno-visual-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-preview.component.html',
  styleUrls: ['./diseno-visual-preview.component.scss']
})
export class DisenoVisualPreviewComponent implements OnInit {
  private disenoVisualService = inject(DisenoVisualService);
  sanitizer = inject(DomSanitizer);

  colores = this.disenoVisualService.colores;
  tipografias = this.disenoVisualService.tipografias;
  config = this.disenoVisualService.config;
  iconosPersonales = this.disenoVisualService.iconos;

  // View state
  currentView: 'tokens' | 'ui' = 'tokens';
  copiedHex: string | null = null;

  // SaaS Dashboard Interactive States (Elements 01 - 11)
  saasViewportMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  saasShowGridOverlay: boolean = false;
  saasSearchQuery: string = '';
  saasTimeRange: string = '30d';
  saasLiveSync: boolean = true;
  saasActiveNav: 'dashboard' | 'settings' | 'pricing' = 'dashboard';
  saasSelectedFilter: string = 'all';
  saasSelectedBtn: boolean = true;
  saasSelectedInput: boolean = true;
  saasSelectedSwitch: boolean = false;
  saasSelectedBadge: boolean = true;

  // Settings Screen State (FinTech B2B)
  saasSettingsName: string = 'NovaPay Financial Operations Inc.';
  saasSettingsSlug: string = 'novapay-enterprise';
  saasSettingsEmail: string = 'treasury@novapay.io';
  saasSettingsRole: string = 'Jefe de Tesorería & Pagos';
  saasSettingsPhone: string = '+1 (555) 839-2041';
  saasSettingsTaxId: string = 'US-EIN 94-829104';
  saasSettingsBankName: string = 'Silicon Valley Commercial Bank';
  saasSettingsAccountNum: string = 'US89 SVBK 0210 0002 1849 2011';
  saasSettingsCurrency: string = 'USD';
  saasSettingsApiKey: string = 'pk_live_51Msz92KLe901VbXa093';
  saasSettingsWebhookUrl: string = 'https://api.empresa.com/v1/payments/webhook';
  saasSettingsTimezone: string = 'America/New_York (UTC-5)';
  saasSettingsLanguage: string = 'es';
  saasSettingsBio: string = 'Infraestructura empresarial para procesamiento de cobros B2B, transferencias internacionales y liquidación instantánea.';
  saas2FAEnabled: boolean = true;
  saasEmailAlerts: boolean = true;
  saasStrictSSO: boolean = true;
  saasNotifySlack: boolean = true;
  saasNotifyEmail: boolean = true;
  saasNotifySMS: boolean = false;
  saasSettingsSaved: boolean = false;

  // Pricing Screen State
  saasBillingCycle: 'monthly' | 'yearly' = 'yearly';

  setSaasViewport(mode: 'desktop' | 'tablet' | 'mobile') {
    this.saasViewportMode = mode;
  }

  toggleGridOverlay() {
    this.saasShowGridOverlay = !this.saasShowGridOverlay;
  }

  setSaasNav(nav: 'dashboard' | 'settings' | 'pricing') {
    this.saasActiveNav = nav;
  }

  setSaasBilling(cycle: 'monthly' | 'yearly') {
    this.saasBillingCycle = cycle;
  }

  saveSaasSettings() {
    this.saasSettingsSaved = true;
    setTimeout(() => {
      this.saasSettingsSaved = false;
    }, 2500);
  }

  get saasSelectedCount(): number {
    return (this.saasSelectedBtn ? 1 : 0) +
           (this.saasSelectedInput ? 1 : 0) +
           (this.saasSelectedSwitch ? 1 : 0) +
           (this.saasSelectedBadge ? 1 : 0);
  }

  toggleAllSaasRows(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.saasSelectedBtn = checked;
    this.saasSelectedInput = checked;
    this.saasSelectedSwitch = checked;
    this.saasSelectedBadge = checked;
  }

  isAllSaasRowsSelected(): boolean {
    return this.saasSelectedBtn && this.saasSelectedInput && this.saasSelectedSwitch && this.saasSelectedBadge;
  }

  // Interactive Typography Playpen
  customPreviewText: string = 'Tu identidad visual construida con precisión, ritmo y armonía.';
  defaultPreviewText: string = 'Tu identidad visual construida con precisión, ritmo y armonía.';

  // Token Inspector
  selectedColorForInspector: any = null;
  inspectorCopiedKey: string | null = null;

  // Export Modal
  showExportModal: boolean = false;
  exportTab: 'css' | 'tailwind' | 'json' | 'scss' = 'css';
  exportCopied: boolean = false;

  ngOnInit() {}

  // --- View Mode Controls ---
  setView(view: 'tokens' | 'ui') {
    this.currentView = view;
  }

  // --- Spotlight Effect ---
  onCardMouseMove(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    if (card) {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  }

  // --- Copy Hex Utility ---
  copyHex(hex: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(hex);
      this.copiedHex = hex;
      setTimeout(() => {
        if (this.copiedHex === hex) {
          this.copiedHex = null;
        }
      }, 1500);
    }
  }

  // --- Chromatic Ramp Generator (50 to 900) ---
  getRamp(hex: string): { step: number; hex: string }[] {
    const hsl = hexToHsl(hex);
    if (!hsl) return [];

    const steps = [
      { step: 50, l: 0.95 },
      { step: 100, l: 0.89 },
      { step: 200, l: 0.79 },
      { step: 300, l: 0.67 },
      { step: 400, l: 0.55 },
      { step: 500, l: hsl.l },
      { step: 600, l: Math.max(0.06, hsl.l * 0.78) },
      { step: 700, l: Math.max(0.05, hsl.l * 0.60) },
      { step: 800, l: Math.max(0.04, hsl.l * 0.42) },
      { step: 900, l: Math.max(0.03, hsl.l * 0.25) }
    ];

    return steps.map(s => ({
      step: s.step,
      hex: hslToHex(hsl.h, hsl.s, s.l).toUpperCase()
    }));
  }

  // --- Token Inspector Methods ---
  openColorInspector(color: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedColorForInspector = color;
  }

  closeColorInspector() {
    this.selectedColorForInspector = null;
    this.inspectorCopiedKey = null;
  }

  copyInspectorFormat(key: string, value: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(value);
      this.inspectorCopiedKey = key;
      setTimeout(() => {
        if (this.inspectorCopiedKey === key) {
          this.inspectorCopiedKey = null;
        }
      }, 1500);
    }
  }

  getInspectorTokenName(color: any): string {
    const slug = (color.uso || color.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
    return `color.${slug}`;
  }

  getInspectorCssVar(color: any): string {
    const slug = (color.uso || color.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
    return `--color-${slug}: ${color.hex_code};`;
  }

  getInspectorRgb(color: any): string {
    const rgb = hexToRgb(color.hex_code);
    return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : color.hex_code;
  }

  getInspectorHsl(color: any): string {
    const hsl = hexToHsl(color.hex_code);
    return hsl ? `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)` : color.hex_code;
  }

  getInspectorTailwind(color: any): string {
    const slug = (color.uso || color.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
    return `'${slug}': '${color.hex_code}',`;
  }

  getInspectorDtcg(color: any): string {
    return JSON.stringify({
      $value: color.hex_code,
      $type: 'color',
      $description: `Token de color para ${color.uso || color.nombre}`
    }, null, 2);
  }

  // --- Interactive Typography Controls ---
  resetPreviewText() {
    this.customPreviewText = this.defaultPreviewText;
  }

  // --- Export Modal Methods ---
  openExportModal() {
    this.showExportModal = true;
    this.exportCopied = false;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  setExportTab(tab: 'css' | 'tailwind' | 'json' | 'scss') {
    this.exportTab = tab;
    this.exportCopied = false;
  }

  getExportCode(): string {
    switch (this.exportTab) {
      case 'css': return this.generateCssTokens();
      case 'tailwind': return this.generateTailwindTokens();
      case 'json': return this.generateJsonTokens();
      case 'scss': return this.generateScssTokens();
      default: return '';
    }
  }

  copyExportCode() {
    const code = this.getExportCode();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      this.exportCopied = true;
      setTimeout(() => {
        this.exportCopied = false;
      }, 2000);
    }
  }

  generateCssTokens(): string {
    const colors = this.colores() || [];
    const cfg = this.config();
    const primary = this.getColor('Principal', '#2563eb');
    const rgb = hexToRgb(primary) || { r: 37, g: 99, b: 235 };

    let lines = [
      '/* ==========================================================================',
      '   DESIGN TOKENS - CSS VARIABLES',
      '   Auto-generado desde BrandBook Showcase',
      '   ========================================================================== */',
      ':root {',
      '  /* Colores */'
    ];

    colors.forEach((c: any) => {
      const slug = (c.uso || c.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
      lines.push(`  --color-${slug}: ${c.hex_code};`);
    });

    lines.push(`  --color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};`);
    lines.push('');
    lines.push('  /* Tipografía */');
    lines.push(`  --font-family-primary: '${cfg?.fuente_principal || 'Inter'}', sans-serif;`);
    lines.push(`  --font-family-secondary: '${cfg?.fuente_secundaria || 'Inter'}', sans-serif;`);
    lines.push('');
    lines.push('  /* Morfología y Espacio */');
    lines.push(`  --radius-base: ${cfg?.radio_borde_base ?? 8}px;`);
    lines.push(`  --spacing-base: ${cfg?.escala_espaciado_base || 8}px;`);
    lines.push(`  --icon-stroke-width: ${cfg?.grosor_iconos || 1.5}px;`);
    lines.push(`  --grid-columns: ${cfg?.grid_columnas || 12};`);
    lines.push(`  --grid-gutter: ${cfg?.grid_gutter || 16}px;`);
    lines.push('}');

    return lines.join('\n');
  }

  generateTailwindTokens(): string {
    const colors = this.colores() || [];
    const cfg = this.config();

    const colorEntries: string[] = [];
    colors.forEach((c: any) => {
      const slug = (c.uso || c.nombre || 'color').toLowerCase().replace(/\s+/g, '_');
      colorEntries.push(`        '${slug}': '${c.hex_code}'`);
    });

    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorEntries.join(',\n')}
      },
      fontFamily: {
        principal: ['"${cfg?.fuente_principal || 'Inter'}"', 'sans-serif'],
        secundaria: ['"${cfg?.fuente_secundaria || 'Inter'}"', 'sans-serif'],
      },
      borderRadius: {
        base: '${cfg?.radio_borde_base ?? 8}px',
      },
      spacing: {
        base: '${cfg?.escala_espaciado_base || 8}px',
      }
    }
  }
};`;
  }

  generateJsonTokens(): string {
    const colors = this.colores() || [];
    const cfg = this.config();

    const colorObj: any = {};
    colors.forEach((c: any) => {
      const slug = (c.uso || c.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
      colorObj[slug] = {
        $value: c.hex_code,
        $type: 'color',
        $description: c.nombre || c.uso
      };
    });

    const tokens = {
      color: colorObj,
      font: {
        primary: { $value: cfg?.fuente_principal || 'Inter', $type: 'fontFamily' },
        secondary: { $value: cfg?.fuente_secundaria || 'Inter', $type: 'fontFamily' }
      },
      dimension: {
        borderRadiusBase: { $value: `${cfg?.radio_borde_base ?? 8}px`, $type: 'dimension' },
        spacingBase: { $value: `${cfg?.escala_espaciado_base || 8}px`, $type: 'dimension' }
      }
    };

    return JSON.stringify(tokens, null, 2);
  }

  generateScssTokens(): string {
    const colors = this.colores() || [];
    const cfg = this.config();

    let lines = [
      '// SCSS Design Tokens',
      '// BrandBook Design System',
      ''
    ];

    colors.forEach((c: any) => {
      const slug = (c.uso || c.nombre || 'color').toLowerCase().replace(/\s+/g, '-');
      lines.push(`$color-${slug}: ${c.hex_code};`);
    });

    lines.push('');
    lines.push(`$font-principal: '${cfg?.fuente_principal || 'Inter'}', sans-serif;`);
    lines.push(`$font-secundaria: '${cfg?.fuente_secundaria || 'Inter'}', sans-serif;`);
    lines.push(`$radius-base: ${cfg?.radio_borde_base ?? 8}px;`);
    lines.push(`$spacing-base: ${cfg?.escala_espaciado_base || 8}px;`);

    return lines.join('\n');
  }

  // --- Dynamic Icons ---
  get currentLibraryIcons(): { name: string; token: string; svg: SafeHtml }[] {
    const config = this.config();
    const libName = config?.libreria_iconos || 'Lucide Icons';
    const lib = ICON_LIBRARIES[libName] || ICON_LIBRARIES['Lucide Icons'];
    const estilo = (config?.estilo_iconos || 'Lineal').toLowerCase();

    return (lib.icons || []).map(icon => {
      const rawSvg = estilo === 'relleno' ? icon.svgRelleno : icon.svgLineal;
      return {
        name: icon.name,
        token: icon.token,
        svg: this.sanitizer.bypassSecurityTrustHtml(rawSvg)
      };
    });
  }

  customIconsSafe = computed(() => {
    const estilo = (this.config()?.estilo_iconos || 'Lineal').toLowerCase();

    return (this.iconosPersonales() || []).map((icon: any) => {
      let rawSvg = icon.svg_content;

      const cleanName = (icon.nombre || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
      const cleanToken = (icon.token_name || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');

      let match: any = null;
      for (const lib of Object.values(ICON_LIBRARIES)) {
        if (!lib.icons) continue;
        const f = lib.icons.find(i =>
          i.name.toLowerCase() === cleanName ||
          i.token.toLowerCase() === cleanToken ||
          `icon.${cleanName}` === i.token.toLowerCase()
        );
        if (f) {
          match = f;
          break;
        }
      }

      if (match) {
        rawSvg = estilo === 'relleno' ? match.svgRelleno : match.svgLineal;
      } else if (estilo === 'relleno' && rawSvg.includes('fill="none"')) {
        rawSvg = rawSvg.replace(/fill="none"/g, 'fill="currentColor"');
      }

      return {
        ...icon,
        rawSvg,
        safeSvg: this.sanitizer.bypassSecurityTrustHtml(rawSvg)
      };
    });
  });

  get arrayColumnas() {
    const columnas = this.config()?.grid_columnas || 12;
    return new Array(columnas);
  }

  get escalaEspaciado() {
    const base = this.config()?.escala_espaciado_base || 8;
    return [
      { token: 'xs', mult: 0.5, valor: Math.round(base * 0.5) },
      { token: 'sm', mult: 1, valor: base },
      { token: 'md', mult: 2, valor: Math.round(base * 2) },
      { token: 'lg', mult: 3, valor: Math.round(base * 3) },
      { token: 'xl', mult: 4, valor: Math.round(base * 4) }
    ];
  }

  getColor(uso: string, fallback: string): string {
    const cols = this.colores();
    if (!cols || !cols.length) return fallback;
    const lower = (uso || '').toLowerCase();
    const color = cols.find((c: any) =>
      (c.uso || '').toLowerCase() === lower ||
      (c.nombre || '').toLowerCase() === lower
    );
    return color ? color.hex_code : fallback;
  }

  getTipografia(estilo: string) {
    const tipos = this.tipografias();
    if (!tipos) return null;
    return tipos.find((t: any) => t.estilo === estilo);
  }

  get coloresPersonalizados(): any[] {
    const cols = this.colores() || [];
    return cols.filter((c: any) => (c.uso || '').toLowerCase() === 'personalizado');
  }

  get previewStyles() {
    const cfg = this.config();
    const primaryHex = this.getColor('Principal', '#2563eb');
    const primaryRgb = hexToRgb(primaryHex) || { r: 37, g: 99, b: 235 };
    const secondaryHex = this.getColor('Secundario', '#475569');
    const secondaryRgb = hexToRgb(secondaryHex) || { r: 71, g: 85, b: 105 };
    const accentHex = this.getColor('Acento', '#3b82f6');
    const accentRgb = hexToRgb(accentHex) || { r: 59, g: 130, b: 246 };
    const successHex = this.getColor('Éxito', '#10b981');
    const successRgb = hexToRgb(successHex) || { r: 16, g: 185, b: 129 };
    const warningHex = this.getColor('Advertencia', '#f59e0b');
    const warningRgb = hexToRgb(warningHex) || { r: 245, g: 158, b: 11 };
    const errorHex = this.getColor('Error', '#ef4444');
    const errorRgb = hexToRgb(errorHex) || { r: 239, g: 68, b: 68 };
    const infoHex = this.getColor('Información', '#0284c7');
    const infoRgb = hexToRgb(infoHex) || { r: 2, g: 132, b: 199 };
    const borderHex = this.getColor('Borde', '#e2e8f0');
    const borderRgb = hexToRgb(borderHex) || { r: 226, g: 232, b: 240 };
    const baseSpacing = cfg?.escala_espaciado_base || 8;
    const gridGutter = cfg?.grid_gutter || 16;
    const gridColumns = cfg?.grid_columnas || 12;
    const kpiColSpan = Math.max(1, Math.floor(gridColumns / 4));
    const halfColSpan = Math.max(1, Math.floor(gridColumns / 2));

    return {
      '--preview-font-primary': `'${cfg?.fuente_principal || 'Inter'}', sans-serif`,
      '--preview-font-secondary': `'${cfg?.fuente_secundaria || 'Inter'}', sans-serif`,
      '--preview-radius-base': `${cfg?.radio_borde_base ?? 8}px`,
      '--preview-spacing-base': `${baseSpacing}px`,
      '--preview-spacing-xs': `${Math.round(baseSpacing * 0.5)}px`,
      '--preview-spacing-sm': `${baseSpacing}px`,
      '--preview-spacing-md': `${Math.round(baseSpacing * 2)}px`,
      '--preview-spacing-lg': `${Math.round(baseSpacing * 3)}px`,
      '--preview-spacing-xl': `${Math.round(baseSpacing * 4)}px`,
      '--preview-grid-gutter': `${gridGutter}px`,
      '--preview-grid-columns': `${gridColumns}`,
      '--preview-kpi-col-span': `${kpiColSpan}`,
      '--preview-half-col-span': `${halfColSpan}`,
      '--preview-icon-stroke': `${cfg?.grosor_iconos || 1.5}px`,
      '--preview-primary-color': primaryHex,
      '--preview-primary-rgb': `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      '--preview-secondary-color': secondaryHex,
      '--preview-secondary-rgb': `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`,
      '--preview-accent-color': accentHex,
      '--preview-accent-rgb': `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
      '--preview-bg-color': this.getColor('Fondo', '#f8fafc'),
      '--preview-surface-color': this.getColor('Superficie', '#ffffff'),
      '--preview-border-color': borderHex,
      '--preview-border-rgb': `${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}`,
      '--preview-text-color': this.getColor('Texto principal', '#0f172a'),
      '--preview-text-secondary-color': this.getColor('Texto secundario', '#64748b'),
      '--preview-success-color': successHex,
      '--preview-success-rgb': `${successRgb.r}, ${successRgb.g}, ${successRgb.b}`,
      '--preview-warning-color': warningHex,
      '--preview-warning-rgb': `${warningRgb.r}, ${warningRgb.g}, ${warningRgb.b}`,
      '--preview-error-color': errorHex,
      '--preview-error-rgb': `${errorRgb.r}, ${errorRgb.g}, ${errorRgb.b}`,
      '--preview-info-color': infoHex,
      '--preview-info-rgb': `${infoRgb.r}, ${infoRgb.g}, ${infoRgb.b}`,
      'font-family': `var(--preview-font-secondary)`,
      'background-color': 'var(--preview-bg-color)',
      'color': 'var(--preview-text-color)',
      'border-radius': `var(--preview-radius-base)`
    };
  }

  get fuentes() {
    const cfg = this.config();
    return {
      principal: cfg?.fuente_principal || 'Inter',
      secundaria: cfg?.fuente_secundaria || 'Inter'
    };
  }

  get halfRadius(): number {
    return Math.round((this.config()?.radio_borde_base ?? 8) / 2) || 4;
  }

  getFontWeightValue(pesoString: string | undefined): number {
    if (!pesoString) return 400;
    if (pesoString.includes('800')) return 800;
    if (pesoString.includes('700')) return 700;
    if (pesoString.includes('600')) return 600;
    if (pesoString.includes('500')) return 500;
    if (pesoString.includes('300')) return 300;
    return 400;
  }

  getPesoDisplay(peso: string | undefined): string {
    if (!peso) return '400';
    const parts = peso.split(' ');
    return parts[0] || peso;
  }
}
