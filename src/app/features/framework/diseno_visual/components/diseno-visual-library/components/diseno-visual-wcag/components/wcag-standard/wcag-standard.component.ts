import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisenoVisualService, ColorItem } from '../../../../../../services/diseno-visual.service';
import { contrastRatio, suggestAccessibleColor } from '../../../../../../utils/color-utils';

export interface WcagMatrixCell {
  bg: ColorItem;
  ratio: string;
  ratioNum: number;
  label: string;
  badgeClass: string;
  sugerenciaHex: string | null;
}

export interface WcagMatrixRow {
  fg: ColorItem;
  cells: WcagMatrixCell[];
}

@Component({
  selector: 'app-wcag-standard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wcag-standard.component.html',
  styleUrls: ['./wcag-standard.component.scss']
})
export class WcagStandardComponent {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  colores = this.disenoVisualService.colores;

  contrastRatio = contrastRatio;

  // Filtros y modos de visualización
  mostrarTodasLasCombinaciones = signal<boolean>(false);
  filtroEstado = signal<'todos' | 'aprobados' | 'fallos'>('todos');

  // Estado del Modal de Corrección
  showContrastFixModal = false;
  colorToFix: ColorItem | null = null;
  suggestedHex = '';

  // Matriz de Contraste Reactiva WCAG 2.1
  matrizContraste = computed(() => {
    const cols: ColorItem[] = this.colores() || [];

    if (cols.length === 0) {
      return { headers: [], rows: [] };
    }

    const bgColors = cols.filter(
      (c) => c.uso === 'Fondo' || c.uso === 'Superficie' || c.nombre.toLowerCase().includes('fondo')
    );
    const fgColorsRaw = cols.filter(
      (c) =>
        c.uso.includes('Texto') ||
        c.uso === 'Principal' ||
        c.uso === 'Secundario' ||
        c.uso === 'Acento' ||
        c.uso === 'Éxito' ||
        c.uso === 'Advertencia' ||
        c.uso === 'Error' ||
        c.uso === 'Información'
    );

    const fondos =
      bgColors.length > 0 && !this.mostrarTodasLasCombinaciones()
        ? bgColors
        : this.mostrarTodasLasCombinaciones()
        ? cols
        : [
            {
              hex_code: '#FFFFFF',
              nombre: 'Fondo Blanco',
              uso: 'Fondo',
              token_name: 'color.bg',
              proyecto_id: this.proyectoId
            } as ColorItem
          ];

    const frentesRaw =
      fgColorsRaw.length > 0 && !this.mostrarTodasLasCombinaciones()
        ? fgColorsRaw
        : cols;

    const frentes = frentesRaw.filter(
      (v, i, a) => a.findIndex((t) => t.hex_code.toLowerCase() === v.hex_code.toLowerCase()) === i
    );

    if (frentes.length === 0) {
      frentes.push({
        hex_code: '#0044CC',
        nombre: 'Principal',
        uso: 'Texto principal',
        token_name: 'color.primary'
      } as ColorItem);
    }

    const filtro = this.filtroEstado();

    const rows: WcagMatrixRow[] = frentes.map((fg) => {
      const cells: WcagMatrixCell[] = fondos.map((bg) => {
        const ratio = contrastRatio(fg.hex_code, bg.hex_code);
        const aa_normal = ratio >= 4.5;
        const aaa_normal = ratio >= 7.0;
        const aa_large = ratio >= 3.0;

        let label = 'Fail';
        let badgeClass = 'bg-danger text-white border border-danger';

        if (aaa_normal) {
          label = 'AAA';
          badgeClass = 'bg-success text-white border border-success';
        } else if (aa_normal) {
          label = 'AA';
          badgeClass = 'bg-success bg-opacity-75 text-white border border-success';
        } else if (aa_large) {
          label = 'AA 18pt+';
          badgeClass = 'bg-warning text-dark border border-warning';
        }

        let sugerenciaHex = null;
        if (!aa_normal) {
          sugerenciaHex = suggestAccessibleColor(fg.hex_code, bg.hex_code, 4.5);
        }

        return {
          bg,
          ratio: ratio.toFixed(2),
          ratioNum: ratio,
          label,
          badgeClass,
          sugerenciaHex
        };
      });

      return { fg, cells };
    });

    let filteredRows = rows;
    if (filtro === 'aprobados') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.ratioNum >= 4.5));
    } else if (filtro === 'fallos') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.ratioNum < 4.5));
    }

    return { headers: fondos, rows: filteredRows };
  });

  // Métricas globales de la paleta bajo WCAG 2.1
  metricasWCAG = computed(() => {
    const cols = this.colores() || [];
    if (cols.length === 0) {
      return { total: 0, aaa: 0, aa: 0, aaLarge: 0, fail: 0, porcentajeAprobado: 0 };
    }

    const { rows } = this.matrizContraste();
    let total = 0;
    let aaa = 0;
    let aa = 0;
    let aaLarge = 0;
    let fail = 0;

    for (const row of rows) {
      for (const cell of row.cells) {
        total++;
        if (cell.label === 'AAA') aaa++;
        else if (cell.label === 'AA') aa++;
        else if (cell.label === 'AA 18pt+') aaLarge++;
        else fail++;
      }
    }

    const aprobados = aaa + aa;
    const porcentajeAprobado = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    return {
      total,
      aaa,
      aa,
      aaLarge,
      fail,
      porcentajeAprobado
    };
  });

  toggleTodasLasCombinaciones(): void {
    this.mostrarTodasLasCombinaciones.update((v) => !v);
  }

  setFiltro(nuevoFiltro: 'todos' | 'aprobados' | 'fallos'): void {
    this.filtroEstado.set(nuevoFiltro);
  }

  // Modal de Corrección de Contraste
  abrirModalContraste(fg: ColorItem, sugerenciaHex: string): void {
    this.colorToFix = fg;
    this.suggestedHex = sugerenciaHex;
    this.showContrastFixModal = true;
  }

  cerrarModalContraste(): void {
    this.showContrastFixModal = false;
    this.colorToFix = null;
    this.suggestedHex = '';
  }

  sobreescribirColorContraste(): void {
    if (this.colorToFix && this.suggestedHex) {
      const colorActualizado = { ...this.colorToFix, hex_code: this.suggestedHex };
      this.disenoVisualService.actualizarColor(colorActualizado).subscribe(() => {
        this.cerrarModalContraste();
      });
    }
  }

  guardarComoVarianteContraste(): void {
    if (this.colorToFix && this.suggestedHex) {
      const nuevoColor: ColorItem = {
        proyecto_id: this.proyectoId,
        nombre: `${this.colorToFix.nombre} (Accesible)`,
        token_name: `${this.colorToFix.token_name || 'color'}.acc`,
        hex_code: this.suggestedHex,
        uso: this.colorToFix.uso,
        orden: (this.colores() || []).length
      };
      this.disenoVisualService.agregarColor(nuevoColor).subscribe(() => {
        this.cerrarModalContraste();
      });
    }
  }
}
