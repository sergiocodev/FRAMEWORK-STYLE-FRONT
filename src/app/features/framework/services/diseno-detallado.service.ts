import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Fase4Pantalla {
  id: string;
  _dbId: number;
  proyecto_id: number;
  title: string;
  descripcion?: string;
  icon?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  fase_creacion: number;
  status: 'Verificada' | 'Pendiente' | 'En revisión';
  lastUpdate: string;
  image?: string;
  wireframeUrl?: string;
  wireframeId?: number;
  wireframeNombre?: string;
  tieneWireframe?: boolean;
  tieneDiseno?: boolean;
  totalAlertas?: number;
  totalChecklists?: number;
  checklistsAprobados?: number;
  isAnalyzing?: boolean;
  alerts?: any[];
}

export interface DisenoDetalladoArchivo {
  id: number;
  nodo_id: number;
  archivo_id: number;
  estado: string;
  archivo_url?: string;
  alertas: any[];
  checklist?: any[];
}

export interface WireframeDisponible {
  id: number;
  proyecto_id: number;
  nombre_archivo: string;
  wireframe_url: string;
  nodo_id?: number | null;
  nodo_nombre?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DisenoDetalladoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getScreens(proyectoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas`);
  }

  createScreen(proyectoId: number, data: { nombre: string, icono?: string, prioridad?: string, wireframe_id?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas`, data);
  }

  updateScreen(proyectoId: number, nodoId: number, data: { nombre?: string, prioridad?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/${nodoId}`, data);
  }

  deleteScreen(proyectoId: number, nodoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/${nodoId}`);
  }

  getAvailableWireframes(proyectoId: number): Observable<WireframeDisponible[]> {
    return this.http.get<WireframeDisponible[]>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/wireframes-disponibles`);
  }

  linkWireframe(proyectoId: number, nodoId: number, wireframeId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/${nodoId}/vincular-wireframe/${wireframeId}`, {});
  }

  unlinkWireframe(proyectoId: number, nodoId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/${nodoId}/desvincular-wireframe`);
  }

  syncFromPhase2(proyectoId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/sincronizar-fase2`, {});
  }

  getDesign(proyectoId: number, nodoId: number): Observable<DisenoDetalladoArchivo> {
    return this.http.get<DisenoDetalladoArchivo>(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado`);
  }

  uploadDesign(proyectoId: number, nodoId: number, file: File): Observable<DisenoDetalladoArchivo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DisenoDetalladoArchivo>(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado/upload`, formData);
  }

  deleteDesign(proyectoId: number, nodoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado`);
  }

  updateChecklistItem(proyectoId: number, nodoId: number, itemId: number, estado: 'aprobado' | 'rechazado'): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado/checklist/${itemId}`, { estado });
  }

  updateDesignStatus(proyectoId: number, nodoId: number, estado: 'verificado' | 'en_revision' | 'pendiente'): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado/estado`, { estado });
  }

  getComparativa(proyectoId: number, nodoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/pantallas/${nodoId}/diseno-detallado/comparativa`);
  }
}
