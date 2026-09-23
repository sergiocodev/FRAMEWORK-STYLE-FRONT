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
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

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
    ModalComponent,
    PageHeaderComponent
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
  headerBreadcrumbs: any[] = [];
  
  get formattedStatus(): string {
    const status = this.project?.status;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
  
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
  
  // Sidebar State
  activeSection: 'necesidad' | 'expectativas' | 'usuarios' | 'recursos' = 'necesidad';

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
        this.project = {
          title: data.project.nombre,
          status: data.project.estado,
          type: data.project.tipo,
          client: data.project.cliente?.nombre || 'Sin cliente asignado'
        };

        this.headerBreadcrumbs = [
          { label: 'Inicio', url: '/' },
          { label: 'Proyectos', url: '/projects' },
          { label: this.project.title, active: true }
        ];

        const currentPhaseId = data.project?.fase_actual_id || 1;
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: currentPhaseId > 1 ? 'completed' : (currentPhaseId === 1 ? 'active' : 'upcoming') },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: currentPhaseId > 2 ? 'completed' : (currentPhaseId === 2 ? 'active' : 'upcoming') },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: currentPhaseId > 3 ? 'completed' : (currentPhaseId === 3 ? 'active' : 'upcoming') },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: currentPhaseId > 4 ? 'completed' : (currentPhaseId === 4 ? 'active' : 'upcoming') },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: currentPhaseId > 5 ? 'completed' : (currentPhaseId === 5 ? 'active' : 'upcoming') }
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
        this.usuarios = data.arquetipos.map((a: any) => {
          const partes = a.nombre ? a.nombre.split('|') : [''];
          const role = partes[0].trim();
          const name = partes.length > 1 ? partes[1].trim() : role;
          return {
            id: a.id,
            name: name,
            role: role, 
            tag: a.etiqueta || 'General',
            needs: a.necesidades ? a.necesidades.map((n: any) => n.descripcion) : []
          };
        });

        // Map Recursos
        this.recursos = data.recursosList.map((r: any) => {
          const type = r.nombre_original.endsWith('.pdf') ? 'pdf' : 
                       (r.nombre_original.endsWith('.zip') ? 'zip' : 'image');
                       
          const sizeMB = r.tamano_bytes ? (r.tamano_bytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Desconocido';

          return {
            id: r.id,
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

  setActiveSection(section: 'necesidad' | 'expectativas' | 'usuarios' | 'recursos'): void {
    this.activeSection = section;
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
