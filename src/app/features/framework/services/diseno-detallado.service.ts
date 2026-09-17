import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Fase4Pantalla {
  id: string; // we use string on frontend for ID tracking, though backend uses number
  _dbId: number;
  proyecto_id: number;
  title: string;
  descripcion?: string;
  icon?: string;
  fase_creacion: number;
  status: 'Verificada' | 'Pendiente' | 'En revisión';
  lastUpdate: string;
  image?: string;
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

  createScreen(proyectoId: number, data: { nombre: string, icono?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas`, data);
  }

  deleteScreen(proyectoId: number, nodoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/proyectos/${proyectoId}/fase4-pantallas/${nodoId}`);
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
}
