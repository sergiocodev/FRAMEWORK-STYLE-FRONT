import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  DisenoConceptualChecklistItem,
  RestructuringResult,
  BoundingBoxElemento,
  DefectoEstructural,
  CuadranteInfo,
  RecomendacionMaterial
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
export class DisenoConceptualComponent implements OnInit, OnDestroy {
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
  selectedTypeFilter: 'todos' | 'pantalla' | 'modulo' | 'componente' = 'todos';
  selectedParentScreenFilter: string = 'todos';

  // Kanban Columns
  altaNodos: NodoPantalla[] = [];
  mediaNodos: NodoPantalla[] = [];
  bajaNodos: NodoPantalla[] = [];
  filteredNodos: NodoPantalla[] = [];
  sinPrioridadNodos: NodoPantalla[] = [];

  // Modals state
  showCreateScreenModal = false;
  isEditingScreen = false;
  editingScreenId: number | null = null;

  // Dynamic Modules / Categories
  customModules: string[] = [];
  showNewModuleModal = false;
  newModuleNameInput = '';

  get dynamicModules(): string[] {
    const fromNodes = this.nodos.map(n => n.icono).filter(Boolean) as string[];
    const combined = Array.from(new Set([...this.customModules, ...fromNodes]));
    return combined;
  }

  get availableScreens(): NodoPantalla[] {
    return this.nodos.filter(n => (n.tipo || 'pantalla') === 'pantalla');
  }

  screenForm = {
    nombre: '',
    tipo: 'pantalla' as 'pantalla' | 'modulo' | 'componente',
    modulo: 'General',
    parentPantalla: '',
    prioridad: 'alta' as 'alta' | 'media' | 'baja',
    descripcion: ''
  };

  // Inspector Modal state
  showInspectorModal = false;
  inspectingNode: NodoPantalla | null = null;
  inspectingWireframe: Wireframe | null = null;
  activeWireframeChecklist: WireframeChecklistItem[] = [];
  newChecklistItemText = '';
  activeInspectorTab: 'aesthetic' | 'functional' | 'ngo' | 'restructure' = 'aesthetic';

  // --- MUIDesigner 2022 Aesthetic Restructuring state ---
  restructuringResult: RestructuringResult | null = null;
  isLoadingRestructuring = false;
  restructuringError: string | null = null;
  overlayViewMode: 'none' | 'original' | 'restructured' | 'comparison' = 'original';
  showQuadrantsGuide = true;
  selectedQuadrantFilter: 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'ALL';
  prunedElementIds: Set<string> = new Set<string>();
  copyCssSuccess = false;
  isUploadingWireframe = false;

  // Step workflow para Optimización de Layout Móvil:
  restructuringStep: 'diagnostico' | 'optimizado' = 'diagnostico';

  // Controles de superposición para Diagnóstico de Composición (Web / General):
  showNgoBoxes = true;
  showNgoQuadrants = true;

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

  // Map de estados de evaluación por wireframeId para actualización reactiva en la vista
  wireframeEvaluationMap: Map<number, { isEvaluated: boolean; completed: number; total: number; percent: number }> = new Map();

  isWireframeEvaluated(wireframeId?: number): boolean {
    if (!wireframeId) return false;
    const stat = this.wireframeEvaluationMap.get(wireframeId);
    return stat ? stat.isEvaluated : false;
  }

  getWireframeProgress(wireframeId?: number): { isEvaluated: boolean; completed: number; total: number; percent: number } {
    if (!wireframeId) return { isEvaluated: false, completed: 0, total: 0, percent: 0 };
    return this.wireframeEvaluationMap.get(wireframeId) || { isEvaluated: false, completed: 0, total: 0, percent: 0 };
  }

  get evaluatedWireframesCount(): number {
    let count = 0;
    const nodeIds = new Set(this.nodos.map(n => n.id));
    for (const wf of this.wireframes) {
      if (wf.id && wf.nodo_id && nodeIds.has(wf.nodo_id)) {
        if (this.isWireframeEvaluated(wf.id)) count++;
      }
    }
    return count;
  }

