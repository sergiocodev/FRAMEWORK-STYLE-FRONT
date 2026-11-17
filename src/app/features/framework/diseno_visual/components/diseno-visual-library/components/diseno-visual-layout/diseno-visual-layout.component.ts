import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisenoVisualService } from '../../../../services/diseno-visual.service';

@Component({
  selector: 'app-diseno-visual-layout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-layout.component.html',
  styleUrls: ['./diseno-visual-layout.component.scss']
})
export class DisenoVisualLayoutComponent {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  config = this.disenoVisualService.config;

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

  resetearEscalaEspaciado() {
    const cfg = this.config();
    if (cfg) {
      cfg.escala_espaciado_base = 8;
      this.actualizarConfiguracion();
    }
  }

  get arrayColumnas() {
    const columnas = this.config()?.grid_columnas || 12;
    return new Array(columnas);
  }

  aplicarProporcionAurea() {
    const cfg = this.config();
    if (cfg) {
      cfg.grid_columnas = 8;
      cfg.grid_gutter = 24;
      cfg.escala_espaciado_base = 16;
      this.actualizarConfiguracion();
    }
  }

  aplicarReglaTercios() {
    const cfg = this.config();
    if (cfg) {
      cfg.grid_columnas = 12;
      cfg.grid_gutter = 16;
      cfg.escala_espaciado_base = 8;
      this.actualizarConfiguracion();
    }
  }

  get advertenciaSistemaOchoPuntos(): string | null {
    const cfg = this.config();
    if (!cfg) return null;

    const espaciado = cfg.escala_espaciado_base;
    const radio = cfg.radio_borde_base;

    if (espaciado && espaciado % 4 !== 0) {
      const sugerido = Math.round(espaciado / 4) * 4 || 4;
      return `El espaciado base de ${espaciado}px no es múltiplo de 4 u 8. Esto puede romper el ritmo vertical de la UI. Sugerimos ajustarlo a ${sugerido}px.`;
    }

    if (radio !== 0 && radio !== 999 && radio % 4 !== 0) {
      const sugerido = Math.round(radio / 4) * 4 || 4;
      return `El radio de borde de ${radio}px no sigue el sistema de 8 puntos. Sugerimos ajustarlo a ${sugerido}px para mayor simetría visual.`;
    }

    return null;
  }

  get scoreDensidadVisual() {
    const cfg = this.config();
    if (!cfg) return null;

    const espaciado = cfg.escala_espaciado_base;
    const gutter = cfg.grid_gutter;

    if (!espaciado || !gutter) return null;

    if (espaciado <= 4 || (espaciado <= 8 && gutter < 16)) {
      return {
        nivel: 'Compacta',
        color: 'primary',
        icono: 'bi-grid-3x3-gap-fill',
        mensaje: 'Alta densidad. Ideal para dashboards complejos o tablas de datos.'
      };
    } else if (espaciado >= 12 || gutter >= 24) {
      return {
        nivel: 'Relajada',
        color: 'info',
        icono: 'bi-wind',
        mensaje: 'Baja densidad. Ideal para landing pages o diseño editorial.'
      };
    } else {
      return {
        nivel: 'Equilibrada',
        color: 'success',
        icono: 'bi-layout-text-window-reverse',
        mensaje: 'Densidad estándar. Perfecta para aplicaciones web generales.'
      };
    }
  }

  get advertenciaArmoniaEstilistica() {
    const cfg = this.config();
    if (!cfg) return null;

    const fuente = cfg.fuente_principal;
    const radio = cfg.radio_borde_base;

    if (!fuente || radio === undefined || radio === null) return null;

    const serifFonts = ['Playfair Display', 'Merriweather', 'Lora'];
    const displayFonts = ['Oswald'];
    const geometricFonts = ['Nunito', 'Quicksand', 'Outfit', 'Rubik', 'Poppins'];

    if (serifFonts.includes(fuente) && radio >= 16) {
      return {
        tipo: 'warning',
        icono: 'bi-exclamation-triangle-fill',
        mensaje: `La fuente ${fuente} es formal, pero los bordes extremadamente redondeados (${radio}px) son lúdicos. Sugerimos bordes rectos (0px) o muy sutiles (4px).`
      };
    }

    if (displayFonts.includes(fuente) && radio >= 16) {
      return {
        tipo: 'warning',
        icono: 'bi-exclamation-triangle-fill',
        mensaje: `La fuente ${fuente} es fuerte e industrial, los bordes circulares chocan con su seriedad. Sugerimos un radio menor a 8px.`
      };
    }

    if (geometricFonts.includes(fuente) && radio === 0) {
      return {
        tipo: 'info',
        icono: 'bi-info-circle-fill',
        mensaje: `La fuente ${fuente} es geométrica y amigable. Usar bordes 100% rectos (0px) puede sentirse rígido. Un radio de 8px complementaría mejor su estilo.`
      };
    }

    return null;
  }

  actualizarConfiguracion() {
    const currentConfig = this.config();
    if (currentConfig) {
      this.disenoVisualService.actualizarConfig(currentConfig).subscribe();
    }
  }
}

