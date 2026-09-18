import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime } from 'rxjs/operators';
import { Phase } from '../../../shared/components/stepper/stepper.component';
import { InvestigationHeaderComponent } from './components/investigation-header/investigation-header.component';
import { InvestigationNecessityComponent } from './components/investigation-necessity/investigation-necessity.component';
import { InvestigationExpectationsComponent } from './components/investigation-expectations/investigation-expectations.component';
import { InvestigationUsersComponent } from './components/investigation-users/investigation-users.component';
import { InvestigationResourcesComponent } from './components/investigation-resources/investigation-resources.component';
import { InvestigationPreviewComponent } from './components/investigation-preview/investigation-preview.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

import { ProjectService } from '../../../core/services/project.service';
import { InvestigationService } from '../services/investigation.service';

@Component({
  selector: 'app-investigation',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    InvestigationHeaderComponent,
    InvestigationNecessityComponent,
    InvestigationExpectationsComponent,
    InvestigationUsersComponent,
    InvestigationResourcesComponent,
    InvestigationPreviewComponent,
    ModalComponent
  ],
  templateUrl: './investigation.component.html',
  styleUrls: ['./investigation.component.scss']
})
export class InvestigationComponent implements OnInit {
  private projectService = inject(ProjectService);
  private investigationService = inject(InvestigationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = true;
  error = false;

  project: any = {};
  phases: Phase[] = [];
  
  // Phase 1 Data States (with auto-save hooks)
  private _problema: string = '';
  get problema() { return this._problema; }
  set problema(v) { this._problema = v; this.triggerAutoSave(); }

  private _objetivo: string = '';
  get objetivo() { return this._objetivo; }
  set objetivo(v) { this._objetivo = v; this.triggerAutoSave(); }

  private _producto: string = '';
  get producto() { return this._producto; }
  set producto(v) { this._producto = v; this.triggerAutoSave(); }
  
  private _expectativas: string = '';
  get expectativas() { return this._expectativas; }
  set expectativas(v) { this._expectativas = v; this.triggerAutoSave(); }

  private _referencias: { url: string, notas: string }[] = [];
  get referencias() { return this._referencias; }
  set referencias(v) { this._referencias = v; this.triggerAutoSave(); }

  private _analisisActual: string = '';
  get analisisActual() { return this._analisisActual; }
  set analisisActual(v) { this._analisisActual = v; this.triggerAutoSave(); }
  
  usuarios: any[] = []; // Currently not handled by simple autosave payload
  recursos: any[] = [];
  
  private _restricciones: string = '';
  get restricciones() { return this._restricciones; }
  set restricciones(v) { this._restricciones = v; this.triggerAutoSave(); }

  private _identidadMarca = { tieneManual: false, colores: '', notas: '' };
  get identidadMarca() { return this._identidadMarca; }
  set identidadMarca(v) { this._identidadMarca = v; this.triggerAutoSave(); }

  private saveSubject = new Subject<void>();

  // Mobile Tabs State (Removido ya que usamos Modal)
  
  // Modal State
  isModalOpen: boolean = false;

  // Save State
  currentProjectId: number = 0;
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  isCompleting: boolean = false;

  ngOnInit(): void {
    // Setup autosave
    this.saveSubject.pipe(
      debounceTime(1500)
    ).subscribe(() => {
      this.saveChanges();
    });

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.currentProjectId = Number(idParam);
        this.fetchData(this.currentProjectId);
      } else {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private fetchData(projectId: number) {
    this.isLoading = true;
    forkJoin({
      project: this.projectService.getProjectById(projectId),
      informe: this.investigationService.getInforme(projectId).pipe(catchError(() => of({ necesidad_proyecto: 'Aún no se ha definido una necesidad.' }))),
      arquetipos: this.investigationService.getArquetipos(projectId).pipe(catchError(() => of([]))),
      recursosList: this.investigationService.getRecursos(projectId).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        // Map Project
        this.project = {
          title: data.project.nombre,
          status: data.project.estado,
          type: data.project.tipo,
          client: data.project.cliente?.nombre || 'Sin cliente asignado'
        };

        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: data.project.fase_actual_id >= 1 ? 'active' : 'upcoming' },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: data.project.fase_actual_id >= 2 ? (data.project.fase_actual_id === 2 ? 'active' : 'completed') : 'upcoming' },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: data.project.fase_actual_id >= 3 ? (data.project.fase_actual_id === 3 ? 'active' : 'completed') : 'upcoming' },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: data.project.fase_actual_id >= 4 ? (data.project.fase_actual_id === 4 ? 'active' : 'completed') : 'upcoming' },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: data.project.fase_actual_id >= 5 ? (data.project.fase_actual_id === 5 ? 'active' : 'completed') : 'upcoming' }
        ];

        // Map Informe
        this.problema = data.informe.problema || 'Sin descripción detallada';
        this.objetivo = data.informe.objetivo || '';
        this.producto = data.informe.producto || '';
        this.expectativas = data.informe.expectativas || '';
        this.referencias = data.informe.referencias || [];
        this.analisisActual = data.informe.analisis_actual || '';
        this.restricciones = data.informe.restricciones || '';
        this.identidadMarca = data.informe.identidad_marca || { tieneManual: false, colores: '', notas: '' };

        // Map Arquetipos
        this.usuarios = data.arquetipos.map((a: any) => ({
          name: a.nombre,
          role: a.nombre, 
          tag: a.etiqueta || 'General',
          photoUrl: 'https://i.pravatar.cc/150?img=11',
          needs: a.necesidades ? a.necesidades.map((n: any) => n.descripcion) : []
        }));

        // Map Recursos
        this.recursos = data.recursosList.map((r: any) => {
          const type = r.nombre_original.endsWith('.pdf') ? 'pdf' : 
                       (r.nombre_original.endsWith('.zip') ? 'zip' : 'image');
                       
          const sizeMB = r.tamano_bytes ? (r.tamano_bytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Desconocido';

          return {
            name: r.nombre_original,
            size: sizeMB,
            type: type
          };
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  triggerAutoSave(): void {
    if (!this.isLoading) {
      this.saveSubject.next();
    }
  }

  saveChanges(): void {
    if (!this.currentProjectId) return;
    
    this.isSaving = true;
    this.saveSuccess = false;
    
    const payload = {
      problema: this.problema,
      objetivo: this.objetivo,
      producto: this.producto,
      expectativas: this.expectativas,
      referencias: this.referencias,
      analisis_actual: this.analisisActual,
      restricciones: this.restricciones,
      identidad_marca: this.identidadMarca
    };
    
    this.investigationService.updateInforme(this.currentProjectId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        console.error('Error al guardar', err);
        this.isSaving = false;
      }
    });
  }

  completePhase(): void {
    if (!this.currentProjectId) return;
    
    if (!this.problema.trim() || !this.objetivo.trim()) {
      alert('Por favor completa al menos el Problema y el Objetivo antes de continuar.');
      return;
    }

    this.isCompleting = true;
    this.projectService.updateProject(this.currentProjectId, { fase_actual_id: 2 }).subscribe({
      next: () => {
        this.isCompleting = false;
        this.isModalOpen = false;
        this.router.navigate(['/framework/projects', this.currentProjectId, 'diseno_conceptual']);
      },
      error: (err) => {
        console.error('Error al avanzar fase', err);
        this.isCompleting = false;
        alert('Ocurrió un error al intentar avanzar de fase.');
      }
    });
  }
}
