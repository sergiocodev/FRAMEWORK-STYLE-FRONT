import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DisenoVisualService,
  TypographyItem,
  DisenoVisualConfig
} from '../../../../services/diseno-visual.service';

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
  tipografiasPreview = signal<TypographyItem[] | null>(null);

  // Modals state
  showTypographyModal = false;
  isNewTypography = false;
  editingTypography: Partial<TypographyItem> = {};

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
    // Reactively load Google Fonts when config changes
    effect(() => {
      const cfg = this.config();
      if (cfg) {
        this.loadGoogleFont(cfg.fuente_principal);
        this.loadGoogleFont(cfg.fuente_secundaria);
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

  advertenciaTipografica = computed(() => {
    const cfg = this.config();
    if (!cfg || !cfg.fuente_principal || !cfg.fuente_secundaria) return null;

    const principal = cfg.fuente_principal;
    const secundaria = cfg.fuente_secundaria;

    if (principal === secundaria) return null;

    const categorias: Record<string, string> = {
      'Playfair Display': 'Serif', 'Merriweather': 'Serif', 'Lora': 'Serif',
      'Outfit': 'Sans-Serif Geométrica', 'Poppins': 'Sans-Serif Geométrica', 'Montserrat': 'Sans-Serif Geométrica',
      'Raleway': 'Sans-Serif Geométrica', 'Nunito': 'Sans-Serif Geométrica', 'Quicksand': 'Sans-Serif Geométrica',
      'Space Grotesk': 'Sans-Serif Geométrica', 'Rubik': 'Sans-Serif Geométrica',
      'Inter': 'Sans-Serif Neutra', 'Roboto': 'Sans-Serif Neutra', 'Open Sans': 'Sans-Serif Neutra',
      'Lato': 'Sans-Serif Neutra', 'Work Sans': 'Sans-Serif Neutra', 'Fira Sans': 'Sans-Serif Neutra',
      'Karla': 'Sans-Serif Neutra', 'Ubuntu': 'Sans-Serif Neutra',
      'Oswald': 'Display'
    };

    const cat1 = categorias[principal];
    const cat2 = categorias[secundaria];

    if (cat1 && cat2 && cat1 === cat2) {
      if (cat1 === 'Serif') {
        return 'Ambas son fuentes Serif. Es difícil diferenciarlas visualmente. Usa una Serif para títulos y una Sans-Serif para cuerpo, o usa la misma fuente para todo.';
      }
      return `Poco contraste: Mezclar dos fuentes similares (${cat1}) parece un error visual. Para una jerarquía elegante, o usas la misma fuente, o combinas con una categoría distinta.`;
    }

    return null;
  });

  previewEscala() {
    const estilos = [
      { estilo: 'Display', step: 6, peso: 'Bold (700)', interlineado: 1.1, tipo_fuente: 'Principal' },
      { estilo: 'H1', step: 5, peso: 'Bold (700)', interlineado: 1.1, tipo_fuente: 'Principal' },
      { estilo: 'H2', step: 4, peso: 'Bold (700)', interlineado: 1.2, tipo_fuente: 'Principal' },
      { estilo: 'H3', step: 3, peso: 'Semibold (600)', interlineado: 1.2, tipo_fuente: 'Principal' },
      { estilo: 'H4', step: 2, peso: 'Semibold (600)', interlineado: 1.3, tipo_fuente: 'Principal' },
      { estilo: 'H5', step: 1, peso: 'Medium (500)', interlineado: 1.4, tipo_fuente: 'Principal' },
      { estilo: 'Body', step: 0, peso: 'Regular (400)', interlineado: 1.5, tipo_fuente: 'Secundaria' },
      { estilo: 'Small', step: -1, peso: 'Regular (400)', interlineado: 1.5, tipo_fuente: 'Secundaria' }
    ];

    const nuevasTipografias: TypographyItem[] = estilos.map((conf, index) => ({
      proyecto_id: this.proyectoId,
      estilo: conf.estilo,
      tamano_px: Math.round(this.escalaBase * Math.pow(this.escalaRatio, conf.step)),
      peso: conf.peso,
      interlineado: conf.interlineado,
      tipo_fuente: conf.tipo_fuente,
      orden: index
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

  scoreLecturabilidad = computed(() => {
    const h1 = this.estiloH1;
    const body = this.estiloBody;

    if (!h1 || !body) return null;

    const ratio = h1.tamano_px / body.tamano_px;

    if (ratio < 2.0) {
      return { score: 'Pobre', color: 'danger', mensaje: 'Jerarquía plana. Faltan puntos focales claros.' };
    } else if (ratio >= 2.0 && ratio < 2.5) {
      return { score: 'Bueno', color: 'success', mensaje: 'Jerarquía estándar y equilibrada.' };
    } else {
      return {
        score: 'Excelente',
        color: 'primary',
        mensaje: 'Jerarquía agresiva. Tu diseño se verá moderno y espectacular.'
      };
    }
  });

  abrirModalTipografia(tipo?: TypographyItem) {
    if (tipo) {
      this.isNewTypography = false;
      this.editingTypography = { ...tipo };
    } else {
      this.isNewTypography = true;
      this.editingTypography = {
        proyecto_id: this.proyectoId,
        estilo: 'Nuevo Estilo',
        tamano_px: 16,
        peso: 'Regular (400)',
        interlineado: 1.5,
        tipo_fuente: 'Principal',
        orden: this.tipografias().length
      };
    }
    this.showTypographyModal = true;
  }

  cerrarModalTipografia() {
    this.showTypographyModal = false;
  }

  get advertenciaProporciones(): string | null {
    if (!this.editingTypography || !this.editingTypography.tamano_px) return null;
    const size = this.editingTypography.tamano_px;
    const lh = this.editingTypography.interlineado;
    const weight = this.editingTypography.peso;

    // Regla 1: Titulares grandes necesitan interlineado corto
    if (size > 32 && lh && lh > 1.3) {
      return `Los textos grandes (${size}px) se ven desconectados con tanto interlineado (${lh}). Te sugerimos reducirlo a 1.1 o 1.2.`;
    }

    // Regla 2: Textos de párrafo necesitan interlineado amplio
    if (size <= 18 && lh && lh < 1.4) {
      return `Los textos pequeños para lectura requieren más "aire". Un interlineado de ${lh} dificulta la lectura. Sugerido: 1.5 o mayor.`;
    }

    // Regla 3: Pesos muy ligeros en tamaños pequeños
    if (size < 16 && weight && (weight.includes('300') || weight.includes('Light'))) {
      return `Las fuentes delgadas ("Light") en tamaños pequeños (${size}px) son difíciles de leer en pantallas de baja resolución. Sugerimos subir a Regular (400).`;
    }

    // Regla 4: Pesos muy gruesos en textos muy pequeños
    if (size < 14 && weight && (weight.includes('800') || weight.includes('ExtraBold'))) {
      return `El peso "ExtraBold" en textos tan pequeños empastará las letras y reducirá drásticamente la legibilidad.`;
    }

    return null;
  }

  guardarTipografia() {
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
}

