import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DisenoVisualService,
  ColorItem,
  MSSBOAOptimizeRequest,
  MSSBOAOptimizeResponse
} from '../../../../services/diseno-visual.service';
import {
  contrastRatio,
  hexToHsl,
  hslToHex,
  suggestAccessibleColor
} from '../../../../utils/color-utils';

@Component({
  selector: 'app-diseno-visual-colors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-colors.component.html',
  styleUrls: ['./diseno-visual-colors.component.scss']
})
export class DisenoVisualColorsComponent {
  @Input({ required: true }) proyectoId!: number;
  @Input() identidadMarca: any = null;

  private disenoVisualService = inject(DisenoVisualService);
  colores = this.disenoVisualService.colores;

  rolesDisponibles = [
    'Principal', 'Secundario', 'Acento', 'Fondo', 'Superficie',
    'Texto principal', 'Texto secundario', 'Borde', 'Éxito',
    'Advertencia', 'Error', 'Información', 'Personalizado'
  ];

  // Modals state
  showColorModal = false;
  showDeleteModal = false;
  showContrastFixModal = false;
  editingColor: Partial<ColorItem> = {};
  colorToDelete: ColorItem | null = null;
  isNewColor = false;
  colorToFix: ColorItem | null = null;
  suggestedHex: string = '';

  // MSSBOA Optimizer State
  showMssboaModal = false;
  mssboaIsOptimizing = false;
  mssboaBaseHex = '#2563EB';
  mssboaHarmonyType = 'Complementary';
  mssboaHarmonyTypes = [
    { id: 'Complementary', label: 'Complementaria (Equilibrio opuesto)' },
    { id: 'Analogous', label: 'Análoga (Armonía vecina serena)' },
    { id: 'Triadic', label: 'Triádica (3 colores dinámicos)' },
    { id: 'SplitComplementary', label: 'Complementaria Dividida (Contraste fino)' },
    { id: 'Tetradic', label: 'Tetrádica (Doble complementaria rica)' },
    { id: 'Matsuda_V', label: 'Plantilla Matsuda Tipo V (Doble foco)' },
    { id: 'Matsuda_Y', label: 'Plantilla Matsuda Tipo Y (Tríada extendida)' }
  ];
  mssboaThemeMode: string = 'light';
  mssboaWcagTarget: string = 'AA';
  mssboaPopulationSize: number = 30;
  mssboaIterations: number = 50;
  mssboaResult: MSSBOAOptimizeResponse | null = null;
  mssboaApplyMode: 'replace' | 'append' = 'replace';
  mssboaFeedbackMessage: string = '';

  // Color utilities re-exposed for templates
  contrastRatio = contrastRatio;

  // Color CRUD
  abrirModalColor(color?: ColorItem) {
    if (color) {
      this.isNewColor = false;
      this.editingColor = { ...color };
    } else {
      this.isNewColor = true;
      this.editingColor = {
        proyecto_id: this.proyectoId,
        nombre: 'Nuevo Color',
        token_name: 'color.nuevo',
        hex_code: '#000000',
        uso: 'Principal'
      };
    }
    this.showColorModal = true;
  }

  cerrarModalColor() {
    this.showColorModal = false;
    this.editingColor = {};
  }

  guardarColor() {
    if (this.isNewColor) {
      const nuevoColor = { ...this.editingColor, orden: this.colores().length } as ColorItem;
      this.disenoVisualService.agregarColor(nuevoColor).subscribe(() => {
        this.cerrarModalColor();
      });
    } else {
      this.disenoVisualService.actualizarColor(this.editingColor as ColorItem).subscribe(() => {
        this.cerrarModalColor();
      });
    }
  }

  actualizarUsoColor(color: ColorItem) {
    this.disenoVisualService.actualizarColor(color).subscribe();
  }

  abrirModalEliminar(color: ColorItem) {
    this.colorToDelete = color;
    if (this.colorToDelete && !this.colorToDelete.usos_count) {
      this.colorToDelete.usos_count = Math.floor(Math.random() * 5);
    }
    this.showDeleteModal = true;
  }

