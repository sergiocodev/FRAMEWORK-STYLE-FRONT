import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface IconifyCollectionResponse {
  prefix: string;
  total: number;
  title?: string;
  uncategorized?: string[];
  categories?: Record<string, string[]>;
  aliases?: Record<string, any>;
}

export interface IconifySearchResponse {
  icons: string[];
  total: number;
  limit: number;
  start: number;
}

export interface IconifyBatchData {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
  aliases?: Record<string, { parent: string }>;
}

export const LIBRERIA_PREFIX_MAP: Record<string, string> = {
  'Lucide Icons': 'lucide',
  'Bootstrap Icons': 'bi',
  'Heroicons': 'heroicons',
  'Phosphor Icons': 'ph',
  'Material Symbols': 'material-symbols'
};

@Injectable({
  providedIn: 'root'
})
export class IconifyService {
  private http = inject(HttpClient);
  
  // URL del proxy backend local (evita bloqueos de CORS y de extensiones/adblockers en el navegador)
  private backendProxyUrl = `${environment.apiUrl}/api/diseno-visual/catalogo`;
  private directApiUrl = 'https://api.iconify.design';

  // Caché en memoria para máxima velocidad y evitar llamadas repetidas
  private collectionCache = new Map<string, string[]>();
  private iconBodyCache = new Map<string, { body: string; width: number; height: number }>();

  getPrefix(libreriaNombre: string): string {
    return LIBRERIA_PREFIX_MAP[libreriaNombre] || 'lucide';
  }

  /**
   * Obtiene la lista completa de nombres de iconos de la colección seleccionada.
   * Primero intenta a través del proxy local; si falla, intenta directo a Iconify.
   */
  getCollectionIconNames(prefix: string): Observable<{ total: number; names: string[] }> {
    if (this.collectionCache.has(prefix)) {
      const cached = this.collectionCache.get(prefix)!;
      return of({ total: cached.length, names: cached });
    }

    const primaryUrl = `${this.backendProxyUrl}/collection?prefix=${prefix}`;
    const fallbackUrl = `${this.directApiUrl}/collection?prefix=${prefix}`;

    return this.http.get<IconifyCollectionResponse>(primaryUrl).pipe(
      catchError(() => this.http.get<IconifyCollectionResponse>(fallbackUrl)),
      map(res => {
        let allNames: string[] = [];
        if (res.uncategorized && res.uncategorized.length > 0) {
          allNames = [...res.uncategorized];
        }
        if (res.categories) {
          for (const catName of Object.keys(res.categories)) {
            allNames.push(...res.categories[catName]);
          }
        }
        const unique = Array.from(new Set(allNames));
        this.collectionCache.set(prefix, unique);
        return { total: unique.length, names: unique };
      }),
      catchError(err => {
        console.warn(`Iconify: error al cargar colección ${prefix}`, err);
        return of({ total: 0, names: [] });
      })
    );
  }

  /**
   * Busca iconos por texto. Pasa por el proxy local primero para garantizar cero bloqueos.
   */
  searchIcons(prefix: string, query: string, limit: number = 48): Observable<{ total: number; names: string[] }> {
    if (!query.trim()) {
      return this.getCollectionIconNames(prefix).pipe(
        map(res => ({
          total: res.total,
          names: res.names.slice(0, limit)
        }))
      );
    }

    const cleanQuery = encodeURIComponent(query.trim());
    const primaryUrl = `${this.backendProxyUrl}/search?prefix=${prefix}&query=${cleanQuery}&limit=${limit}`;
    const fallbackUrl = `${this.directApiUrl}/search?prefix=${prefix}&query=${cleanQuery}&limit=${limit}`;

    return this.http.get<IconifySearchResponse>(primaryUrl).pipe(
      catchError(() => this.http.get<IconifySearchResponse>(fallbackUrl)),
      map(res => {
        const names = (res.icons || []).map(full => {
          return full.includes(':') ? full.split(':')[1] : full;
        });
        return { total: res.total || names.length, names };
      }),
      catchError(err => {
        console.warn(`Iconify: error en búsqueda '${query}' para ${prefix}`, err);
        return of({ total: 0, names: [] });
      })
    );
  }

  /**
   * Carga el SVG de múltiples iconos en una sola llamada por lotes.
   */
  loadIconsBatch(
    prefix: string,
    names: string[]
  ): Observable<Record<string, { body: string; width: number; height: number }>> {
    if (!names || names.length === 0) {
      return of({});
    }

    const missing: string[] = [];
    const result: Record<string, { body: string; width: number; height: number }> = {};

    for (const name of names) {
      const cacheKey = `${prefix}:${name}`;
      if (this.iconBodyCache.has(cacheKey)) {
        result[name] = this.iconBodyCache.get(cacheKey)!;
      } else {
        missing.push(name);
      }
    }

    if (missing.length === 0) {
      return of(result);
    }

    const iconsParam = missing.join(',');
    const primaryUrl = `${this.backendProxyUrl}/icons?prefix=${prefix}&icons=${iconsParam}`;
    const fallbackUrl = `${this.directApiUrl}/${prefix}.json?icons=${iconsParam}`;

    return this.http.get<IconifyBatchData>(primaryUrl).pipe(
      catchError(() => this.http.get<IconifyBatchData>(fallbackUrl)),
      map(data => {
        const defaultWidth = data.width || 24;
        const defaultHeight = data.height || 24;

        if (data.icons) {
          for (const [iconName, iconData] of Object.entries(data.icons)) {
            const entry = {
              body: iconData.body,
              width: iconData.width || defaultWidth,
              height: iconData.height || defaultHeight
            };
            this.iconBodyCache.set(`${prefix}:${iconName}`, entry);
            result[iconName] = entry;
          }
        }

        if (data.aliases) {
          for (const [aliasName, aliasInfo] of Object.entries(data.aliases)) {
            const parentName = aliasInfo.parent;
            if (result[parentName]) {
              result[aliasName] = result[parentName];
              this.iconBodyCache.set(`${prefix}:${aliasName}`, result[parentName]);
            }
          }
        }

        return result;
      }),
      catchError(err => {
        console.warn(`Iconify: error al cargar lote de iconos ${prefix}`, err);
        return of(result);
      })
    );
  }

  buildSvgString(body: string, width: number = 24, height: number = 24): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" fill="currentColor">${body}</svg>`;
  }
}
