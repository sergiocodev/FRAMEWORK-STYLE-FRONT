import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProyectoResponse } from '../../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/proyectos`;

  getProjectById(id: number): Observable<ProyectoResponse> {
    return this.http.get<ProyectoResponse>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: number, data: any): Observable<ProyectoResponse> {
    return this.http.put<ProyectoResponse>(`${this.apiUrl}/${id}`, data);
  }
}