  cerrarModalEliminar() {
    this.showDeleteModal = false;
    this.colorToDelete = null;
  }

  confirmarEliminarColor() {
    if (this.colorToDelete?.id) {
      this.disenoVisualService.eliminarColor(this.colorToDelete.id).subscribe(() => {
        this.cerrarModalEliminar();
      });
    }
  }

  // --- Validación Estética (Temperatura/Saturación) ---
  promedioSaturacion(): number {
    const cols = this.colores();
    if (!cols || cols.length === 0) return 0;

    let sum = 0;
    let count = 0;
    for (const c of cols) {
      if (
        c.uso === 'Fondo' ||
        c.uso === 'Superficie' ||
        c.hex_code.toUpperCase() === '#FFFFFF' ||
        c.hex_code.toUpperCase() === '#000000'
      ) {
        continue;
      }
      const hsl = hexToHsl(c.hex_code);
      if (hsl) {
        sum += hsl.s;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  get saturacionInconsistente(): { isWarning: boolean; suggestedHex: string; currentSat: number; avgSat: number } {
    if (!this.editingColor || !this.editingColor.hex_code) {
      return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };
    }

    if (this.colores().length < 3) {
      return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };
    }

    const hsl = hexToHsl(this.editingColor.hex_code);
    if (!hsl) {
      return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };
    }

    if (hsl.l > 0.95 || hsl.l < 0.05 || hsl.s < 0.05) {
      return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };
    }

    const avgSat = this.promedioSaturacion();
    const diff = Math.abs(hsl.s - avgSat);
    if (diff > 0.35) {
      const suggestedHex = hslToHex(hsl.h, avgSat, hsl.l);
      return {
        isWarning: true,
        suggestedHex,
        currentSat: Math.round(hsl.s * 100),
        avgSat: Math.round(avgSat * 100)
      };
    }

