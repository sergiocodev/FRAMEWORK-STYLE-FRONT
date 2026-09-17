import { Component, OnInit, computed, effect, inject } from '@angular/core';
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
  proyectoId = 1;

  colores: any;
  tipografias: any;
  config: any;
  iconosPersonales: any;

  LIBRERIA_PREVIEWS: Record<string, {name: string, token: string, svg: SafeHtml}[]> = {};

  rolesDisponibles = [
    'Principal', 'Secundario', 'Acento', 'Fondo', 'Superficie', 
    'Texto principal', 'Texto secundario', 'Borde', 'Éxito', 
    'Advertencia', 'Error', 'Información', 'Personalizado'
  ];

  // Modals state
  showColorModal = false;
  showDeleteModal = false;
  showTypographyModal = false;
  editingColor: Partial<ColorItem> = {};
  editingTypography: Partial<TypographyItem> = {};
  colorToDelete: ColorItem | null = null;
  isNewColor = false;
  isNewTypography = false;

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

  generarEscalaTipografica() {
    if (!confirm('Esto reemplazará todos tus estilos tipográficos actuales. ¿Deseas continuar?')) return;

    const estilos = [
      { estilo: 'Display', step: 6, peso: 'Bold (700)', interlineado: 1.1 },
      { estilo: 'H1', step: 5, peso: 'Bold (700)', interlineado: 1.1 },
      { estilo: 'H2', step: 4, peso: 'Bold (700)', interlineado: 1.2 },
      { estilo: 'H3', step: 3, peso: 'Semibold (600)', interlineado: 1.2 },
      { estilo: 'H4', step: 2, peso: 'Semibold (600)', interlineado: 1.3 },
      { estilo: 'H5', step: 1, peso: 'Medium (500)', interlineado: 1.4 },
      { estilo: 'Body', step: 0, peso: 'Regular (400)', interlineado: 1.5 },
      { estilo: 'Small', step: -1, peso: 'Regular (400)', interlineado: 1.5 }
    ];

    const existentes = this.tipografias();
    existentes.forEach((t: any) => {
      if (t.id) this.disenoVisualService.eliminarTipografia(t.id).subscribe();
    });

    estilos.forEach((config, index) => {
      const tamano = Math.round(this.escalaBase * Math.pow(this.escalaRatio, config.step));
      const nuevaTipo: TypographyItem = {
        proyecto_id: this.proyectoId,
        estilo: config.estilo,
        tamano_px: tamano,
        peso: config.peso,
        interlineado: config.interlineado,
        orden: index
      };
      
      // Breve retraso escalonado para mantener el orden de inserción en BD
      setTimeout(() => {
        this.disenoVisualService.agregarTipografia(nuevaTipo).subscribe();
      }, index * 100);
    });
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
        orden: this.tipografias().length
      };
    }
    this.showTypographyModal = true;
  }

  cerrarModalTipografia() {
    this.showTypographyModal = false;
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

  suggestAccessibleColor(fgHex: string, bgHex: string, targetRatio: number = 4.5): string | null {
    let fgRgb = this.hexToRgb(fgHex);
    const bgRgb = this.hexToRgb(bgHex);
    if (!fgRgb || !bgRgb) return null;

    let currentRatio = this.contrastRatio(fgHex, bgHex);
    if (currentRatio >= targetRatio) return null;

    const bgLum = this.luminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const isBgLight = bgLum > 0.5;

    let r = fgRgb.r, g = fgRgb.g, b = fgRgb.b;
    let step = 5;
    let attempts = 0;
    let bestHex = fgHex;

    while (currentRatio < targetRatio && attempts < 60) {
      if (isBgLight) {
        r = Math.max(0, r - step);
        g = Math.max(0, g - step);
        b = Math.max(0, b - step);
      } else {
        r = Math.min(255, r + step);
        g = Math.min(255, g + step);
        b = Math.min(255, b + step);
      }
      
      bestHex = this.rgbToHex(r, g, b);
      currentRatio = this.contrastRatio(bestHex, bgHex);
      attempts++;
      
      if ((r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)) {
        break;
      }
    }

    return currentRatio >= targetRatio ? bestHex : (isBgLight ? '#000000' : '#FFFFFF');
  }

  aplicarSugerencia(fg: ColorItem, nuevoHex: string) {
    const colorActualizado = { ...fg, hex_code: nuevoHex };
    this.disenoVisualService.actualizarColor(colorActualizado).subscribe();
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
