import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DisenoVisualConfig {
  id?: number;
  proyecto_id: number;
  fuente_principal: string;
  fuente_secundaria: string;
  estilo_iconos: string;
  libreria_iconos: string;
  grosor_iconos: number;
  escala_espaciado_base: number;
  radio_borde_base: number;
  grid_columnas: number;
  grid_gutter: number;
}

export interface ColorItem {
  id?: number;
  proyecto_id: number;
  hex_code: string;
  nombre: string;
  token_name?: string;
  uso: string;
  orden?: number;
  usos_count?: number; // Simulando cantidad de usos para la UI
}

export interface IconItem {
  id?: number;
  proyecto_id: number;
  nombre: string;
  token_name: string;
  svg_content: string;
  estilo?: string;
}

export interface TypographyItem {
  id?: number;
  proyecto_id: number;
  estilo: string;
  tamano_px: number;
  peso: string;
  interlineado: number;
  tipo_fuente?: string;
  orden?: number;
  letter_spacing?: number;
  line_height_px?: number;
}

export interface DisenoVisualCompleto {
  config: DisenoVisualConfig;
  colores: ColorItem[];
  tipografias: TypographyItem[];
  iconos: IconItem[];
}

export interface MSSBOAOptimizeRequest {
  base_hex: string;
  harmony_type?: string;
  mode?: string;
  wcag_target?: string;
  population_size?: number;
  max_iterations?: number;
  seed?: number;
}

export interface MSSBOAOptimizedColor {
  hex_code: string;
  nombre: string;
  token_name: string;
  uso: string;
  orden: number;
}

export interface MSSBOAAestheticMetrics {
  contrast_score: number;
  harmony_score: number;
  diversity_score: number;
  fitness_score: number;
  min_contrast: number;
  wcag_compliant: boolean;
  harmony_template: string;
  theme_mode: string;
}

export interface MSSBOAOptimizeResponse {
  colores: MSSBOAOptimizedColor[];
  metrics: MSSBOAAestheticMetrics;
  iterations: number;
  population_size: number;
  execution_time_ms: number;
  convergence_history: number[];
}


@Injectable({
  providedIn: 'root'
})
export class DisenoVisualService {
  private apiUrl = `${environment.apiUrl}/api/diseno-visual`;

  // Signals for state management
  public config = signal<DisenoVisualConfig | null>(null);
  public colores = signal<ColorItem[]>([]);
  public tipografias = signal<TypographyItem[]>([]);
  public iconos = signal<IconItem[]>([]);

  constructor(private http: HttpClient) { }

  cargarDisenoVisualCompleto(proyectoId: number): Observable<DisenoVisualCompleto> {
    return this.http.get<DisenoVisualCompleto>(`${this.apiUrl}/${proyectoId}/completo`).pipe(
      tap(res => {
        if (!res.config) {
          // Initialize default config if null
          res.config = {
            proyecto_id: proyectoId,
            fuente_principal: 'Inter',
            fuente_secundaria: 'Roboto',
            estilo_iconos: 'Lineal',
            libreria_iconos: 'Bootstrap Icons',
            grosor_iconos: 1.5,
            escala_espaciado_base: 8,
            radio_borde_base: 8,
            grid_columnas: 12,
            grid_gutter: 16
          };
          // Try to save it immediately
          this.actualizarConfig(res.config).subscribe();
        }
        this.config.set(res.config);
        this.colores.set(res.colores || []);
        this.tipografias.set(res.tipografias || []);
        this.iconos.set(res.iconos || []);
      })
    );
  }

  actualizarConfig(config: DisenoVisualConfig): Observable<DisenoVisualConfig> {
    return this.http.put<DisenoVisualConfig>(`${this.apiUrl}/config`, config).pipe(
      tap(res => this.config.set(res))
    );
  }

  agregarColor(color: ColorItem): Observable<ColorItem> {
    return this.http.post<ColorItem>(`${this.apiUrl}/colores`, color).pipe(
      tap(res => {
        this.colores.update(cols => [...cols, res]);
      })
    );
  }

  actualizarColor(color: ColorItem): Observable<ColorItem> {
    return this.http.put<ColorItem>(`${this.apiUrl}/colores/${color.id}`, color).pipe(
      tap(res => {
        this.colores.update(cols => cols.map(c => c.id === res.id ? res : c));
      })
    );
  }

  eliminarColor(colorId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/colores/${colorId}`).pipe(
      tap(() => {
        this.colores.update(cols => cols.filter(c => c.id !== colorId));
      })
    );
  }

  agregarTipografia(tipo: TypographyItem): Observable<TypographyItem> {
    return this.http.post<TypographyItem>(`${this.apiUrl}/tipografias`, tipo).pipe(
      tap(res => {
        this.tipografias.update(tipos => [...tipos, res]);
      })
    );
  }

  actualizarTipografia(tipo: TypographyItem): Observable<TypographyItem> {
    return this.http.put<TypographyItem>(`${this.apiUrl}/tipografias/${tipo.id}`, tipo).pipe(
      tap(res => {
        this.tipografias.update(tipos => tipos.map(t => t.id === res.id ? res : t));
      })
    );
  }

  eliminarTipografia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tipografias/${id}`).pipe(
      tap(() => {
        const current = this.tipografias();
        this.tipografias.set(current.filter(t => t.id !== id));
      })
    );
  }

  reemplazarTipografias(proyectoId: number, tipos: TypographyItem[]): Observable<TypographyItem[]> {
    return this.http.post<TypographyItem[]>(`${this.apiUrl}/${proyectoId}/tipografias/batch`, tipos).pipe(
      tap(res => {
        this.tipografias.set(res);
      })
    );
  }

  // ---- Iconos Personalizados ----
  subirIconoPersonalizado(icono: IconItem): Observable<IconItem> {
    return this.http.post<IconItem>(`${this.apiUrl}/iconos`, icono).pipe(
      tap(newIcon => {
        const current = this.iconos();
        this.iconos.set([...current, newIcon]);
      })
    );
  }

  eliminarIcono(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/iconos/${id}`).pipe(
      tap(() => {
        const current = this.iconos();
        this.iconos.set(current.filter(i => i.id !== id));
      })
    );
  }

  // ---- MSSBOA Optimizer (Bio-inspired Aesthetic Color Harmony) ----
  optimizarConMSSBOA(request: MSSBOAOptimizeRequest): Observable<MSSBOAOptimizeResponse> {
    return this.http.post<MSSBOAOptimizeResponse>(`${this.apiUrl}/optimizador/mssboa`, request);
  }

  reemplazarColoresBatch(proyectoId: number, colores: ColorItem[]): Observable<ColorItem[]> {
    return this.http.post<ColorItem[]>(`${this.apiUrl}/${proyectoId}/colores/batch`, colores).pipe(
      tap(res => {
        this.colores.set(res);
      })
    );
  }
}

