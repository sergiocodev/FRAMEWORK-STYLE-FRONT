import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router, ParamMap } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { environment } from '../../../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  ChecklistItem,
  SubcriterioItem,
  HeuristicState,
  Hallazgo,
  HallazgoCreateRequest,
  PantallaFase4Item
} from '../../../../../models/assessment.model';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-assessment-heuristic-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './assessment-heuristic-review.component.html',
  styleUrl: './assessment-heuristic-review.component.scss'
})
export class AssessmentHeuristicReviewComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private assessmentService: AssessmentService = inject(AssessmentService);
  private projectService: ProjectService = inject(ProjectService);

  projectId: number = 1;
  project: any = null;
  assessment: EvaluacionEsteticaResponse | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isSyncingFase4: boolean = false;

  phases: any[] = [
    { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: 'completed' },
    { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: 'completed' },
    { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: 'completed' },
    { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: 'completed' },
    { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: 'active' }
  ];

  headerBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos', url: '/projects' },
    { label: 'Evaluación Estética', url: '/framework/projects/1/evaluacion' },
    { label: 'Revisión Heurística Gestalt', active: true }
  ];

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  // Toast message
  toastMessage: string | null = null;
  private toastTimeout: any;

  // Heuristic State & Accordion
  expandedHeuristicIds: Set<string> = new Set<string>();
  selectedScreenFilter: number | 'todas' = 'todas';
  editingObservacionId: string | null = null;
  tempObservacionText: string = '';

  // Step-by-step Focused Navigation
  activeHeuristicIndex: number = 0;

  get checklistItems(): ChecklistItem[] {
    return this.assessment?.checklist || [];
  }

  get activeHeuristicItem(): ChecklistItem | null {
    const list = this.checklistItems;
    if (list.length === 0) return null;
    if (this.activeHeuristicIndex < 0) this.activeHeuristicIndex = 0;
    if (this.activeHeuristicIndex >= list.length) this.activeHeuristicIndex = list.length - 1;
    return list[this.activeHeuristicIndex] || null;
  }

  setActiveHeuristicIndex(index: number): void {
    const list = this.checklistItems;
    if (index >= 0 && index < list.length) {
      this.activeHeuristicIndex = index;
    }
  }

  prevHeuristic(): void {
    if (this.activeHeuristicIndex > 0) {
      this.activeHeuristicIndex--;
    }
  }

  nextHeuristic(): void {
    if (this.activeHeuristicIndex < this.checklistItems.length - 1) {
      this.activeHeuristicIndex++;
    }
  }

  // Fase 4 Integration & Screen Viewer
  activeScreen: PantallaFase4Item | null = null;
  activeScreenId: number | null = null;
  viewerMode: 'contain' | 'width' | 'natural' = 'contain';
  selectedPantalla: PantallaFase4Item | null = null;
  isScreenModalOpen: boolean = false;

  // Add finding modal
  isAddModalOpen: boolean = false;
  newFinding: HallazgoCreateRequest = {
    problema: '',
    severidad: 'mayor',
    fase_origen: 3,
    fase_origen_nombre: 'Diseño Visual'
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = Number(idParam);
      }
      this.headerBreadcrumbs = [
        { label: 'Inicio', url: '/' },
        { label: 'Proyectos', url: '/projects' },
        { label: 'Evaluación Estética', url: `/framework/projects/${this.projectId}/evaluacion` },
        { label: 'Revisión Heurística Gestalt', active: true }
      ];

      this.loadProject();
      this.loadAssessment();
    });
  }

  loadProject(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (res: any) => {
        this.project = {
          ...res,
          title: res.nombre,
          status: res.estado,
          type: res.tipo,
          client: res.cliente?.nombre || 'Cliente Interno'
        };

        this.headerBreadcrumbs = [
          { label: 'Inicio', url: '/' },
          { label: 'Proyectos', url: '/projects' },
          { label: this.project.title || 'Evaluación Estética', url: `/framework/projects/${this.projectId}/evaluacion` },
          { label: 'Revisión Heurística Gestalt', active: true }
        ];

        const currentPhaseId = res.fase_actual_id || 5;
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: currentPhaseId > 1 ? 'completed' : (currentPhaseId === 1 ? 'active' : 'upcoming') },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: currentPhaseId > 2 ? 'completed' : (currentPhaseId === 2 ? 'active' : 'upcoming') },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: currentPhaseId > 3 ? 'completed' : (currentPhaseId === 3 ? 'active' : 'upcoming') },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: currentPhaseId > 4 ? 'completed' : (currentPhaseId === 4 ? 'active' : 'upcoming') },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: currentPhaseId >= 5 ? 'active' : 'upcoming' }
        ];
      },
      error: (err: any) => {
        console.error('Error al cargar proyecto:', err);
      }
    });
  }

  loadAssessment(): void {
    this.isLoading = true;
    this.assessmentService.getAssessment(this.projectId).subscribe({
      next: (data: EvaluacionEsteticaResponse) => {
        this.assessment = data;
        this.isLoading = false;

        // Auto-seleccionar la primera pantalla si no hay una activa
        if (!this.activeScreen && this.pantallasFase4.length > 0) {
          this.setActiveScreen(this.pantallasFase4[0]);
        }

        // Auto-expandir el primer principio por comodidad del evaluador
        if (this.expandedHeuristicIds.size === 0 && data.checklist?.length > 0) {
          this.expandedHeuristicIds.add(data.checklist[0].id);
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evaluación:', err);
        this.isLoading = false;
      }
    });
  }

  toggleHeuristicAccordion(id: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.expandedHeuristicIds.has(id)) {
      this.expandedHeuristicIds.delete(id);
    } else {
      this.expandedHeuristicIds.add(id);
    }
  }

  isHeuristicExpanded(id: string): boolean {
    return this.expandedHeuristicIds.has(id);
  }

  setHeuristicState(item: ChecklistItem, state: HeuristicState, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.assessment) return;

    const previousState = item.estado || (item.cumple ? 'cumple' : 'no_cumple');
    item.estado = state;
    item.cumple = (state === 'cumple');

    this.assessmentService.updateChecklistItem(this.projectId, item.id, {
      estado: state,
      cumple: item.cumple
    }).subscribe({
      next: (updated: EvaluacionEsteticaResponse) => {
        this.assessment = updated;
        const labels: Record<HeuristicState, string> = {
          'cumple': 'Cumple totalmente',
          'parcial': 'Cumple parcialmente',
          'no_cumple': 'No cumple',
          'no_aplica': 'No aplica (excluido)'
        };
        this.showToast(`${item.titulo}: ${labels[state]}`);
      },
      error: (err: any) => {
        console.error('Error al actualizar estado heurístico:', err);
        item.estado = previousState;
        item.cumple = (previousState === 'cumple');
      }
    });
  }

  toggleSubcriterio(item: ChecklistItem, sub: SubcriterioItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.assessment) return;

    sub.cumple = !sub.cumple;

    const subs = item.subcriterios || [];
    const totalSubs = subs.length;
    const cumplidosSubs = subs.filter(s => s.cumple).length;
    let newState: HeuristicState = 'no_cumple';
    if (cumplidosSubs === totalSubs && totalSubs > 0) {
      newState = 'cumple';
    } else if (cumplidosSubs > 0) {
      newState = 'parcial';
    }
    item.estado = newState;
    item.cumple = (newState === 'cumple');

    this.assessmentService.updateChecklistItem(this.projectId, item.id, {
      subcriterio_id: sub.id,
      subcriterio_cumple: sub.cumple,
      estado: newState
    }).subscribe({
      next: (updated: EvaluacionEsteticaResponse) => {
        this.assessment = updated;
      },
      error: (err: any) => {
        console.error('Error al conmutar subcriterio:', err);
        sub.cumple = !sub.cumple;
      }
    });
  }

  startEditObservacion(item: ChecklistItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.editingObservacionId = item.id;
    this.tempObservacionText = item.observacion || '';
  }

  cancelEditObservacion(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.editingObservacionId = null;
    this.tempObservacionText = '';
  }

  saveHeuristicObservacion(item: ChecklistItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.assessment) return;
    item.observacion = this.tempObservacionText.trim();
    this.editingObservacionId = null;

    this.assessmentService.updateChecklistItem(this.projectId, item.id, {
      observacion: item.observacion
    }).subscribe({
      next: (updated: EvaluacionEsteticaResponse) => {
        this.assessment = updated;
        this.showToast('Nota de auditoría guardada correctamente');
      },
      error: (err: any) => {
        console.error('Error al guardar observación:', err);
      }
    });
  }

  convertHeuristicToFinding(item: ChecklistItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();

    const note = item.observacion?.trim();
    const problemText = note 
      ? `[Gestalt - ${item.titulo}] ${note}`
      : `[Gestalt - ${item.titulo}] Se identificaron desviaciones visuales en el principio de ${item.titulo}: ${item.descripcion}`;

    const severidad: 'critico' | 'mayor' | 'menor' = item.estado === 'no_cumple' 
      ? 'critico' 
      : (item.estado === 'parcial' ? 'mayor' : 'menor');

    let faseOrigen = 4;
    let faseNombre = 'Diseño Detallado';
    if (this.activeScreen) {
      faseNombre = `Diseño Detallado (${this.activeScreen.nombre_pantalla})`;
    } else if (this.selectedScreenFilter !== 'todas') {
      const p = this.pantallasFase4.find(pant => pant.nodo_id === this.selectedScreenFilter);
      if (p) {
        faseNombre = `Diseño Detallado (${p.nombre_pantalla})`;
      }
    }

    this.newFinding = {
      problema: problemText,
      severidad: severidad,
      fase_origen: faseOrigen,
      fase_origen_nombre: faseNombre
    };
    this.isAddModalOpen = true;
  }

  // --- Hallazgos Modal ---
  openAddFindingModal(): void {
    this.newFinding = {
      problema: '',
      severidad: 'mayor',
      fase_origen: 3,
      fase_origen_nombre: 'Diseño Visual'
    };
    this.isAddModalOpen = true;
  }

  closeAddFindingModal(): void {
    this.isAddModalOpen = false;
  }

  onFaseChange(faseNum: number): void {
    const nombres: Record<number, string> = {
      1: 'Investigación',
      2: 'Diseño Conceptual',
      3: 'Diseño Visual',
      4: 'Diseño Detallado'
    };
    const num = Number(faseNum);
    this.newFinding.fase_origen = num;
    this.newFinding.fase_origen_nombre = nombres[num] || 'Diseño Visual';
  }

  saveFinding(): void {
    if (!this.newFinding.problema.trim()) {
      alert('Por favor describe el problema detectado.');
      return;
    }

    this.isSaving = true;
    this.assessmentService.addFinding(this.projectId, this.newFinding).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeAddFindingModal();
        this.showToast('Hallazgo registrado con éxito');
        this.loadAssessment();
      },
      error: (err: any) => {
        console.error('Error al agregar hallazgo:', err);
        this.isSaving = false;
      }
    });
  }

  // --- Inspección de Pantallas Hi-Fi ---
  inspectScreen(p: PantallaFase4Item): void {
    this.selectedPantalla = p;
    this.isScreenModalOpen = true;
  }

  closeScreenModal(): void {
    this.isScreenModalOpen = false;
    this.selectedPantalla = null;
  }

  filterByScreen(nodoId: number | 'todas'): void {
    this.selectedScreenFilter = nodoId;
    if (nodoId === 'todas') {
      this.activeScreen = null;
      this.activeScreenId = null;
    } else {
      const p = this.pantallasFase4.find(pant => pant.nodo_id === nodoId) || null;
      this.activeScreen = p;
      this.activeScreenId = p ? p.id : null;
    }
  }

  setActiveScreen(screen: PantallaFase4Item | null): void {
    this.activeScreen = screen;
    this.activeScreenId = screen ? screen.id : null;
    this.selectedScreenFilter = screen ? screen.nodo_id : 'todas';
  }

  onScreenSelectChange(screenId: any): void {
    if (screenId === 'todas') {
      this.filterByScreen('todas');
      return;
    }
    const id = Number(screenId);
    const screen = this.pantallasFase4.find(p => p.id === id) || null;
    this.setActiveScreen(screen);
  }

  setViewerMode(mode: 'contain' | 'width' | 'natural'): void {
    this.viewerMode = mode;
  }

  toggleViewerMode(): void {
    this.viewerMode = this.viewerMode === 'contain' ? 'width' : 'contain';
  }

  getImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  syncWithFase4(): void {
    this.isSyncingFase4 = true;
    this.assessmentService.syncFase4(this.projectId).subscribe({
      next: (res: EvaluacionEsteticaResponse) => {
        this.assessment = res;
        this.isSyncingFase4 = false;
        this.showToast('Alertas de Fase 4 sincronizadas en la Matriz de Hallazgos');
      },
      error: (err: any) => {
        console.error('Error al sincronizar con Fase 4:', err);
        this.isSyncingFase4 = false;
        alert('Ocurrió un error al sincronizar con los resultados de Fase 4.');
      }
    });
  }

  // --- Getters Estadísticos Gestalt ---
  get pantallasFase4(): PantallaFase4Item[] {
    return this.assessment?.pantallas_fase4 || [];
  }

  get gestaltCompletedCount(): number {
    const list = this.assessment?.checklist || [];
    return list.filter(i => (i.estado === 'cumple' || (!i.estado && i.cumple))).length;
  }

  get gestaltPartialCount(): number {
    const list = this.assessment?.checklist || [];
    return list.filter(i => i.estado === 'parcial').length;
  }

  get gestaltFailedCount(): number {
    const list = this.assessment?.checklist || [];
    return list.filter(i => i.estado === 'no_cumple' || (!i.estado && !i.cumple)).length;
  }

  get gestaltNAcount(): number {
    const list = this.assessment?.checklist || [];
    return list.filter(i => i.estado === 'no_aplica').length;
  }

  get gestaltValidCount(): number {
    const list = this.assessment?.checklist || [];
    return list.filter(i => i.estado !== 'no_aplica').length;
  }

  get compliancePercentage(): number {
    const valid = this.gestaltValidCount;
    if (valid === 0) return 100;
    const score = (this.gestaltCompletedCount * 1.0) + (this.gestaltPartialCount * 0.5);
    return Math.round((score / valid) * 100);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}
