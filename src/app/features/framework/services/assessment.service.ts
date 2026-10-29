import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  Hallazgo,
  HallazgoCreateRequest
} from '../../../models/assessment.model';
import { GestaltTdaResponse, TdaApplyRequest } from '../../../models/gestalt-tda.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private http = inject(HttpClient);

  private getBaseUrl(projectId: number): string {
    return `${environment.apiUrl}/api/v1/proyectos/${projectId}/assessment`;
  }

  getAssessment(projectId: number): Observable<EvaluacionEsteticaResponse> {
    return this.http.get<EvaluacionEsteticaResponse>(this.getBaseUrl(projectId));
  }

  updateAssessment(projectId: number, data: Partial<EvaluacionEsteticaResponse>): Observable<EvaluacionEsteticaResponse> {
    return this.http.put<EvaluacionEsteticaResponse>(this.getBaseUrl(projectId), data);
  }

  toggleChecklist(projectId: number, itemId: string, cumple?: boolean): Observable<EvaluacionEsteticaResponse> {
    let url = `${this.getBaseUrl(projectId)}/checklist/${itemId}/toggle`;
    if (cumple !== undefined) {
      url += `?cumple=${cumple}`;
    }
    return this.http.put<EvaluacionEsteticaResponse>(url, {});
  }

  updateChecklistItem(projectId: number, itemId: string, data: {
    estado?: string;
    cumple?: boolean;
    observacion?: string;
    subcriterio_id?: string;
    subcriterio_cumple?: boolean;
  }): Observable<EvaluacionEsteticaResponse> {
    return this.http.put<EvaluacionEsteticaResponse>(`${this.getBaseUrl(projectId)}/checklist/${itemId}`, data);
  }

  addFinding(projectId: number, finding: HallazgoCreateRequest): Observable<Hallazgo> {
    return this.http.post<Hallazgo>(`${this.getBaseUrl(projectId)}/hallazgos`, finding);
  }

  updateFinding(projectId: number, findingId: number, data: Partial<Hallazgo>): Observable<Hallazgo> {
    return this.http.put<Hallazgo>(`${this.getBaseUrl(projectId)}/hallazgos/${findingId}`, data);
  }

  toggleFindingResolved(projectId: number, findingId: number): Observable<Hallazgo> {
    return this.http.put<Hallazgo>(`${this.getBaseUrl(projectId)}/hallazgos/${findingId}/toggle-resuelto`, {});
  }

  deleteFinding(projectId: number, findingId: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.getBaseUrl(projectId)}/hallazgos/${findingId}`);
  }

  syncFase4(projectId: number): Observable<EvaluacionEsteticaResponse> {
    return this.http.post<EvaluacionEsteticaResponse>(`${this.getBaseUrl(projectId)}/sync-fase4`, {});
  }

  getGestaltTda(projectId: number, pantallaId?: number | null): Observable<GestaltTdaResponse> {
    const query = pantallaId ? `?pantalla_id=${pantallaId}` : '';
    return this.http.get<GestaltTdaResponse>(`${this.getBaseUrl(projectId)}/gestalt-tda${query}`);
  }

  applyGestaltTda(projectId: number, request: TdaApplyRequest): Observable<{ success: boolean; mensaje: string; score_gestalt_global: number; evaluacion: EvaluacionEsteticaResponse }> {
    return this.http.post<{ success: boolean; mensaje: string; score_gestalt_global: number; evaluacion: EvaluacionEsteticaResponse }>(
      `${this.getBaseUrl(projectId)}/gestalt-tda/aplicar`,
      request
    );
  }
}
