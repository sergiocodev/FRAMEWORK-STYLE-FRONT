import { Component, OnInit, computed, effect, inject, signal, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisenoVisualService, ColorItem, TypographyItem, DisenoVisualConfig } from '../../services/diseno-visual.service';

@Component({
  selector: 'app-diseno-visual-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-library.component.html',
  styleUrls: ['./diseno-visual-library.component.scss']
})
export class DisenoVisualLibraryComponent implements OnInit {
  @Input() proyectoId!: number;

  colores: any;
  tipografias: any;
  tipografiasPreview = signal<TypographyItem[] | null>(null);
  config: any;
  iconosPersonales: any;

  LIBRERIA_PREVIEWS: Record<string, { name: string, token: string, svg: SafeHtml }[]> = {};

  rolesDisponibles = [
    'Principal', 'Secundario', 'Acento', 'Fondo', 'Superficie',
    'Texto principal', 'Texto secundario', 'Borde', 'Éxito',
    'Advertencia', 'Error', 'Información', 'Personalizado'
  ];

  // Modals state
  showColorModal = false;
  showDeleteModal = false;
  showTypographyModal = false;
  showContrastFixModal = false;
  editingColor: Partial<ColorItem> = {};
  editingTypography: Partial<TypographyItem> = {};
  colorToDelete: ColorItem | null = null;
  isNewColor = false;
  isNewTypography = false;
  colorToFix: ColorItem | null = null;
  suggestedHex: string = '';

  // Harmony Generator state
  showHarmonyModal = false;
  harmonyBaseColor: ColorItem | null = null;
  harmonyType: string = 'Analogous';
  harmonyTypes = ['Analogous', 'Complementary', 'Triadic', 'Monochromatic', 'TonalScale'];
  harmonyPreview: { hex: string, role: string }[] = [];

  sanitizer = inject(DomSanitizer);
  uploadedIcons: { name: string, token: string, svg: SafeHtml }[] = [];

  constructor(private disenoVisualService: DisenoVisualService) {
    this.colores = this.disenoVisualService.colores;
    this.tipografias = this.disenoVisualService.tipografias;
    this.config = this.disenoVisualService.config;
    this.iconosPersonales = this.disenoVisualService.iconos;

    this.initStaticIcons();

    // Reactively load Google Fonts when config changes
    effect(() => {
      const cfg = this.config();
      if (cfg) {
        this.loadGoogleFont(cfg.fuente_principal);
        this.loadGoogleFont(cfg.fuente_secundaria);
      }
    });
  }