  private updateWireframeEvaluationCache(wireframeId: number, items: WireframeChecklistItem[]): void {
    const total = items.length;
    const completed = items.filter(c => c.estado === 'aceptado').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    // Se considera evaluado si tiene algún ítem aceptado o si se guardó evaluación de composición
    const hasNgoSaved = !!localStorage.getItem(`ngo_eval_${this.projectId}_${wireframeId}`);
    const hasRestructureSaved = !!localStorage.getItem(`restruct_eval_${this.projectId}_${wireframeId}`);
    const isEvaluated = completed > 0 || hasNgoSaved || hasRestructureSaved;

    this.wireframeEvaluationMap.set(wireframeId, { isEvaluated, completed, total, percent });
  }

  // --- STATS COMPUTED ---
  get totalElementsCount(): number {
    return this.nodos.length;
  }

  get totalScreensCount(): number {
    return this.nodos.filter(n => (n.tipo || 'pantalla') === 'pantalla').length;
  }

  get totalModulesCount(): number {
    return this.nodos.filter(n => n.tipo === 'modulo').length;
  }

  get totalComponentsCount(): number {
    return this.nodos.filter(n => n.tipo === 'componente').length;
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

        // Cargar listas de chequeo y evaluaciones de los wireframes para actualizar indicadores reactivos
        this.wireframes.forEach(wf => {
          if (wf.id) {
            this.disenoService.getWireframeChecklist(this.projectId, wf.id).subscribe({
              next: (items) => this.updateWireframeEvaluationCache(wf.id!, items || []),
              error: () => this.updateWireframeEvaluationCache(wf.id!, [])
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar datos de Fase 2', err);
        this.isLoading = false;
      }
    });
  }

  organizeColumns(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const typeFilter = this.selectedTypeFilter;
    const parentFilter = this.selectedParentScreenFilter;
    const moduloFilter = this.selectedModuloFilter;

    const filtered = this.nodos.filter(n => {
      const nodoType = (n.tipo || 'pantalla') as 'pantalla' | 'modulo' | 'componente';
      const matchSearch = !search ||
        (n.nombre && n.nombre.toLowerCase().includes(search)) ||
        (n.descripcion && n.descripcion.toLowerCase().includes(search)) ||
        (n.icono && n.icono.toLowerCase().includes(search));

      const matchType = typeFilter === 'todos' || nodoType === typeFilter;

      const matchParent = parentFilter === 'todos' ||
        (nodoType === 'pantalla' && n.nombre === parentFilter) ||
        (n.icono && n.icono === parentFilter);

      const matchModulo = moduloFilter === 'todos' || (n.icono && n.icono === moduloFilter);

      return matchSearch && matchType && matchParent && matchModulo;
    });

    this.altaNodos = filtered.filter(n => n.prioridad === 'alta');
    this.mediaNodos = filtered.filter(n => n.prioridad === 'media');
    this.bajaNodos = filtered.filter(n => n.prioridad === 'baja');
    this.sinPrioridadNodos = filtered.filter(n => !n.prioridad);
    this.filteredNodos = filtered;
  }

  setTypeFilter(type: 'todos' | 'pantalla' | 'modulo' | 'componente'): void {
    this.selectedTypeFilter = type;
    this.organizeColumns();
  }

  onParentScreenFilterChange(parent: string): void {
    this.selectedParentScreenFilter = parent;
    this.organizeColumns();
  }

  onSearchChange(): void {
    this.organizeColumns();
  }

  onModuloFilterChange(modulo: string): void {
    this.selectedModuloFilter = modulo;
    this.organizeColumns();
  }

  getNodeTypeInfo(nodo: NodoPantalla): { label: string; badgeClass: string; type: 'pantalla' | 'modulo' | 'componente' } {
    const tipo = (nodo.tipo as 'pantalla' | 'modulo' | 'componente') || 'pantalla';
    if (tipo === 'modulo') {
      return { label: 'Módulo', badgeClass: 'bg-indigo bg-opacity-10 text-indigo border border-indigo border-opacity-25', type: 'modulo' };
    }
    if (tipo === 'componente') {
      return { label: 'Componente UI', badgeClass: 'bg-purple bg-opacity-10 text-purple border border-purple border-opacity-25', type: 'componente' };
    }
    return { label: 'Pantalla', badgeClass: 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25', type: 'pantalla' };
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
          nombre: movedItem.nombre,
          tipo: movedItem.tipo,
          icono: movedItem.icono,
          prioridad: targetPriority
        }).subscribe({
          next: () => {
            const n = this.nodos.find(item => item.id === movedItem.id);
            if (n) n.prioridad = targetPriority;
          },
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

  // --- MODAL CREAR / EDITAR ELEMENTO (PANTALLA / MÓDULO / COMPONENTE) ---
  openCreateScreenModal(defaultPriority: 'alta' | 'media' | 'baja' = 'alta', defaultType: 'pantalla' | 'modulo' | 'componente' = 'pantalla'): void {
    this.isEditingScreen = false;
    this.editingScreenId = null;
    const defaultParent = this.selectedParentScreenFilter !== 'todos'
      ? this.selectedParentScreenFilter
      : (this.availableScreens[0]?.nombre || 'Global (Reusable)');

    this.screenForm = {
      nombre: '',
      tipo: defaultType,
      modulo: 'General',
      parentPantalla: defaultParent,
      prioridad: defaultPriority,
      descripcion: ''
    };
    this.showCreateScreenModal = true;
  }

  openEditScreenModal(nodo: NodoPantalla, event?: Event): void {
    if (event) event.stopPropagation();
    this.isEditingScreen = true;
    this.editingScreenId = nodo.id || null;
    const tipo = (nodo.tipo as 'pantalla' | 'modulo' | 'componente') || 'pantalla';
    this.screenForm = {
      nombre: nodo.nombre,
      tipo: tipo,
      modulo: nodo.icono || 'General',
      parentPantalla: nodo.icono || (this.availableScreens[0]?.nombre || 'Global (Reusable)'),
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
      alert('Por favor ingresa un nombre para el elemento de interfaz.');
      return;
    }

    this.isSaving = true;
    const parentVal = this.screenForm.tipo === 'pantalla'
      ? (this.screenForm.modulo || 'General')
      : (this.screenForm.parentPantalla || 'Global (Reusable)');

    if (this.isEditingScreen && this.editingScreenId) {
      // Actualizar
      this.disenoService.updateNodo(this.projectId, this.editingScreenId, {
        nombre: this.screenForm.nombre.trim(),
        tipo: this.screenForm.tipo,
        icono: parentVal,
        prioridad: this.screenForm.prioridad,
        descripcion: this.screenForm.descripcion.trim()
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
          console.error('Error al actualizar elemento', err);
          this.isSaving = false;
        }
      });
    } else {
      // Crear nueva
      const newNodo: NodoPantalla = {
        nombre: this.screenForm.nombre.trim(),
        tipo: this.screenForm.tipo,
        icono: parentVal,
        prioridad: this.screenForm.prioridad,
        descripcion: this.screenForm.descripcion.trim(),
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
          console.error('Error al crear elemento', err);
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
      const wfId = this.inspectingWireframe.id;
      // Recuperar evaluación de Ngo previa si existe en storage
      const savedNgo = localStorage.getItem(`ngo_eval_${this.projectId}_${wfId}`);
      if (savedNgo) {
        try { this.ngoResult = JSON.parse(savedNgo); } catch (e) { this.ngoResult = null; }
      } else {
        this.ngoResult = null;
      }

      // Recuperar reestructuración previa si existe en storage
      const savedRestruct = localStorage.getItem(`restruct_eval_${this.projectId}_${wfId}`);
      if (savedRestruct) {
        try { this.restructuringResult = JSON.parse(savedRestruct); } catch (e) { this.restructuringResult = null; }
      } else {
        this.restructuringResult = null;
      }

      this.loadChecklistForWireframe(wfId);
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
    this.restructuringResult = null;
    this.restructuringError = null;
    this.prunedElementIds.clear();
    this.selectedQuadrantFilter = 'ALL';
    this.restructuringStep = 'diagnostico';
  }

  loadChecklistForWireframe(wireframeId: number): void {
    this.disenoService.getWireframeChecklist(this.projectId, wireframeId).subscribe({
      next: (items) => {
        this.activeWireframeChecklist = items || [];
        this.updateWireframeEvaluationCache(wireframeId, this.activeWireframeChecklist);
      },
      error: (err) => console.error('Error cargando checklist de wireframe', err)
    });
  }

  toggleWireframeCheck(item: WireframeChecklistItem): void {
    if (!this.inspectingWireframe?.id || !item.id) return;
    const wfId = this.inspectingWireframe.id;

    const newStatus = item.estado === 'aceptado' ? 'pendiente' : 'aceptado';
    item.estado = newStatus;
    this.updateWireframeEvaluationCache(wfId, this.activeWireframeChecklist);

    this.disenoService.updateWireframeChecklistItem(
      this.projectId,
      wfId,
      item.id,
      { estado: newStatus }
    ).subscribe({
      next: () => {
        this.updateWireframeEvaluationCache(wfId, this.activeWireframeChecklist);
      },
      error: () => {
        // Revertir si hay error
        item.estado = newStatus === 'aceptado' ? 'pendiente' : 'aceptado';
        this.updateWireframeEvaluationCache(wfId, this.activeWireframeChecklist);
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
        if (this.inspectingWireframe?.id) {
          localStorage.setItem(`ngo_eval_${this.projectId}_${this.inspectingWireframe.id}`, JSON.stringify(result));
          this.updateWireframeEvaluationCache(this.inspectingWireframe.id, this.activeWireframeChecklist);
        }
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


  // --- OPTIMIZACIÓN DE LAYOUT MÓVIL ---
  runRestructuring(): void {
    if (!this.inspectingWireframe?.id) return;
    this.isLoadingRestructuring = true;
    this.restructuringResult = null;
    this.restructuringError = null;
    this.prunedElementIds.clear();
    this.restructuringStep = 'diagnostico';

    this.disenoService.restructureWireframe(this.projectId, this.inspectingWireframe.id).subscribe({
      next: (result) => {
        this.restructuringResult = result;
        this.isLoadingRestructuring = false;
        // Iniciar en modo diagnóstico mostrando los elementos actuales en rojo
        this.overlayViewMode = 'original';
        this.restructuringStep = 'diagnostico';
        if (this.inspectingWireframe?.id) {
          localStorage.setItem(`restruct_eval_${this.projectId}_${this.inspectingWireframe.id}`, JSON.stringify(result));
          this.updateWireframeEvaluationCache(this.inspectingWireframe.id, this.activeWireframeChecklist);
        }
      },
      error: (err) => {
        this.restructuringError = err?.error?.detail || 'Error al analizar la estructura del wireframe.';
        this.isLoadingRestructuring = false;
      }
    });
  }

  setRestructuringStep(step: 'diagnostico' | 'optimizado'): void {
    this.restructuringStep = step;
    if (step === 'diagnostico') {
      this.overlayViewMode = 'original';
    } else {
      this.overlayViewMode = 'restructured';
    }
  }

  applyRestructuringProposal(): void {
    this.setRestructuringStep('optimizado');
  }

  toggleNgoBoxes(): void {
    this.showNgoBoxes = !this.showNgoBoxes;
  }

  toggleNgoQuadrants(): void {
    this.showNgoQuadrants = !this.showNgoQuadrants;
  }

  getStructuralScoreBadge(score: number): { label: string; class: string } {
    if (score <= 4.0) return { label: 'Óptima (Simétrica)', class: 'bg-success text-white' };
    if (score < 8.0) return { label: 'Aceptable (Regular)', class: 'bg-warning text-dark' };
    return { label: 'Alta Dispersión', class: 'bg-danger text-white' };
  }

  setOverlayViewMode(mode: 'none' | 'original' | 'restructured' | 'comparison'): void {
    this.overlayViewMode = mode;
  }

  toggleQuadrantGuide(): void {
    this.showQuadrantsGuide = !this.showQuadrantsGuide;
  }

  togglePruneElement(elemId?: string): void {
    if (!elemId) return;
    if (this.prunedElementIds.has(elemId)) {
      this.prunedElementIds.delete(elemId);
    } else {
      this.prunedElementIds.add(elemId);
    }
  }

  isElementPruned(elemId?: string): boolean {
    return !!elemId && this.prunedElementIds.has(elemId);
  }

  filterQuadrant(quadrantCode: 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'): void {
    this.selectedQuadrantFilter = quadrantCode;
  }

  getFilteredOriginalBoxes(): BoundingBoxElemento[] {
    if (!this.restructuringResult?.original_boxes) return [];
    return this.restructuringResult.original_boxes.filter(b => {
      if (this.selectedQuadrantFilter !== 'ALL' && b.cuadrante !== this.selectedQuadrantFilter) {
        return false;
      }
      return true;
    });
  }

  getFilteredRestructuredBoxes(): BoundingBoxElemento[] {
    if (!this.restructuringResult?.restructured_boxes) return [];
    return this.restructuringResult.restructured_boxes.filter(b => {
      if (this.selectedQuadrantFilter !== 'ALL' && b.cuadrante !== this.selectedQuadrantFilter) {
        return false;
      }
      return !this.isElementPruned(b.id);
    });
  }

  copyCssCode(): void {
    if (!this.restructuringResult?.css_export) return;
    navigator.clipboard.writeText(this.restructuringResult.css_export).then(() => {
      this.copyCssSuccess = true;
      setTimeout(() => {
        this.copyCssSuccess = false;
      }, 2500);
    });
  }

  // --- PROPUESTA CONCEPTUAL (DOCUMENTO DE SALIDA DE FASE 2) ---
  showPropuestaModal = false;
  today: Date = new Date();

  get highPriorityNodos(): NodoPantalla[] {
    return this.nodos.filter(n => n.prioridad === 'alta');
  }

  get mediumPriorityNodos(): NodoPantalla[] {
    return this.nodos.filter(n => n.prioridad === 'media');
  }

  get lowPriorityNodos(): NodoPantalla[] {
    return this.nodos.filter(n => n.prioridad === 'baja');
  }

  openPropuestaConceptualModal(): void {
    this.showPropuestaModal = true;
    document.body.classList.add('modal-propuesta-open');
  }

  closePropuestaConceptualModal(): void {
    this.showPropuestaModal = false;
    document.body.classList.remove('modal-propuesta-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-propuesta-open');
  }



  printPropuesta(): void {
    document.body.classList.add('modal-propuesta-open');
    setTimeout(() => {
      window.print();
    }, 100);
  }

  getModulesForScreen(screenName: string): NodoPantalla[] {
    return this.nodos.filter(n => n.tipo === 'modulo' && n.icono === screenName);
  }

  getComponentsForScreen(screenName: string): NodoPantalla[] {
    return this.nodos.filter(n => n.tipo === 'componente' && n.icono === screenName);
  }

  get globalComponents(): NodoPantalla[] {
    return this.nodos.filter(n => n.tipo === 'componente' && (!n.icono || n.icono === 'Global (Reusable)' || n.icono === 'General'));
  }

  get unassignedModules(): NodoPantalla[] {
    const screenNames = new Set(this.availableScreens.map(s => s.nombre));
    return this.nodos.filter(n => n.tipo === 'modulo' && (!n.icono || !screenNames.has(n.icono)));
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
