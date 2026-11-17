import { Component, Input, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DisenoVisualService } from '../../../../services/diseno-visual.service';
import { ICON_LIBRARIES, sanitizeUploadedSvg, IconLibraryMetadata } from '../../../../utils/icon-libraries';
import { IconifyService } from '../../../../services/iconify.service';

export interface DisplayedIconItem {
  name: string;
  token: string;
  safeSvg: SafeHtml;
  rawSvg: string;
}

@Component({
  selector: 'app-diseno-visual-icons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diseno-visual-icons.component.html',
  styleUrls: ['./diseno-visual-icons.component.scss']
})
export class DisenoVisualIconsComponent implements OnDestroy {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  private sanitizer = inject(DomSanitizer);
  private iconifyService = inject(IconifyService);

  config = this.disenoVisualService.config;
  iconosPersonales = this.disenoVisualService.iconos;

  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Estado reactivo de carga y catálogo
  isLoading = signal<boolean>(false);
  isApiConnected = signal<boolean>(true);
  totalLibraryCount = signal<number>(0);
  displayedLibraryIcons = signal<DisplayedIconItem[]>([]);
  allCollectionNames = signal<string[]>([]);
  loadedOffset = signal<number>(0);
  readonly pageSize = 48;

  // Feedback de copiado de token
  copiedToken = signal<string | null>(null);

  // Lista de librerías disponibles 100% Open Source
  libreriasDisponibles: IconLibraryMetadata[] = Object.values(ICON_LIBRARIES);

  // Metadatos de la librería seleccionada actualmente
  activeLibrary = computed<IconLibraryMetadata>(() => {
    const libName = this.config()?.libreria_iconos || 'Lucide Icons';
    return ICON_LIBRARIES[libName] || ICON_LIBRARIES['Lucide Icons'];
  });

  hasMoreIcons = computed(() => {
    return this.displayedLibraryIcons().length < this.totalLibraryCount();
  });

  // Iconos seleccionados del proyecto (almacenados en BD), listos para renderizar y adaptados dinámicamente al estilo global
  customIconsSafe = computed(() => {
    const estilo = (this.config()?.estilo_iconos || 'Lineal').toLowerCase();

    return (this.iconosPersonales() || []).map((icon: any) => {
      let rawSvg = icon.svg_content;

      // 1. Buscar en el catálogo local si tiene par hand-crafted Lineal / Relleno
      const localMatch = this.findIconInLocalLibraries(icon.nombre, icon.token_name);
      if (localMatch) {
        rawSvg = estilo === 'relleno' ? localMatch.svgRelleno : localMatch.svgLineal;
      } else {
        // 2. Si es de Iconify o subido, adaptar trazado a Relleno o Lineal
        rawSvg = this.adaptSvgToStyle(rawSvg, estilo);
      }

      return {
        ...icon,
        rawSvg,
        safeSvg: this.sanitizer.bypassSecurityTrustHtml(rawSvg)
      };
    });
  });

