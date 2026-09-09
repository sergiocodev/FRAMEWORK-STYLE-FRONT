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

  // Future CRUD methods (POST, PUT, DELETE) can go here
}
