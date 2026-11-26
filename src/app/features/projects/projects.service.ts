import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClienteResponse {
  id: number;
  nombre: string;
}

export interface ProyectoResponse {
  id: number;
  nombre: string;
  tipo: 'nuevo' | 'rediseño';
  cliente_id?: number;
  plataforma?: string;
  nivel_diseno_objetivo: 'bajo' | 'medio' | 'alto';
  estado: 'en_proceso' | 'en_espera' | 'completado' | 'detenido';
  fase_actual_id: number;
  user_id: number;
  cliente?: ClienteResponse;
  creado_en: string;
  actualizado_en?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/api/v1/proyectos`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<ProyectoResponse[]> {
    return this.http.get<ProyectoResponse[]>(this.apiUrl);
  }

  getProjectById(id: string): Observable<ProyectoResponse> {
    return this.http.get<ProyectoResponse>(`${this.apiUrl}/${id}`);
  }

  createProject(data: any): Observable<ProyectoResponse> {
    return this.http.post<ProyectoResponse>(this.apiUrl, data);
  }

  updateProject(id: string, data: any): Observable<ProyectoResponse> {
    return this.http.put<ProyectoResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