  constructor() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.executeSearch(query);
    });

    effect(() => {
      const cfg = this.config();
      if (cfg) {
        if (cfg.grosor_iconos) {
          this.applyStrokeCssVariable(cfg.grosor_iconos);
        }
        if (cfg.libreria_iconos) {
          this.resetAndLoadLibrary();
        }
      }
    });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  /**
   * Determina si un icono del catálogo ya fue añadido al set del proyecto.
   * Normaliza sufijos (-fill, -solid) para que reconozca el icono sin importar la variante activa.
   */
  isIconSelected(name: string, token?: string): boolean {
    const list = this.iconosPersonales() || [];
    const baseName = name.toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
    const cleanName = name.toLowerCase();
    const cleanToken = (token || `icon.${cleanName}`).toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '');

    return list.some((i: any) => {
      const iName = (i.nombre || '').toLowerCase();
      const iBaseName = iName.replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
      const iToken = (i.token_name || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '');
      return iName === cleanName || iBaseName === baseName || iToken === cleanToken;
    });
  }

  /**
   * Alterna la selección: Si no está en el proyecto, lo guarda en la BD.
   * Si ya está, lo elimina del proyecto.
   */
  toggleSelectLibraryIcon(icon: DisplayedIconItem) {
    const list = this.iconosPersonales() || [];
    const baseName = icon.name.toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
    const cleanName = icon.name.toLowerCase();
    const cleanToken = icon.token.toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '');

    const existing = list.find((i: any) => {
      const iName = (i.nombre || '').toLowerCase();
      const iBaseName = iName.replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
      const iToken = (i.token_name || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '');
      return iName === cleanName || iBaseName === baseName || iToken === cleanToken;
    });

    if (existing && existing.id) {
      // Ya seleccionado -> Quitar del proyecto
      this.eliminarIcono(existing.id);
    } else {
      // No seleccionado -> Guardar en el proyecto (Backend MySQL)
      this.disenoVisualService.subirIconoPersonalizado({
        proyecto_id: this.proyectoId,
        nombre: icon.name,
        token_name: icon.token,
        svg_content: icon.rawSvg,
        estilo: this.config()?.estilo_iconos || 'Lineal'
      } as any).subscribe({
        error: err => console.error('Error al guardar icono seleccionado:', err)
      });
    }
  }

  copiarToken(token: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(token);
      this.copiedToken.set(token);
      setTimeout(() => this.copiedToken.set(null), 1800);
    }
  }

  /**
   * Resetea el catálogo y carga los primeros iconos de la librería seleccionada,
   * respetando la variante de estilo activa (Lineal vs Relleno).
   */
  resetAndLoadLibrary() {
    const libName = this.config()?.libreria_iconos || 'Lucide Icons';
    const prefix = this.iconifyService.getPrefix(libName);
    const estilo = (this.config()?.estilo_iconos || 'Lineal').toLowerCase();

    this.isLoading.set(true);
    this.loadedOffset.set(0);
    this.displayedLibraryIcons.set([]);

    this.iconifyService.getCollectionIconNames(prefix).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.isApiConnected.set(true);

        const filtered = this.filterNamesByStyle(res.names, estilo);
        this.totalLibraryCount.set(filtered.length);
        this.allCollectionNames.set(filtered);

        const firstBatch = filtered.slice(0, this.pageSize);
        this.loadIconsBatch(prefix, firstBatch, false);
        this.loadedOffset.set(firstBatch.length);
      },
      error: () => {
        this.isLoading.set(false);
        this.isApiConnected.set(false);
        this.loadOfflineFallback(libName);
      }
    });
  }

  private executeSearch(query: string) {
    const libName = this.config()?.libreria_iconos || 'Lucide Icons';
    const prefix = this.iconifyService.getPrefix(libName);

    if (!query.trim()) {
      const names = this.allCollectionNames();
      if (names.length > 0) {
        const firstBatch = names.slice(0, this.pageSize);
        this.loadIconsBatch(prefix, firstBatch, false);
        this.loadedOffset.set(firstBatch.length);
        this.totalLibraryCount.set(names.length);
      } else {
        this.resetAndLoadLibrary();
      }
      return;
    }

    this.isLoading.set(true);
    this.iconifyService.searchIcons(prefix, query, this.pageSize).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.totalLibraryCount.set(res.total);
        this.loadedOffset.set(res.names.length);
        this.loadIconsBatch(prefix, res.names, false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadMore() {
    if (this.isLoading() || !this.hasMoreIcons()) return;

    const libName = this.config()?.libreria_iconos || 'Lucide Icons';
    const prefix = this.iconifyService.getPrefix(libName);
    const offset = this.loadedOffset();
    const names = this.allCollectionNames();

    const nextBatch = names.slice(offset, offset + this.pageSize);
    if (nextBatch.length === 0) return;

    this.isLoading.set(true);
    this.loadIconsBatch(prefix, nextBatch, true);
    this.loadedOffset.set(offset + nextBatch.length);
  }

  private loadIconsBatch(prefix: string, names: string[], append: boolean) {
    if (names.length === 0) {
      if (!append) this.displayedLibraryIcons.set([]);
      this.isLoading.set(false);
      return;
    }

    this.iconifyService.loadIconsBatch(prefix, names).subscribe({
      next: bodiesMap => {
        this.isLoading.set(false);
        const newItems: DisplayedIconItem[] = [];
        const estilo = (this.config()?.estilo_iconos || 'Lineal').toLowerCase();

        for (const name of names) {
          const iconData = bodiesMap[name];
          if (iconData) {
            let svgRaw = this.iconifyService.buildSvgString(
              iconData.body,
              iconData.width,
              iconData.height
            );

            // Si el estilo global es Relleno y el SVG viene en trazo lineal, adaptarlo
            svgRaw = this.adaptSvgToStyle(svgRaw, estilo, name);

            newItems.push({
              name,
              token: `icon.${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              rawSvg: svgRaw,
              safeSvg: this.sanitizer.bypassSecurityTrustHtml(svgRaw)
            });
          }
        }

        if (append) {
          this.displayedLibraryIcons.update(curr => [...curr, ...newItems]);
        } else {
          this.displayedLibraryIcons.set(newItems);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private loadOfflineFallback(libName: string) {
    const fallbackLib = ICON_LIBRARIES[libName] || ICON_LIBRARIES['Lucide Icons'];
    const estilo = (this.config()?.estilo_iconos || 'Lineal').toLowerCase();

    const items: DisplayedIconItem[] = (fallbackLib.icons || []).map(icon => {
      const raw = estilo === 'relleno' ? icon.svgRelleno : icon.svgLineal;
      return {
        name: icon.name,
        token: icon.token,
        rawSvg: raw,
        safeSvg: this.sanitizer.bypassSecurityTrustHtml(raw)
      };
    });

    this.displayedLibraryIcons.set(items);
    this.totalLibraryCount.set(items.length);
  }

  isRelleno(): boolean {
    const est = (this.config()?.estilo_iconos || '').toLowerCase();
    return est === 'relleno' || est === 'solido';
  }

  isLineal(): boolean {
    return !this.isRelleno();
  }

  onStyleChange(nuevoEstilo: 'Lineal' | 'Relleno') {
    this.disenoVisualService.config.update(curr => {
      if (!curr) return null;
      return { ...curr, estilo_iconos: nuevoEstilo };
    });
    this.actualizarConfiguracion();
    this.resetAndLoadLibrary();
  }

  onStrokeChange(event: any) {
    const val = parseFloat(event.target.value) || 1.5;
    this.disenoVisualService.config.update(curr => {
      if (!curr) return null;
      return { ...curr, grosor_iconos: val };
    });
    this.applyStrokeCssVariable(val);
  }

  private applyStrokeCssVariable(val: number) {
    document.documentElement.style.setProperty('--icon-stroke', `${val}px`);
    document.documentElement.style.setProperty('--preview-icon-stroke', `${val}px`);
  }

  /**
   * Filtra y ordena los nombres de iconos según la variante de estilo
   */
  private filterNamesByStyle(names: string[], estilo: string): string[] {
    if (estilo === 'relleno') {
      const fillNames = names.filter(n => n.endsWith('-fill') || n.includes('solid') || n.includes('filled'));
      const otherNames = names.filter(n => !n.endsWith('-fill') && !n.includes('solid') && !n.includes('filled'));
      return fillNames.length > 0 ? [...fillNames, ...otherNames] : names;
    } else {
      const linearNames = names.filter(n => !n.endsWith('-fill') && !n.includes('solid') && !n.includes('filled'));
      return linearNames.length > 0 ? linearNames : names;
    }
  }

  /**
   * Busca si un icono existe en el catálogo de librerías locales
   */
  private findIconInLocalLibraries(name: string, token: string) {
    const cleanName = (name || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');
    const cleanToken = (token || '').toLowerCase().replace(/-fill$/, '').replace(/-solid$/, '').replace(/-outline$/, '');

    for (const lib of Object.values(ICON_LIBRARIES)) {
      if (!lib.icons) continue;
      const found = lib.icons.find(i => 
        i.name.toLowerCase() === cleanName || 
        i.token.toLowerCase() === cleanToken ||
        `icon.${cleanName}` === i.token.toLowerCase()
      );
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Adapta un SVG estático al estilo activo (Lineal vs Relleno)
   */
  private adaptSvgToStyle(svgContent: string, estilo: string, iconName?: string): string {
    if (!svgContent) return '';
    const isRelleno = estilo === 'relleno';

    if (isRelleno) {
      if (svgContent.includes('fill="none"')) {
        return svgContent.replace(/fill="none"/g, 'fill="currentColor"');
      }
    }
    return svgContent;
  }

  onIconUpload(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) continue;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const rawContent = e.target.result as string;
        const cleanedSvg = sanitizeUploadedSvg(rawContent);

        if (!cleanedSvg) {
          console.warn('SVG no válido o vacío tras la sanitización:', file.name);
          return;
        }

        const tokenName = `icon.${file.name
          .replace(/\.svg$/i, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')}`;

        this.disenoVisualService
          .subirIconoPersonalizado({
            proyecto_id: this.proyectoId,
            nombre: file.name.replace(/\.svg$/i, ''),
            token_name: tokenName,
            svg_content: cleanedSvg,
            estilo: 'custom'
          } as any)
          .subscribe({
            error: err => console.error('Error al subir icono personalizado:', err)
          });
      };
      reader.readAsText(file);
    }

    event.target.value = '';
  }

  eliminarIcono(id: number) {
    this.disenoVisualService.eliminarIcono(id).subscribe({
      error: err => console.error('Error al eliminar icono:', err)
    });
  }

  actualizarConfiguracion() {
    const currentConfig = this.config();
    if (currentConfig) {
      this.disenoVisualService.actualizarConfig(currentConfig).subscribe({
        error: err => console.error('Error al actualizar configuración de diseño visual:', err)
      });
    }
  }
}
