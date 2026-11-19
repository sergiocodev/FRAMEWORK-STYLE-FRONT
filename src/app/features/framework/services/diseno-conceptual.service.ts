import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  NodoPantalla, NodoConexion, ContenidoItem, Wireframe, DisenoConceptualChecklistItem, WireframeChecklistItem, RestructuringResult, MulticriteriaLayoutResult
} from '../../../models/diseno-conceptual.model';

@Injectable({
  providedIn: 'root'
})
export class DisenoConceptualService {
  private http = inject(HttpClient);

  // Event bus para avisar a otros componentes que el inventario ha cambiado
  private inventoryUpdatedSource = new Subject<void>();
  inventoryUpdated$ = this.inventoryUpdatedSource.asObservable();

  notifyInventoryUpdated() {
    this.inventoryUpdatedSource.next();
  }

  // Event bus para seleccionar un nodo desde el inventario
  private nodeSelectedSource = new Subject<number>();
  nodeSelected$ = this.nodeSelectedSource.asObservable();

  selectNodeFromInventory(nodeId: number) {
    this.nodeSelectedSource.next(nodeId);
  }

  private getBaseUrl(projectId: number): string {
    return `${environment.apiUrl}/api/v1/proyectos/${projectId}/diseno_conceptual`;
  }

  // --- NODOS ---
  getNodos(projectId: number): Observable<NodoPantalla[]> {
    return this.http.get<NodoPantalla[]>(`${this.getBaseUrl(projectId)}/nodos`);
  }

  createNodo(projectId: number, nodo: NodoPantalla): Observable<NodoPantalla> {
    return this.http.post<NodoPantalla>(`${this.getBaseUrl(projectId)}/nodos`, nodo);
  }

  updateNodo(projectId: number, nodoId: number, nodo: Partial<NodoPantalla>): Observable<NodoPantalla> {
    return this.http.put<NodoPantalla>(`${this.getBaseUrl(projectId)}/nodos/${nodoId}`, nodo);
  }