  initStaticIcons() {
    this.LIBRERIA_PREVIEWS = {
      'Bootstrap Icons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.293l6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/><path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>') },
        { name: 'search', token: 'icon.search', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') },
        { name: 'bell', token: 'icon.bell', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>') },
        { name: 'settings', token: 'icon.settings', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a1.873 1.873 0 0 0-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>') }
      ],
      'Lucide Icons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>') },
        { name: 'search', token: 'icon.search', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>') },
        { name: 'bell', token: 'icon.bell', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>') },
        { name: 'settings', token: 'icon.settings', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>') }
      ],
      'Heroicons': [
        { name: 'home', token: 'icon.home', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>') },
        { name: 'user', token: 'icon.user', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>') },
        { name: 'search', token: 'icon.search', svg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>') },
      ]
    };
  }

  getPreviewKeys() {
    return Object.keys(this.LIBRERIA_PREVIEWS).join(', ');
  }

  get currentLibraryIcons() {
    const config = this.config();
    if (!config || !config.libreria_iconos) {
      return this.LIBRERIA_PREVIEWS['Bootstrap Icons'];
    }
    const icons = this.LIBRERIA_PREVIEWS[config.libreria_iconos] || this.LIBRERIA_PREVIEWS['Bootstrap Icons'];
    return icons;
  }

  customIconsSafe = computed(() => {
    return this.iconosPersonales().map((icon: any) => ({
      ...icon,
      safeSvg: this.sanitizer.bypassSecurityTrustHtml(icon.svg_content)
    }));
  });

  advertenciaTipografica = computed(() => {
    const cfg = this.config();
    if (!cfg || !cfg.fuente_principal || !cfg.fuente_secundaria) return null;

    const principal = cfg.fuente_principal;
    const secundaria = cfg.fuente_secundaria;

    if (principal === secundaria) return null;

    const categorias: Record<string, string> = {
      'Playfair Display': 'Serif', 'Merriweather': 'Serif', 'Lora': 'Serif',
      'Outfit': 'Sans-Serif Geométrica', 'Poppins': 'Sans-Serif Geométrica', 'Montserrat': 'Sans-Serif Geométrica', 'Raleway': 'Sans-Serif Geométrica', 'Nunito': 'Sans-Serif Geométrica', 'Quicksand': 'Sans-Serif Geométrica', 'Space Grotesk': 'Sans-Serif Geométrica', 'Rubik': 'Sans-Serif Geométrica',
      'Inter': 'Sans-Serif Neutra', 'Roboto': 'Sans-Serif Neutra', 'Open Sans': 'Sans-Serif Neutra', 'Lato': 'Sans-Serif Neutra', 'Work Sans': 'Sans-Serif Neutra', 'Fira Sans': 'Sans-Serif Neutra', 'Karla': 'Sans-Serif Neutra', 'Ubuntu': 'Sans-Serif Neutra',
      'Oswald': 'Display'
    };

    const cat1 = categorias[principal];
    const cat2 = categorias[secundaria];

    if (cat1 && cat2 && cat1 === cat2) {
      if (cat1 === 'Serif') {
        return "Ambas son fuentes Serif. Es difícil diferenciarlas visualmente. Usa una Serif para títulos y una Sans-Serif para cuerpo, o usa la misma fuente para todo.";
      }
      return `Poco contraste: Mezclar dos fuentes similares (${cat1}) parece un error visual. Para una jerarquía elegante, o usas la misma fuente, o combinas con una categoría distinta.`;
    }

    return null;
  });

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

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.disenoVisualService.cargarDisenoVisualCompleto(this.proyectoId).subscribe();
  }

  // Color Management
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

  // --- Validación Estética (Temperatura/Saturación) ---
  promedioSaturacion() {
    const cols = this.colores();
    if (!cols || cols.length === 0) return 0;

    let sum = 0;
    let count = 0;
    for (const c of cols) {
      if (c.uso === 'Fondo' || c.uso === 'Superficie' || c.hex_code.toUpperCase() === '#FFFFFF' || c.hex_code.toUpperCase() === '#000000') {
        continue; // Ignoramos fondos o blancos/negros puros para calcular el promedio estético de los colores
      }
      const hsl = this.hexToHsl(c.hex_code);
      if (hsl) {
        sum += hsl.s;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  get saturacionInconsistente(): { isWarning: boolean, suggestedHex: string, currentSat: number, avgSat: number } {
    if (!this.editingColor || !this.editingColor.hex_code) return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };

    // Solo validamos si ya hay suficientes colores en la paleta para establecer un "estilo"
    if (this.colores().length < 3) return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };

    const hsl = this.hexToHsl(this.editingColor.hex_code);
    if (!hsl) return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };

    // No validamos colores neutros (blancos, negros, grises puros) porque la saturación no importa mucho ahí
    if (hsl.l > 0.95 || hsl.l < 0.05 || hsl.s < 0.05) return { isWarning: false, suggestedHex: '', currentSat: 0, avgSat: 0 };

    const avgSat = this.promedioSaturacion();

    // Si la diferencia de saturación es mayor al 35%, se considera inconsistente estéticamente
    const diff = Math.abs(hsl.s - avgSat);
    if (diff > 0.35) {
      // Sugerimos el mismo color pero con la saturación promedio de la paleta
      const suggestedHex = this.hslToHex(hsl.h, avgSat, hsl.l);
      return { isWarning: true, suggestedHex, currentSat: Math.round(hsl.s * 100), avgSat: Math.round(avgSat * 100) };
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
    const color = this.colores().find((c: ColorItem) => c.uso === uso);
    return color ? color.hex_code : fallback;
  }

  actualizarUsoColor(color: ColorItem) {
    this.disenoVisualService.actualizarColor(color).subscribe();
  }

  abrirModalEliminar(color: ColorItem) {
    this.colorToDelete = color;
    // Mocking usos_count just for the UI showcase
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

  eliminarIcono(id: number) {
    this.disenoVisualService.eliminarIcono(id).subscribe();
  }

  onIconUpload(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) continue;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        let svgContent = e.target.result as string;

        // Limpiador Inteligente de SVGs usando DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');

        if (svgEl) {
          // Estandarizar dimensiones principales
          svgEl.setAttribute('width', '20');
          svgEl.setAttribute('height', '20');
          if (!svgEl.hasAttribute('viewBox')) {
            svgEl.setAttribute('viewBox', '0 0 24 24'); // Fallback seguro
          }

          // Asegurar fill/stroke base
          if (!svgEl.hasAttribute('fill')) svgEl.setAttribute('fill', 'currentColor');
          if (svgEl.hasAttribute('stroke') && svgEl.getAttribute('stroke') !== 'none') {
            svgEl.setAttribute('stroke', 'currentColor');
          }

          // Limpiar hijos de colores estáticos
          const elements = svgEl.querySelectorAll('*');
          elements.forEach(el => {
            if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
              el.setAttribute('fill', 'currentColor');
            }
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
              el.setAttribute('stroke', 'currentColor');
            }
          });

          svgContent = svgEl.outerHTML;
        }

        const safeSvg = this.sanitizer.bypassSecurityTrustHtml(svgContent);
        const tokenName = `icon.${file.name.replace('.svg', '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        this.disenoVisualService.subirIconoPersonalizado({
          proyecto_id: this.proyectoId,
          nombre: file.name,
          token_name: tokenName,
          svg_content: svgContent,
          estilo: 'custom'
        } as any).subscribe();
      };
      reader.readAsText(file);
    }

    // Reset file input
    event.target.value = '';
  }

  escalaBase = 16;
  escalaRatio = 1.25;

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
    if (this.config()) {
      this.config().escala_espaciado_base = 8;
      this.actualizarConfiguracion();
    }
  }

  get arrayColumnas() {
    const columnas = this.config()?.grid_columnas || 12;
    return new Array(columnas);
  }

  aplicarProporcionAurea() {
    if (this.config()) {
      this.config().grid_columnas = 8;
      this.config().grid_gutter = 24;
      this.config().escala_espaciado_base = 16;
      this.actualizarConfiguracion();
    }
  }

  aplicarReglaTercios() {
    if (this.config()) {
      this.config().grid_columnas = 12;
      this.config().grid_gutter = 16;
      this.config().escala_espaciado_base = 8;
      this.actualizarConfiguracion();
    }
  }

  get advertenciaSistemaOchoPuntos(): string | null {
    const config = this.config();
    if (!config) return null;

    const espaciado = config.escala_espaciado_base;
    const radio = config.radio_borde_base;

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
    const config = this.config();
    if (!config) return null;

    const espaciado = config.escala_espaciado_base;
    const gutter = config.grid_gutter;

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
    const config = this.config();
    if (!config) return null;

    const fuente = config.fuente_principal;
    const radio = config.radio_borde_base;

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

    const nuevasTipografias: TypographyItem[] = estilos.map((config, index) => {
      return {
        proyecto_id: this.proyectoId,
        estilo: config.estilo,
        tamano_px: Math.round(this.escalaBase * Math.pow(this.escalaRatio, config.step)),
        peso: config.peso,
        interlineado: config.interlineado,
        tipo_fuente: config.tipo_fuente,
        orden: index
      };
    });

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
    // Optionally reset escalaBase and escalaRatio to defaults or current values
  }

  get estiloH1() { return this.getEstiloActivo('H1'); }
  get estiloH3() { return this.getEstiloActivo('H3'); }
  get estiloBody() { return this.getEstiloActivo('Body'); }
  get estiloSmall() { return this.getEstiloActivo('Small'); }

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
      return { score: 'Excelente', color: 'primary', mensaje: 'Jerarquía agresiva. Tu diseño se verá moderno y espectacular.' };
    }
  });

  getFontWeightValue(pesoString: string | undefined): number {
    if (!pesoString) return 400;
    if (pesoString.includes('800')) return 800;
    if (pesoString.includes('700')) return 700;
    if (pesoString.includes('600')) return 600;
    if (pesoString.includes('500')) return 500;
    if (pesoString.includes('300')) return 300;
    return 400;
  }

  getFontFamilyValue(tipoString: string | undefined): string {
    const cfg = this.config();
    if (!cfg || !tipoString) return 'sans-serif';
    return tipoString === 'Principal' ? (cfg.fuente_principal || 'sans-serif') : (cfg.fuente_secundaria || 'sans-serif');
  }

  eliminarTipografia(id: number | undefined) {
    if (id) {
      this.disenoVisualService.eliminarTipografia(id).subscribe();
    }
  }

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

  actualizarConfiguracion() {
    const currentConfig = this.config();
    if (currentConfig) {
      this.disenoVisualService.actualizarConfig(currentConfig).subscribe();
    }
  }

  // Contrast Validation
  hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  luminance(r: number, g: number, b: number) {
    const a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  contrastRatio(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1;

    const lum1 = this.luminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.luminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  rgbToHex(r: number, g: number, b: number): string {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
  }

  hexToHsl(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  hslToHex(h: number, s: number, l: number): string {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  suggestAccessibleColor(fgHex: string, bgHex: string, targetRatio: number = 4.5): string | null {
    let currentRatio = this.contrastRatio(fgHex, bgHex);
    if (currentRatio >= targetRatio) return null;

    const bgRgb = this.hexToRgb(bgHex);
    if (!bgRgb) return null;
    const bgLum = this.luminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const isBgLight = bgLum > 0.5;

    let fgHsl = this.hexToHsl(fgHex);
    if (!fgHsl) return null;

    let h = fgHsl.h, s = fgHsl.s, l = fgHsl.l;
    let step = 0.05; // 5% lightness step
    let attempts = 0;
    let bestHex = fgHex;

    while (currentRatio < targetRatio && attempts < 20) {
      if (isBgLight) {
        l = Math.max(0, l - step); // Darken
      } else {
        l = Math.min(1, l + step); // Lighten
      }

      bestHex = this.hslToHex(h, s, l);
      currentRatio = this.contrastRatio(bestHex, bgHex);
      attempts++;

      if (l <= 0 || l >= 1) break; // Reached black or white
    }

    return currentRatio >= targetRatio ? bestHex : (isBgLight ? '#000000' : '#FFFFFF');
  }

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

  // Harmony Generator Logic
  abrirModalArmonias() {
    this.showHarmonyModal = true;
    this.harmonyType = 'Analogous';
    const mainColor = this.colores().find((c: ColorItem) => c.uso === 'Principal');
    this.harmonyBaseColor = mainColor || (this.colores().length > 0 ? this.colores()[0] : null);
    this.generarArmoniaPreview();
  }

  cerrarModalArmonias() {
    this.showHarmonyModal = false;
  }

  onHarmonyBaseChange() {
    this.generarArmoniaPreview();
  }

  onHarmonyTypeChange() {
    this.generarArmoniaPreview();
  }

  generarArmoniaPreview() {
    if (!this.harmonyBaseColor) {
      this.harmonyPreview = [];
      return;
    }
    const hsl = this.hexToHsl(this.harmonyBaseColor.hex_code);
    if (!hsl) return;

    let h = hsl.h;
    let s = hsl.s;
    let l = hsl.l;

    this.harmonyPreview = [];

    if (this.harmonyType === 'Monochromatic') {
      this.harmonyPreview = [
        { hex: this.hslToHex(h, s, Math.min(1, Math.max(0, l - 0.3))), role: 'Más Oscuro' },
        { hex: this.hslToHex(h, s, Math.min(1, Math.max(0, l - 0.15))), role: 'Oscuro' },
        { hex: this.harmonyBaseColor.hex_code, role: 'Base' },
        { hex: this.hslToHex(h, s, Math.min(1, Math.max(0, l + 0.15))), role: 'Claro' },
        { hex: this.hslToHex(h, s, Math.min(1, Math.max(0, l + 0.3))), role: 'Más Claro' }
      ];
    } else if (this.harmonyType === 'Analogous') {
      this.harmonyPreview = [
        { hex: this.hslToHex((h - 0.0833 + 1) % 1, s, l), role: 'Análogo Izq' },
        { hex: this.harmonyBaseColor.hex_code, role: 'Base' },
        { hex: this.hslToHex((h + 0.0833) % 1, s, l), role: 'Análogo Der' }
      ];
    } else if (this.harmonyType === 'Complementary') {
      this.harmonyPreview = [
        { hex: this.harmonyBaseColor.hex_code, role: 'Base' },
        { hex: this.hslToHex((h + 0.5) % 1, s, l), role: 'Complementario' }
      ];
    } else if (this.harmonyType === 'Triadic') {
      this.harmonyPreview = [
        { hex: this.harmonyBaseColor.hex_code, role: 'Base' },
        { hex: this.hslToHex((h + 0.333) % 1, s, l), role: 'Triada 1' },
        { hex: this.hslToHex((h + 0.666) % 1, s, l), role: 'Triada 2' }
      ];
    } else if (this.harmonyType === 'TonalScale') {
      const scale = [];
      const lightSteps = [50, 100, 200, 300, 400];
      const darkSteps = [600, 700, 800, 900];

      // Lighter (Hue shifts slightly negative)
      for (let i = 0; i < lightSteps.length; i++) {
        let newL = l + (0.97 - l) * ((5 - i) / 5);
        let newH = (h - 0.015 * (5 - i)) % 1;
        if (newH < 0) newH += 1;
        scale.push({ hex: this.hslToHex(newH, s, newL), role: lightSteps[i].toString() });
      }

      // Base 500
      scale.push({ hex: this.harmonyBaseColor.hex_code, role: '500 (Base)' });

      // Darker (Hue shifts slightly positive)
      for (let i = 0; i < darkSteps.length; i++) {
        let ratio = (i + 1) / darkSteps.length;
        let newL = l - (l - 0.10) * ratio;
        let newH = (h + 0.015 * (i + 1)) % 1;
        scale.push({ hex: this.hslToHex(newH, s, newL), role: darkSteps[i].toString() });
      }
      this.harmonyPreview = scale;
    }
  }

  guardarPaletaArmonica() {
    this.harmonyPreview.forEach((item, index) => {
      if (item.hex === this.harmonyBaseColor?.hex_code) return; // Skip base

      const roleName = this.harmonyType === 'TonalScale' ? item.role : `${index + 1}`;
      const usoVal = this.harmonyType === 'TonalScale' ? 'Personalizado' : 'Personalizado';

      const nuevoColor: ColorItem = {
        proyecto_id: this.proyectoId,
        nombre: this.harmonyType === 'TonalScale' ? `${this.harmonyBaseColor?.nombre} ${item.role}` : `Variante ${this.harmonyType} ${index + 1}`,
        token_name: `color.${this.harmonyBaseColor?.token_name?.replace('color.', '') || 'base'}.${roleName.replace(' (Base)', '')}`,
        hex_code: item.hex,
        uso: usoVal,
        orden: this.colores().length + index
      };

      this.disenoVisualService.agregarColor(nuevoColor).subscribe();
    });

    this.cerrarModalArmonias();
  }

  // Computed signal to calculate the Contrast Matrix
  matrizContraste = computed(() => {
    const cols: ColorItem[] = this.colores();

    // Clasificamos colores para la matriz
    const bgColors = cols.filter(c => c.uso === 'Fondo' || c.uso === 'Superficie' || c.nombre.toLowerCase().includes('fondo'));
    // Definimos frente: Textos y colores semánticos
    const fgColorsRaw = cols.filter(c => c.uso.includes('Texto') || c.uso === 'Principal' || c.uso === 'Secundario' || c.uso === 'Acento' || c.uso === 'Éxito' || c.uso === 'Advertencia' || c.uso === 'Error' || c.uso === 'Información');

    // Si no hay fondos, usamos blanco por defecto
    const fondos = bgColors.length > 0 ? bgColors : [{ hex_code: '#FFFFFF', nombre: 'Fondo Blanco', uso: 'Fondo', token_name: 'color.bg', proyecto_id: this.proyectoId } as ColorItem];

    // Si no hay frentes definidos explícitamente, tomamos todos los que no son fondo
    const frentesRaw = fgColorsRaw.length > 0 ? fgColorsRaw : cols.filter(c => c.uso !== 'Fondo' && c.uso !== 'Superficie' && !c.nombre.toLowerCase().includes('fondo'));

    // Filtramos frentes únicos por HEX para que la matriz no repita filas idénticas
    const frentes = frentesRaw.filter((v, i, a) => a.findIndex(t => t.hex_code === v.hex_code) === i);

    // Si la lista de frentes quedó vacía
    if (frentes.length === 0) {
      frentes.push({ hex_code: '#0044CC', nombre: 'Principal', uso: 'Texto principal', token_name: 'color.primary' } as ColorItem);
    }

    const rows = frentes.map(fg => {
      const cells = fondos.map(bg => {
        const ratio = this.contrastRatio(fg.hex_code, bg.hex_code);
        const aa_normal = ratio >= 4.5;
        const aaa_normal = ratio >= 7.0;
        const aa_large = ratio >= 3.0;

        let label = 'Fail';
        let badgeClass = 'bg-danger text-white border border-danger';

        if (aaa_normal) { label = 'AAA'; badgeClass = 'bg-success text-white border border-success'; }
        else if (aa_normal) { label = 'AA'; badgeClass = 'bg-success bg-opacity-75 text-white border border-success'; }
        else if (aa_large) { label = 'AA 18pt+'; badgeClass = 'bg-warning text-dark border border-warning'; }

        let sugerenciaHex = null;
        if (!aa_normal) {
          sugerenciaHex = this.suggestAccessibleColor(fg.hex_code, bg.hex_code, 4.5);
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
}

