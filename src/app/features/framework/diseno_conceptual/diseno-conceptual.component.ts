import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DisenoHeaderComponent } from './components/diseno-header/diseno-header.component';
import { ProjectService } from '../../../core/services/project.service';
import { DisenoConceptualService } from '../services/diseno-conceptual.service';
import {
  NodoPantalla,
  Wireframe,
  WireframeChecklistItem,
  DisenoConceptualChecklistItem
} from '../../../models/diseno-conceptual.model';
import { Phase } from '../../../shared/components/stepper/stepper.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-diseno-conceptual',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    PageHeaderComponent,
    DisenoHeaderComponent
  ],
  templateUrl: './diseno-conceptual.component.html',
  styleUrls: ['./diseno-conceptual.component.scss']
})
export class DisenoConceptualComponent implements OnInit {
  private projectService = inject(ProjectService);
  private disenoService = inject(DisenoConceptualService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  projectId!: number;
  project: any = {};
  phases: Phase[] = [];
  headerBreadcrumbs: any[] = [];

  isLoading = true;
  error = false;
  isCompleting = false;
  isSaving = false;

  // Data
  nodos: NodoPantalla[] = [];
  wireframes: Wireframe[] = [];
  projectChecklist: DisenoConceptualChecklistItem[] = [];

  // Filter & View mode
  currentView: 'kanban' | 'list' = 'kanban';
  searchTerm: string = '';
  selectedModuloFilter: string = 'todos';

  // Kanban Columns
  altaNodos: NodoPantalla[] = [];
  mediaNodos: NodoPantalla[] = [];
  bajaNodos: NodoPantalla[] = [];
  sinPrioridadNodos: NodoPantalla[] = [];

  // Modals state
  showCreateScreenModal = false;
  isEditingScreen = false;
  editingScreenId: number | null = null;

  // Dynamic Modules
  customModules: string[] = [];
  showNewModuleModal = false;
  newModuleNameInput = '';

  get dynamicModules(): string[] {
    const fromNodes = this.nodos.map(n => n.icono).filter(Boolean) as string[];
    const combined = Array.from(new Set([...this.customModules, ...fromNodes]));
    return combined;
  }

  screenForm = {
    nombre: '',
    modulo: '',
    prioridad: 'alta' as 'alta' | 'media' | 'baja',
    descripcion: ''
  };

  // Inspector Modal state
  showInspectorModal = false;
  inspectingNode: NodoPantalla | null = null;
  inspectingWireframe: Wireframe | null = null;
  activeWireframeChecklist: WireframeChecklistItem[] = [];
  newChecklistItemText = '';
  activeInspectorTab: 'aesthetic' | 'functional' | 'ngo' = 'aesthetic';
  isUploadingWireframe = false;

  // --- Ngo 2003 metrics state ---
  ngoResult: any = null;
  isLoadingNgo = false;
  ngoError: string | null = null;

  get formattedStatus(): string {
    const status = this.project?.status;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  // --- STATS COMPUTED ---
  get totalScreensCount(): number {
    return this.nodos.length;
  }

  get highPriorityCount(): number {
    return this.altaNodos.length;
  }

  get mediumPriorityCount(): number {
    return this.mediaNodos.length;
  }

  get lowPriorityCount(): number {
    return this.bajaNodos.length;
  }

  get wireframesAttachedCount(): number {
    const nodeIds = new Set(this.nodos.map(n => n.id));
    return this.wireframes.filter(w => w.nodo_id && nodeIds.has(w.nodo_id)).length;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = Number(idParam);
        this.loadProject(this.projectId);
        this.loadPhaseData();
      } else {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private loadProject(projectId: number): void {
    this.projectService.getProjectById(projectId).subscribe({
      next: (projectData: any) => {
        this.project = {
          id: projectData.id,
          title: projectData.nombre,
          status: projectData.estado,
          type: projectData.tipo,
          client: projectData.cliente?.nombre || 'Sin cliente asignado'
        };

        this.headerBreadcrumbs = [
          { label: 'Inicio', url: '/' },
          { label: 'Proyectos', url: '/projects' },
          { label: this.project.title, active: true }
        ];

        const currentPhaseId = projectData?.fase_actual_id || 1;
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: currentPhaseId > 1 ? 'completed' : (currentPhaseId === 1 ? 'active' : 'upcoming') },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: currentPhaseId > 2 ? 'completed' : (currentPhaseId === 2 ? 'active' : 'upcoming') },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: currentPhaseId > 3 ? 'completed' : (currentPhaseId === 3 ? 'active' : 'upcoming') },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: currentPhaseId > 4 ? 'completed' : (currentPhaseId === 4 ? 'active' : 'upcoming') },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: currentPhaseId > 5 ? 'completed' : (currentPhaseId === 5 ? 'active' : 'upcoming') }
        ];
      },
      error: () => {
        this.project = {
          title: 'Proyecto',
          status: 'En progreso',
          type: 'Web',
          client: 'Cliente Interno'
        };
      }
    });
  }

  loadPhaseData(): void {
    this.isLoading = true;

    forkJoin({
      nodos: this.disenoService.getNodos(this.projectId).pipe(catchError(() => of([]))),
      wireframes: this.disenoService.getWireframes(this.projectId).pipe(catchError(() => of([]))),
      checklist: this.disenoService.getProjectChecklist(this.projectId).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.nodos = res.nodos || [];
        this.wireframes = (res.wireframes || []).map(w => {
          if (w.archivo_url && !w.base64Data) {
            w.base64Data = environment.apiUrl + w.archivo_url;
          }
          return w;
        });
        this.projectChecklist = res.checklist || [];

        // Cargar módulos personalizados guardados
        const savedModules = localStorage.getItem('custom_modules_' + this.projectId);
        if (savedModules) {
          try {
            this.customModules = JSON.parse(savedModules);
          } catch (e) {}
        }

        this.organizeColumns();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de Fase 2', err);
        this.isLoading = false;
      }
    });
  }

  organizeColumns(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const moduloFilter = this.selectedModuloFilter;

    const filtered = this.nodos.filter(n => {
      const matchSearch = !search ||
        (n.nombre && n.nombre.toLowerCase().includes(search)) ||
        (n.descripcion && n.descripcion.toLowerCase().includes(search)) ||
        (n.icono && n.icono.toLowerCase().includes(search));

      const matchModulo = moduloFilter === 'todos' || (n.icono && n.icono === moduloFilter);

      return matchSearch && matchModulo;
    });

    this.altaNodos = filtered.filter(n => n.prioridad === 'alta');
    this.mediaNodos = filtered.filter(n => n.prioridad === 'media');
    this.bajaNodos = filtered.filter(n => n.prioridad === 'baja');
    this.sinPrioridadNodos = filtered.filter(n => !n.prioridad);
  }

  onSearchChange(): void {
    this.organizeColumns();
  }

  onModuloFilterChange(modulo: string): void {
    this.selectedModuloFilter = modulo;
    this.organizeColumns();
  }

  // --- DRAG & DROP ENTRE COLUMNAS KANBAN ---
  onCardDrop(event: CdkDragDrop<NodoPantalla[]>, targetPriority: 'alta' | 'media' | 'baja'): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const movedItem = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      movedItem.prioridad = targetPriority;

      if (movedItem.id) {
        this.disenoService.updateNodo(this.projectId, movedItem.id, {
          prioridad: targetPriority
        }).subscribe({
          error: (err) => console.error('Error al actualizar prioridad', err)
        });
      }
    }
  }

  // --- WIREFRAME HELPERS ---
  getWireframeForNode(nodeId?: number): Wireframe | undefined {
    if (!nodeId) return undefined;
    return this.wireframes.find(w => w.nodo_id === nodeId);
  }

  uploadWireframeForNode(event: any, nodo: NodoPantalla): void {
    const file = event.target.files?.[0];
    if (!file || !nodo.id) return;

    this.isUploadingWireframe = true;

    this.disenoService.createWireframe(this.projectId, file, nodo.id).subscribe({
      next: (wf: Wireframe) => {
        if (wf.archivo_url) {
          wf.base64Data = environment.apiUrl + wf.archivo_url;
        }
        wf.nodo_id = nodo.id;

        // Remove any existing wireframe mapped to this node
        this.wireframes = this.wireframes.filter(w => w.nodo_id !== nodo.id);
        this.wireframes.unshift(wf);

        this.isUploadingWireframe = false;
        event.target.value = '';
      },
      error: (err) => {
        console.error('Error subiendo wireframe', err);
        this.isUploadingWireframe = false;
        alert('Hubo un error al subir el wireframe.');
      }
    });
  }

  deleteWireframe(wireframeId?: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (!wireframeId) return;

    if (!confirm('¿Deseas eliminar este wireframe?')) return;

    this.disenoService.deleteWireframe(this.projectId, wireframeId).subscribe({
      next: () => {
        this.wireframes = this.wireframes.filter(w => w.id !== wireframeId);
        if (this.inspectingWireframe?.id === wireframeId) {
          this.closeInspector();
        }
      },
      error: (err) => console.error('Error eliminando wireframe', err)
    });
  }

  // --- GESTIÓN DINÁMICA DE MÓDULOS ---
  getModuleScreensCount(modulo: string): number {
    return this.nodos.filter(n => n.icono === modulo).length;
  }

  addNewModule(): void {
    const name = this.newModuleNameInput.trim();
    if (!name) return;
    if (!this.dynamicModules.includes(name)) {
      this.customModules.push(name);
      localStorage.setItem('custom_modules_' + this.projectId, JSON.stringify(this.customModules));
    }
    this.selectedModuloFilter = name;
    this.newModuleNameInput = '';
    this.showNewModuleModal = false;
    this.organizeColumns();
  }

  deleteModule(modulo: string, event?: Event): void {
    if (event) event.stopPropagation();
    const count = this.getModuleScreensCount(modulo);
    if (count > 0) {
      alert(`No puedes eliminar el módulo "${modulo}" porque contiene ${count} pantalla(s). Reasigna o elimina esas pantallas primero.`);
      return;
    }
    if (!confirm(`¿Deseas eliminar el módulo "${modulo}"?`)) return;

    this.customModules = this.customModules.filter(m => m !== modulo);
    localStorage.setItem('custom_modules_' + this.projectId, JSON.stringify(this.customModules));
    if (this.selectedModuloFilter === modulo) {
      this.selectedModuloFilter = 'todos';
    }
    this.organizeColumns();
  }

  // --- MODAL CREAR / EDITAR PANTALLA ---
  openCreateScreenModal(defaultPriority: 'alta' | 'media' | 'baja' = 'alta'): void {
    this.isEditingScreen = false;
    this.editingScreenId = null;
    const defaultMod = this.selectedModuloFilter !== 'todos'
      ? this.selectedModuloFilter
      : (this.dynamicModules[0] || 'General');

    this.screenForm = {
      nombre: '',
      modulo: defaultMod,
      prioridad: defaultPriority,
      descripcion: ''
    };
    this.showCreateScreenModal = true;
  }

  openEditScreenModal(nodo: NodoPantalla, event?: Event): void {
    if (event) event.stopPropagation();
    this.isEditingScreen = true;
    this.editingScreenId = nodo.id || null;
    this.screenForm = {
      nombre: nodo.nombre,
      modulo: nodo.icono || (this.dynamicModules[0] || 'General'),
      prioridad: (nodo.prioridad as 'alta' | 'media' | 'baja') || 'alta',
      descripcion: nodo.descripcion || ''
    };
    this.showCreateScreenModal = true;
  }

  closeCreateScreenModal(): void {
    this.showCreateScreenModal = false;
  }

  saveScreen(): void {
    if (!this.screenForm.nombre.trim()) {
      alert('Por favor ingresa un nombre para la pantalla.');
      return;
    }

    this.isSaving = true;

    if (this.isEditingScreen && this.editingScreenId) {
      // Actualizar
      this.disenoService.updateNodo(this.projectId, this.editingScreenId, {
        nombre: this.screenForm.nombre.trim(),
        icono: this.screenForm.modulo,
        prioridad: this.screenForm.prioridad,
        descripcion: this.screenForm.descripcion.trim(),
        tipo: 'pantalla'
      }).subscribe({
        next: (updated) => {
          const idx = this.nodos.findIndex(n => n.id === this.editingScreenId);
          if (idx !== -1) {
            this.nodos[idx] = { ...this.nodos[idx], ...updated };
            this.organizeColumns();
          }
          this.isSaving = false;
          this.closeCreateScreenModal();
        },
        error: (err) => {
          console.error('Error al actualizar pantalla', err);
          this.isSaving = false;
        }
      });
    } else {
      // Crear nueva
      const newNodo: NodoPantalla = {
        nombre: this.screenForm.nombre.trim(),
        icono: this.screenForm.modulo,
        prioridad: this.screenForm.prioridad,
        descripcion: this.screenForm.descripcion.trim(),
        tipo: 'pantalla',
        pos_x: 0,
        pos_y: 0,
        estado_verificacion: 'pendiente'
      };

      this.disenoService.createNodo(this.projectId, newNodo).subscribe({
        next: (created) => {
          this.nodos.push(created);
          this.organizeColumns();
          this.isSaving = false;
          this.closeCreateScreenModal();
        },
        error: (err) => {
          console.error('Error al crear pantalla', err);
          this.isSaving = false;
        }
      });
    }
  }

  deleteScreen(nodo: NodoPantalla, event?: Event): void {
    if (event) event.stopPropagation();
    if (!nodo.id) return;

    if (!confirm(`¿Eliminar la pantalla "${nodo.nombre}"?`)) return;

    this.disenoService.deleteNodo(this.projectId, nodo.id).subscribe({
      next: () => {
        this.nodos = this.nodos.filter(n => n.id !== nodo.id);
        this.organizeColumns();
      },
      error: (err) => console.error('Error al eliminar pantalla', err)
    });
  }

  // --- INSPECTOR MODAL (VALIDACIÓN ESTÉTICA Y REQUISITOS) ---
  openInspector(nodo: NodoPantalla, event?: Event): void {
    if (event) event.stopPropagation();

    this.inspectingNode = nodo;
    this.inspectingWireframe = this.getWireframeForNode(nodo.id) || null;
    this.activeInspectorTab = 'aesthetic';
    this.showInspectorModal = true;

    if (this.inspectingWireframe?.id) {
      this.loadChecklistForWireframe(this.inspectingWireframe.id);
    } else {
      this.activeWireframeChecklist = [];
    }
  }

  closeInspector(): void {
    this.showInspectorModal = false;
    this.inspectingNode = null;
    this.inspectingWireframe = null;
    this.activeWireframeChecklist = [];
    this.ngoResult = null;
    this.ngoError = null;
  }

  loadChecklistForWireframe(wireframeId: number): void {
    this.disenoService.getWireframeChecklist(this.projectId, wireframeId).subscribe({
      next: (items) => {
        this.activeWireframeChecklist = items || [];
      },
      error: (err) => console.error('Error cargando checklist de wireframe', err)
    });
  }

  toggleWireframeCheck(item: WireframeChecklistItem): void {
    if (!this.inspectingWireframe?.id || !item.id) return;

    const newStatus = item.estado === 'aceptado' ? 'pendiente' : 'aceptado';
    item.estado = newStatus;

    this.disenoService.updateWireframeChecklistItem(
      this.projectId,
      this.inspectingWireframe.id,
      item.id,
      { estado: newStatus }
    ).subscribe({
      error: () => {
        // Revertir si hay error
        item.estado = newStatus === 'aceptado' ? 'pendiente' : 'aceptado';
      }
    });
  }

  addWireframeChecklistItem(): void {
    if (!this.newChecklistItemText.trim() || !this.inspectingWireframe?.id) return;

    const newItem: WireframeChecklistItem = {
      pregunta: this.newChecklistItemText.trim(),
      origen: 'manual',
      estado: 'pendiente'
    };

    this.disenoService.createWireframeChecklistItem(this.projectId, this.inspectingWireframe.id, newItem).subscribe({
      next: (created) => {
        this.activeWireframeChecklist.push(created);
        this.newChecklistItemText = '';
      },
      error: (err) => console.error('Error al agregar item de checklist', err)
    });
  }

  toggleProjectCheck(item: DisenoConceptualChecklistItem): void {
    if (!item.id) return;
    const newStatus = item.estado === 'aceptado' ? 'pendiente' : 'aceptado';
    item.estado = newStatus;

    this.disenoService.updateProjectChecklistItem(this.projectId, item.id, { estado: newStatus }).subscribe({
      error: () => {
        item.estado = newStatus === 'aceptado' ? 'pendiente' : 'aceptado';
      }
    });
  }

  navigateInspector(direction: 'prev' | 'next'): void {
    if (!this.inspectingNode) return;
    const currentIndex = this.nodos.findIndex(n => n.id === this.inspectingNode?.id);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0) targetIndex = this.nodos.length - 1;
    if (targetIndex >= this.nodos.length) targetIndex = 0;

    const targetNode = this.nodos[targetIndex];
    this.openInspector(targetNode);
  }

  getAestheticChecklistStats(): { completed: number, total: number, percent: number } {
    const total = this.activeWireframeChecklist.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = this.activeWireframeChecklist.filter(c => c.estado === 'aceptado').length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  // --- NGO ET AL. 2003 EVALUATION ---
  evaluateNgo(): void {
    if (!this.inspectingWireframe?.id) return;
    this.isLoadingNgo = true;
    this.ngoResult = null;
    this.ngoError = null;

    this.disenoService.evaluateWireframeNgo(this.projectId, this.inspectingWireframe.id).subscribe({
      next: (result) => {
        this.ngoResult = result;
        this.isLoadingNgo = false;
      },
      error: (err) => {
        this.ngoError = err?.error?.detail || 'Error al calcular las métricas de Ngo.';
        this.isLoadingNgo = false;
      }
    });
  }

  getNgoPercent(value: number): number {
    return Math.round((value || 0) * 100);
  }

  getNgoBarClass(value: number): string {
    if (value >= 0.75) return 'bg-success';
    if (value >= 0.50) return 'bg-warning';
    return 'bg-danger';
  }

  // --- AVANZAR A FASE 3 ---
  completePhase(): void {
    if (!this.projectId) return;

    if (this.nodos.length === 0) {
      alert('Por favor agrega al menos una pantalla en la arquitectura conceptual antes de avanzar.');
      return;
    }

    if (this.altaNodos.length === 0) {
      if (!confirm('No tienes ninguna pantalla clasificada con Prioridad Alta (MVP). ¿Deseas continuar de todas formas?')) {
        return;
      }
    }

    this.isCompleting = true;

    this.projectService.updateProject(this.projectId, { fase_actual_id: 3 }).subscribe({
      next: () => {
        this.isCompleting = false;
        this.router.navigate(['/framework/projects', this.projectId, 'visual']);
      },
      error: (err) => {
        console.error('Error al avanzar fase', err);
        this.isCompleting = false;
        alert('Ocurrió un error al intentar avanzar a la Fase 3.');
      }
    });
  }
}
