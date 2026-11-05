import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DisenoVisualService } from '../../services/diseno-visual.service';
import { ICON_LIBRARIES } from '../../utils/icon-libraries';

@Component({
  selector: 'app-diseno-visual-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diseno-visual-preview.component.html',
  styleUrls: ['./diseno-visual-preview.component.scss']
})
export class DisenoVisualPreviewComponent {
  private disenoVisualService = inject(DisenoVisualService);
  sanitizer = inject(DomSanitizer);

  colores = this.disenoVisualService.colores;
  tipografias = this.disenoVisualService.tipografias;
  config = this.disenoVisualService.config;
  iconosPersonales = this.disenoVisualService.iconos;

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

      // Buscar si existe en el catálogo de librerías locales para variantes Lineal / Relleno
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
    if (!cols) return fallback;
    const color = cols.find((c: any) => c.uso === uso);
    return color ? color.hex_code : fallback;
  }

  getTipografia(estilo: string) {
    const tipos = this.tipografias();
    if (!tipos) return null;
    return tipos.find((t: any) => t.estilo === estilo);
  }

  get previewStyles() {
    const cfg = this.config();
    if (!cfg) return {};
    
    return {
      '--preview-font-primary': `'${cfg.fuente_principal}', sans-serif`,
      '--preview-font-secondary': `'${cfg.fuente_secundaria}', sans-serif`,
      '--preview-radius-base': `${cfg.radio_borde_base}px`,
      '--preview-spacing-base': `${cfg.escala_espaciado_base}px`,
      '--preview-icon-stroke': `${cfg.grosor_iconos || 1.5}px`,
      '--preview-primary-color': this.getColor('Principal', '#2563eb'),
      '--preview-secondary-color': this.getColor('Secundario', '#4b5563'),
      '--preview-accent-color': this.getColor('Acento', '#3b82f6'),
      '--preview-bg-color': this.getColor('Fondo', '#f3f4f6'),
      '--preview-surface-color': this.getColor('Superficie', '#ffffff'),
      '--preview-text-color': this.getColor('Texto principal', '#1f2937'),
      '--preview-text-secondary-color': this.getColor('Texto secundario', '#6b7280'),
      '--preview-success-color': this.getColor('Éxito', '#10b981'),
      '--preview-warning-color': this.getColor('Advertencia', '#f59e0b'),
      '--preview-error-color': this.getColor('Error', '#ef4444'),
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

  get halfRadius() {
    const r = this.config()?.radio_borde_base;
    return typeof r === 'number' ? r / 2 : 4;
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
}
