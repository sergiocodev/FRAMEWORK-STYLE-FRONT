import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DisenoVisualService } from '../../services/diseno-visual.service';

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

  LIBRERIA_PREVIEWS: Record<string, { name: string, token: string, svg: SafeHtml }> = {};

  constructor() {
    this.LIBRERIA_PREVIEWS = {
      'Bootstrap Icons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.293l6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/><path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>') },
        { name: 'settings', token: 'icon.settings', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>') }
      ],
      'Lucide Icons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>') },
        { name: 'settings', token: 'icon.settings', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>') }
      ],
      'Heroicons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>') }
      ]
    } as any;
  }

  get currentLibraryIcons(): any {
    const config = this.config();
    if (!config || !config.libreria_iconos) {
      return this.LIBRERIA_PREVIEWS['Bootstrap Icons'];
    }
    return this.LIBRERIA_PREVIEWS[config.libreria_iconos] || this.LIBRERIA_PREVIEWS['Bootstrap Icons'];
  }

  customIconsSafe = computed(() => {
    return (this.iconosPersonales() || []).map((icon: any) => ({
      ...icon,
      safeSvg: this.sanitizer.bypassSecurityTrustHtml(icon.svg_content)
    }));
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
