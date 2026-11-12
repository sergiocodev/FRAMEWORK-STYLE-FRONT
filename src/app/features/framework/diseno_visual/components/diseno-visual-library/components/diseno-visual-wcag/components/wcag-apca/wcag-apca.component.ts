import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisenoVisualService, ColorItem, TypographyItem } from '../../../../../../services/diseno-visual.service';
import {
  evaluateAPCA,
  auditProjectTypographyTokens,
  ApcaEvaluation,
  ProjectTypographyAuditSummary,
  ApcaFontRequirement,
  TypographyTokenAudit
} from '../../../../../../utils/apca-utils';

export interface ApcaMatrixCell {
  bg: ColorItem;
  fg: ColorItem;
  evaluation: ApcaEvaluation;
  tokenAudit: ProjectTypographyAuditSummary;
}

export interface ApcaMatrixRow {
  fg: ColorItem;
  cells: ApcaMatrixCell[];
}

@Component({
  selector: 'app-wcag-apca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wcag-apca.component.html',
  styleUrls: ['./wcag-apca.component.scss']
})
export class WcagApcaComponent {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  colores = this.disenoVisualService.colores;
  config = this.disenoVisualService.config;
  tipografias = this.disenoVisualService.tipografias;

  // Fuentes reales del proyecto (del Paso 2)
  fuentePrincipal = computed(() => this.config()?.fuente_principal || 'Inter, sans-serif');
  fuenteSecundaria = computed(() => this.config()?.fuente_secundaria || 'Roboto, sans-serif');

  // Filtros y modos de visualización
  mostrarTodasLasCombinaciones = signal<boolean>(false);
  filtroNivel = signal<'todos' | 'fluida' | 'cuerpo' | 'titulos' | 'fallos'>('todos');

  // Estado del Modal de Inspección Tipográfica APCA
  selectedCell = signal<ApcaMatrixCell | null>(null);

  // Matriz de Contraste Reactiva APCA integrada con Tokens del Proyecto
  matrizAPCA = computed(() => {
    const cols: ColorItem[] = this.colores() || [];
    const tokens: TypographyItem[] = this.tipografias() || [];

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

    const filtro = this.filtroNivel();

    const rows: ApcaMatrixRow[] = frentes.map((fg) => {
      const cells: ApcaMatrixCell[] = fondos.map((bg) => {
        const evaluation = evaluateAPCA(fg.hex_code, bg.hex_code);
        const tokenAudit = auditProjectTypographyTokens(tokens, evaluation.absLc);

        return {
          bg,
          fg,
          evaluation,
          tokenAudit
        };
      });

      return { fg, cells };
    });

    let filteredRows = rows;
    if (filtro === 'fluida') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.evaluation.absLc >= 90));
    } else if (filtro === 'cuerpo') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.evaluation.absLc >= 75));
    } else if (filtro === 'titulos') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.evaluation.absLc >= 60));
    } else if (filtro === 'fallos') {
      filteredRows = rows.filter((r) => r.cells.some((c) => c.evaluation.level === 'Fail'));
    }

    return { headers: fondos, rows: filteredRows };
  });

  // Métricas globales APCA
  metricasAPCA = computed(() => {
    const cols = this.colores() || [];
    if (cols.length === 0) {
      return { total: 0, lc90: 0, lc75: 0, lc60: 0, lc45: 0, lc30: 0, fail: 0, porcentajeAprobado: 0 };
    }

    const { rows } = this.matrizAPCA();
    let total = 0;
    let lc90 = 0;
    let lc75 = 0;
    let lc60 = 0;
    let lc45 = 0;
    let lc30 = 0;
    let fail = 0;

    for (const row of rows) {
      for (const cell of row.cells) {
        total++;
        const lvl = cell.evaluation.level;
        if (lvl === 'Lc90') lc90++;
        else if (lvl === 'Lc75') lc75++;
        else if (lvl === 'Lc60') lc60++;
        else if (lvl === 'Lc45') lc45++;
        else if (lvl === 'Lc30') lc30++;
        else fail++;
      }
    }

    const aprobados = lc90 + lc75 + lc60;
    const porcentajeAprobado = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    return {
      total,
      lc90,
      lc75,
      lc60,
      lc45,
      lc30,
      fail,
      porcentajeAprobado
    };
  });

  toggleTodasLasCombinaciones(): void {
    this.mostrarTodasLasCombinaciones.update((v) => !v);
  }

  setFiltro(nuevoFiltro: 'todos' | 'fluida' | 'cuerpo' | 'titulos' | 'fallos'): void {
    this.filtroNivel.set(nuevoFiltro);
  }

  // Modal de Inspección Tipográfica APCA
  abrirInspeccionTipografica(cell: ApcaMatrixCell): void {
    this.selectedCell.set(cell);
  }

  cerrarInspeccionTipografica(): void {
    this.selectedCell.set(null);
  }

  formatSignedLc(lc: number): string {
    return (lc > 0 ? `+${lc.toFixed(1)}` : `${lc.toFixed(1)}`);
  }

  formatPesoDisplay(peso: string, numericWeight: number): string {
    if (!peso) return `w${numericWeight}`;
    const cleanName = peso.replace(/\s*\(\d+\)\s*/g, '').trim();
    return cleanName ? `${cleanName} (w${numericWeight})` : `w${numericWeight}`;
  }
}