  deleteNodo(projectId: number, nodoId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/nodos/${nodoId}`);
  }

  // --- CONEXIONES ---
  getConexiones(projectId: number): Observable<NodoConexion[]> {
    return this.http.get<NodoConexion[]>(`${this.getBaseUrl(projectId)}/conexiones`);
  }

  createConexion(projectId: number, conexion: NodoConexion): Observable<NodoConexion> {
    return this.http.post<NodoConexion>(`${this.getBaseUrl(projectId)}/conexiones`, conexion);
  }

  deleteConexion(projectId: number, conexionId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/conexiones/${conexionId}`);
  }

  // --- INVENTARIO GLOBAL ---
  getInventario(projectId: number): Observable<ContenidoItem[]> {
    return this.http.get<ContenidoItem[]>(`${this.getBaseUrl(projectId)}/inventario`);
  }

  createContenidoInventario(projectId: number, contenido: ContenidoItem): Observable<ContenidoItem> {
    return this.http.post<ContenidoItem>(`${this.getBaseUrl(projectId)}/inventario`, contenido);
  }

  updateContenidoInventario(projectId: number, itemId: number, contenido: Partial<ContenidoItem>): Observable<ContenidoItem> {
    return this.http.put<ContenidoItem>(`${this.getBaseUrl(projectId)}/inventario/${itemId}`, contenido);
  }

  deleteContenidoInventario(projectId: number, itemId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/inventario/${itemId}`);
  }

  // --- WIREFRAMES ---
  getWireframes(projectId: number): Observable<Wireframe[]> {
    return this.http.get<Wireframe[]>(`${this.getBaseUrl(projectId)}/wireframes`);
  }

  createWireframe(projectId: number, file: File, nodoId?: number | null): Observable<Wireframe> {
    const formData = new FormData();
    formData.append('file', file);
    if (nodoId !== undefined && nodoId !== null) {
      formData.append('nodo_id', nodoId.toString());
    }
    return this.http.post<Wireframe>(`${this.getBaseUrl(projectId)}/wireframes`, formData);
  }

  updateWireframe(projectId: number, wireframeId: number, nodoId: number | null): Observable<Wireframe> {
    return this.http.put<Wireframe>(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}`, { nodo_id: nodoId });
  }

  deleteWireframe(projectId: number, wireframeId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}`);
  }

  // --- DISENO CONCEPTUAL CHECKLIST (PROYECTO) ---
  getProjectChecklist(projectId: number): Observable<DisenoConceptualChecklistItem[]> {
    return this.http.get<DisenoConceptualChecklistItem[]>(`${this.getBaseUrl(projectId)}/checklist`);
  }

  regenerateProjectChecklist(projectId: number): Observable<DisenoConceptualChecklistItem[]> {
    return this.http.post<DisenoConceptualChecklistItem[]>(`${this.getBaseUrl(projectId)}/checklist/regenerate`, {});
  }

  createProjectChecklistItem(projectId: number, item: DisenoConceptualChecklistItem): Observable<DisenoConceptualChecklistItem> {
    return this.http.post<DisenoConceptualChecklistItem>(`${this.getBaseUrl(projectId)}/checklist`, item);
  }

  updateProjectChecklistItem(projectId: number, itemId: number, item: Partial<DisenoConceptualChecklistItem>): Observable<DisenoConceptualChecklistItem> {
    return this.http.put<DisenoConceptualChecklistItem>(`${this.getBaseUrl(projectId)}/checklist/${itemId}`, item);
  }

  deleteProjectChecklistItem(projectId: number, itemId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/checklist/${itemId}`);
  }

  // --- WIREFRAME CHECKLIST ---
  getWireframeChecklist(projectId: number, wireframeId: number): Observable<WireframeChecklistItem[]> {
    return this.http.get<WireframeChecklistItem[]>(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}/checklist`);
  }

  createWireframeChecklistItem(projectId: number, wireframeId: number, item: WireframeChecklistItem): Observable<WireframeChecklistItem> {
    return this.http.post<WireframeChecklistItem>(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}/checklist`, item);
  }

  updateWireframeChecklistItem(projectId: number, wireframeId: number, itemId: number, item: Partial<WireframeChecklistItem>): Observable<WireframeChecklistItem> {
    return this.http.put<WireframeChecklistItem>(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}/checklist/${itemId}`, item);
  }

  deleteWireframeChecklistItem(projectId: number, wireframeId: number, itemId: number): Observable<any> {
    return this.http.delete(`${this.getBaseUrl(projectId)}/wireframes/${wireframeId}/checklist/${itemId}`);
  }

  // --- METRICAS ESTETICAS NGO ET AL. 2003 ---
  evaluateWireframeNgo(projectId: number, wireframeId: number): Observable<any> {
    return this.http.post<any>(
      this.getBaseUrl(projectId) + '/wireframes/' + wireframeId + '/evaluar-ngo',
      {}
    );
  }

  // --- REESTRUCTURACION ESTETICA AUTOMATIZADA (Bessghaier et al. 2022) ---
  restructureWireframe(projectId: number, wireframeId: number): Observable<RestructuringResult> {
    return this.http.post<RestructuringResult>(
      this.getBaseUrl(projectId) + '/wireframes/' + wireframeId + '/reestructurar-estetica',
      {}
    );
  }

  // --- EVALUACION MULTICRITERIO DE LAYOUT (REGRESION Y ENTROPIA) ---
  evaluateWireframeMulticriteria(projectId: number, wireframeId: number): Observable<MulticriteriaLayoutResult> {
    return this.http.post<MulticriteriaLayoutResult>(
      this.getBaseUrl(projectId) + '/wireframes/' + wireframeId + '/evaluar-multicriterio',
      {}
    );
  }

}