    return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };
  }

  aplicarSaturacionSugerida() {
    const warn = this.saturacionInconsistente;
    if (warn.isWarning) {
      this.editingColor.hex_code = warn.suggestedHex;
    }
  }

  // --- Simulador UI 60-30-10 ---
  getColorPorRol(uso: string, fallback: string): string {
    const cols = this.colores();
    if (!cols || cols.length === 0) return fallback;
    const clean = (s: string) =>
      (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const target = clean(uso);
    const color = cols.find((c: ColorItem) => clean(c.uso || '') === target);
    return color ? color.hex_code : fallback;
  }

  // --- Contrast Validation & Modals ---
  abrirModalContraste(fg: ColorItem, sugerenciaHex: string) {
    this.colorToFix = fg;
    this.suggestedHex = sugerenciaHex;
    this.showContrastFixModal = true;
  }

  cerrarModalContraste() {
    this.showContrastFixModal = false;
    this.colorToFix = null;
    this.suggestedHex = '';
  }

  sobreescribirColorContraste() {
    if (this.colorToFix && this.suggestedHex) {
      const colorActualizado = { ...this.colorToFix, hex_code: this.suggestedHex };
      this.disenoVisualService.actualizarColor(colorActualizado).subscribe(() => {
        this.cerrarModalContraste();
      });
    }
  }

  guardarComoVarianteContraste() {
    if (this.colorToFix && this.suggestedHex) {
      const nuevoColor: ColorItem = {
        proyecto_id: this.proyectoId,
        nombre: `${this.colorToFix.nombre} (Accesible)`,
        token_name: `${this.colorToFix.token_name || 'color'}.acc`,
        hex_code: this.suggestedHex,
        uso: this.colorToFix.uso,
        orden: this.colores().length
      };
      this.disenoVisualService.agregarColor(nuevoColor).subscribe(() => {
        this.cerrarModalContraste();
      });
    }
  }

  // Computed WCAG Contrast Matrix
  matrizContraste = computed(() => {
    const cols: ColorItem[] = this.colores();

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
      bgColors.length > 0
        ? bgColors
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
      fgColorsRaw.length > 0
        ? fgColorsRaw
        : cols.filter(
            (c) =>
              c.uso !== 'Fondo' &&
              c.uso !== 'Superficie' &&
              !c.nombre.toLowerCase().includes('fondo')
          );

    const frentes = frentesRaw.filter(
      (v, i, a) => a.findIndex((t) => t.hex_code === v.hex_code) === i
    );

    if (frentes.length === 0) {
      frentes.push({
        hex_code: '#0044CC',
        nombre: 'Principal',
        uso: 'Texto principal',
        token_name: 'color.primary'
      } as ColorItem);
    }

    const rows = frentes.map((fg) => {
      const cells = fondos.map((bg) => {
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
          label,
          badgeClass,
          sugerenciaHex
        };
      });
      return { fg, cells };
    });

    return { headers: fondos, rows };
  });

  // --- MSSBOA Optimizer ---
  abrirModalMSSBOA() {
    this.showMssboaModal = true;
    this.mssboaFeedbackMessage = '';

    if (
      this.identidadMarca?.colores &&
      Array.isArray(this.identidadMarca.colores) &&
      this.identidadMarca.colores.length > 0
    ) {
      const brandCol = this.identidadMarca.colores[0];
      this.mssboaBaseHex =
        (typeof brandCol === 'string' ? brandCol : brandCol.hex || brandCol.codigo) || '#2563EB';
    } else {
      const primaryCol = this.colores().find((c: ColorItem) => c.uso === 'Principal');
      this.mssboaBaseHex =
        primaryCol?.hex_code ||
        (this.colores().length > 0 ? this.colores()[0].hex_code : '#2563EB');
    }

    if (!this.mssboaResult) {
      this.ejecutarMSSBOA();
    }
  }

  cerrarModalMSSBOA() {
    this.showMssboaModal = false;
  }

  ejecutarMSSBOA() {
    this.mssboaIsOptimizing = true;
    this.mssboaFeedbackMessage = '';

    const req: MSSBOAOptimizeRequest = {
      base_hex: this.mssboaBaseHex,
      harmony_type: this.mssboaHarmonyType,
      mode: this.mssboaThemeMode,
      wcag_target: this.mssboaWcagTarget,
      population_size: this.mssboaPopulationSize,
      max_iterations: this.mssboaIterations
    };

    this.disenoVisualService.optimizarConMSSBOA(req).subscribe({
      next: (res) => {
        this.mssboaResult = res;
        this.mssboaIsOptimizing = false;
      },
      error: (err) => {
        console.error('Error optimizando paleta con MSSBOA:', err);
        this.mssboaIsOptimizing = false;
        this.mssboaFeedbackMessage = 'Ocurrió un error al ejecutar el algoritmo MSSBOA.';
      }
    });
  }

  aplicarPaletaMSSBOA() {
    if (!this.mssboaResult || !this.mssboaResult.colores) return;

    const nuevosColores: ColorItem[] = this.mssboaResult.colores.map((c, idx) => ({
      proyecto_id: this.proyectoId,
      hex_code: c.hex_code,
      nombre: c.nombre,
      token_name: c.token_name,
      uso: c.uso,
      orden: idx
    }));

    if (this.mssboaApplyMode === 'replace') {
      this.disenoVisualService.reemplazarColoresBatch(this.proyectoId, nuevosColores).subscribe({
        next: () => {
          this.mssboaFeedbackMessage =
            '¡Paleta cromática optimizada con MSSBOA aplicada con éxito al Design System!';
          setTimeout(() => {
            this.cerrarModalMSSBOA();
          }, 1200);
        },
        error: (err) => {
          console.error('Error aplicando paleta MSSBOA:', err);
          this.mssboaFeedbackMessage = 'Error al persistir los colores en el servidor.';
        }
      });
    } else {
      nuevosColores.forEach((col) => {
        this.disenoVisualService.agregarColor(col).subscribe();
      });
      this.mssboaFeedbackMessage = '¡Nuevos tokens optimizados agregados al Design System!';
      setTimeout(() => {
        this.cerrarModalMSSBOA();
      }, 1200);
    }
  }

  onSelectMSSBOABase(hex: string) {
    this.mssboaBaseHex = hex;
    this.ejecutarMSSBOA();
  }
}

