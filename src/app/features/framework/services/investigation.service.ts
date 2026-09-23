import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  InvestigacionInformeResponse,
  ArquetipoUsuarioResponse,
  ArchivoResponse
} from '../../../models/investigation.model';

@Injectable({
  providedIn: 'root'
})
export class InvestigationService {
  private http = inject(HttpClient);
  private getBaseUrl(projectId: number): string {
    return `${environment.apiUrl}/api/v1/proyectos/${projectId}/investigation`;
  }

  getInforme(projectId: number): Observable<InvestigacionInformeResponse> {
    return this.http.get<InvestigacionInformeResponse>(`${this.getBaseUrl(projectId)}/informe`);
  }

  getArquetipos(projectId: number): Observable<ArquetipoUsuarioResponse[]> {
    return this.http.get<ArquetipoUsuarioResponse[]>(`${this.getBaseUrl(projectId)}/arquetipos`);
  }

  getRecursos(projectId: number): Observable<ArchivoResponse[]> {
    return this.http.get<ArchivoResponse[]>(`${this.getBaseUrl(projectId)}/recursos`);
  }

  uploadRecurso(projectId: number, file: File): Observable<ArchivoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ArchivoResponse>(`${this.getBaseUrl(projectId)}/recursos`, formData);
  }

  deleteRecurso(projectId: number, fileId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/recursos/${fileId}`);
  }

  updateInforme(projectId: number, data: any): Observable<InvestigacionInformeResponse> {
    return this.http.put<InvestigacionInformeResponse>(`${this.getBaseUrl(projectId)}/informe`, data);
  }

  uploadReferencia(projectId: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.getBaseUrl(projectId)}/referencias/upload`, formData);
  }

  createArquetipo(projectId: number, data: any): Observable<ArquetipoUsuarioResponse> {
    return this.http.post<ArquetipoUsuarioResponse>(`${this.getBaseUrl(projectId)}/arquetipos`, data);
  }

  updateArquetipo(projectId: number, arquetipoId: number, data: any): Observable<ArquetipoUsuarioResponse> {
    return this.http.put<ArquetipoUsuarioResponse>(`${this.getBaseUrl(projectId)}/arquetipos/${arquetipoId}`, data);
  }

  deleteArquetipo(projectId: number, arquetipoId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/arquetipos/${arquetipoId}`);
  }
}
