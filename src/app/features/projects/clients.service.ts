import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClientResponse {
  id: number;
  nombre: string;
  contacto_nombre?: string;
  contacto_correo?: string;
  creado_en: string;
}

export interface ClientCreate {
  nombre: string;
  contacto_nombre?: string;
  contacto_correo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/clientes`;

  getClients(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.apiUrl);
  }

  createClient(data: ClientCreate): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.apiUrl, data);
  }
}
