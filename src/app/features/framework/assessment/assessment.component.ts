import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssessmentService } from '../services/assessment.service';
import { ProjectService } from '../../../core/services/project.service';
import { DialogService } from '../../../core/services/dialog.service';
import { environment } from '../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  Hallazgo,
  HallazgoCreateRequest,
  PantallaFase4Item
} from '../../../models/assessment.model';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';


@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.scss']
})
export class AssessmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assessmentService = inject(AssessmentService);
  private projectService = inject(ProjectService);
  private dialogService = inject(DialogService);

  projectId: number = 1;
  project: any = null;
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
    { label: 'Evaluación Estética', active: true }
  ];

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  assessment: EvaluacionEsteticaResponse | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isFinalizingProject: boolean = false;


  // Toast message
  toastMessage: string | null = null;
  private toastTimeout: any;

  // Findings Filters & Action menu
  findingsFilter: 'todos' | 'criticos' | 'pendientes' | 'resueltos' = 'todos';
  activeActionRowId: number | null = null;

  // Add finding modal
  isAddModalOpen: boolean = false;
  newFinding: HallazgoCreateRequest = {
    problema: '',
    severidad: 'mayor',
    fase_origen: 3,
    fase_origen_nombre: 'Diseño Visual'
  };

  // Edit finding modal
  isEditModalOpen: boolean = false;
  editingFinding: Hallazgo = {
    id: 0,
    problema: '',
    severidad: 'mayor',
    fase_origen: 3,
    fase_origen_nombre: 'Diseño Visual',
    resuelto: false
  };

  // Fase 4 Integration & Screen Modal
  selectedPantalla: PantallaFase4Item | null = null;
  isScreenModalOpen: boolean = false;
  isSyncingFase4: boolean = false;
  selectedScreenFilter: number | 'todas' = 'todas';

  // Close menus on clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    this.activeActionRowId = null;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = Number(idParam);
      }
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
          client: res.cliente?.nombre || 'Sin cliente asignado'
        };

        this.headerBreadcrumbs = [
          { label: 'Inicio', url: '/' },
          { label: 'Proyectos', url: '/projects' },
          { label: this.project.title || 'Evaluación Estética', active: true }
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
      error: (err) => {
        console.error('Error al cargar proyecto:', err);
      }
    });
  }

  loadAssessment(): void {
    this.isLoading = true;
    this.assessmentService.getAssessment(this.projectId).subscribe({
      next: (data) => {
        this.assessment = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar evaluación:', err);
        this.isLoading = false;
      }
    });
  }

  // --- Hallazgos: CRUD y Modales ---

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

  onFaseChange(faseNum: number, target: 'new' | 'edit' = 'new'): void {
    const nombres: Record<number, string> = {
      1: 'Investigación',
      2: 'Diseño Conceptual',
      3: 'Diseño Visual',
      4: 'Diseño Detallado'
    };
    const num = Number(faseNum);
    const nom = nombres[num] || 'Diseño Visual';
    if (target === 'new') {
      this.newFinding.fase_origen = num;
      this.newFinding.fase_origen_nombre = nom;
    } else {
      this.editingFinding.fase_origen = num;
      this.editingFinding.fase_origen_nombre = nom;
    }
  }

  saveFinding(): void {
    if (!this.newFinding.problema.trim()) {
      this.dialogService.warning('Por favor describe el problema detectado en el diseño.', 'Descripción Requerida');
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
      error: (err) => {
        console.error('Error al agregar hallazgo:', err);
        this.isSaving = false;
        this.dialogService.error('Ocurrió un error al registrar el hallazgo.');
      }
    });
  }

  openEditFindingModal(finding: Hallazgo): void {
    this.activeActionRowId = null;
    this.editingFinding = { ...finding };
    this.isEditModalOpen = true;
  }

  closeEditFindingModal(): void {
    this.isEditModalOpen = false;
  }

  saveEditFinding(): void {
    if (!this.editingFinding.problema.trim()) {
      this.dialogService.warning('Por favor describe el problema detectado en el diseño.', 'Descripción Requerida');
      return;
    }

    this.isSaving = true;
    this.assessmentService.updateFinding(this.projectId, this.editingFinding.id, {
      problema: this.editingFinding.problema,
      severidad: this.editingFinding.severidad,
      fase_origen: this.editingFinding.fase_origen,
      fase_origen_nombre: this.editingFinding.fase_origen_nombre,
      resuelto: this.editingFinding.resuelto
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeEditFindingModal();
        this.showToast('Hallazgo actualizado correctamente');
        this.loadAssessment();
      },
      error: (err) => {
        console.error('Error al actualizar hallazgo:', err);
        this.isSaving = false;
        this.dialogService.error('Ocurrió un error al actualizar el hallazgo.');
      }
    });
  }

  toggleFindingResolved(finding: Hallazgo, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.assessmentService.toggleFindingResolved(this.projectId, finding.id).subscribe({
      next: (updated) => {
        finding.resuelto = updated.resuelto;
        this.showToast(updated.resuelto ? 'Hallazgo marcado como resuelto' : 'Hallazgo marcado como pendiente');
        this.loadAssessment();
      },
      error: (err) => console.error('Error al alternar estado del hallazgo:', err)
    });
  }

  toggleActionMenu(findingId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeActionRowId === findingId) {
      this.activeActionRowId = null;
    } else {
      this.activeActionRowId = findingId;
    }
  }

  async deleteFinding(findingId: number): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: '¿Eliminar hallazgo?',
      message: '¿Estás seguro de eliminar este hallazgo? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    this.activeActionRowId = null;
    this.assessmentService.deleteFinding(this.projectId, findingId).subscribe({
      next: () => {
        this.showToast('Hallazgo eliminado correctamente');
        this.loadAssessment();
      },
      error: (err) => {
        console.error('Error al eliminar hallazgo:', err);
        this.dialogService.error('Ocurrió un error al eliminar el hallazgo.');
      }
    });
  }

  // --- Finalización del Proyecto ---
  async finalizeProject(): Promise<void> {
    if (this.criticalFindingsCount > 0) {
      this.dialogService.warning(
        'No puedes finalizar el proyecto mientras existan hallazgos críticos pendientes de resolver.',
        'Hallazgos Críticos Pendientes'
      );
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: '¿Finalizar proyecto?',
      message: '¿Deseas dar por concluida la evaluación estética y finalizar el proyecto en el Framework STYLE?',
      confirmText: 'Sí, finalizar proyecto',
      cancelText: 'Continuar editando',
      type: 'success'
    });
    if (!confirmed) return;

    this.isFinalizingProject = true;
    this.projectService.updateProject(this.projectId, {
      estado: 'completado',
      fase_actual_id: 5
    }).subscribe({
      next: (updatedProject: any) => {
        this.project = updatedProject;
        this.isFinalizingProject = false;
        this.dialogService.success('¡Proyecto finalizado y aprobado con éxito!', 'Proyecto Culminado');
        this.loadProject();
      },
      error: (err) => {
        console.error('Error al finalizar el proyecto:', err);
        this.isFinalizingProject = false;
        this.dialogService.error('Ocurrió un error al intentar finalizar el proyecto.');
      }
    });
  }

  exportReport(): void {
    window.print();
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  get averageVisawi(): number {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return 0;
    const sum = metricas.reduce((acc, curr) => acc + curr.puntaje, 0);
    return Number((sum / metricas.length).toFixed(1));
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

  get criticalFindingsCount(): number {
    const list = this.assessment?.hallazgos || [];
    return list.filter(h => h.severidad === 'critico' && !h.resuelto).length;
  }

  searchTerm: string = '';

  get gestaltCompliancePercent(): number {
    const valid = this.gestaltValidCount;
    if (!valid) return 0;
    const score = this.gestaltCompletedCount + (this.gestaltPartialCount * 0.5);
    return Math.round((score / valid) * 100);
  }

  get visawiPercent(): number {
    if (!this.averageVisawi) return 0;
    return Math.round((this.averageVisawi / 7.0) * 100);
  }

  get resolvedFindingsPercent(): number {
    const total = this.assessment?.hallazgos?.length || 0;
    if (!total) return 100;
    const resolved = this.assessment?.hallazgos?.filter(h => h.resuelto).length || 0;
    return Math.round((resolved / total) * 100);
  }

  get pendingFindingsCount(): number {
    const list = this.assessment?.hallazgos || [];
    return list.filter(h => !h.resuelto).length;
  }

  get resolvedFindingsCount(): number {
    const list = this.assessment?.hallazgos || [];
    return list.filter(h => h.resuelto).length;
  }

  get calistaScoreGlobal(): number {
    return this.assessment?.calista_metricas?.score_global || 0;
  }

  get calistaCategoria(): string {
    return this.assessment?.calista_metricas?.categoria_global || 'Pendiente';
  }

  get calistaEvaluadasCount(): number {
    return this.assessment?.calista_metricas?.pantallas_evaluadas_count || 0;
  }

  get calistaPendientesCount(): number {
    return this.assessment?.calista_metricas?.pantallas_pendientes_count || 0;
  }

  get isProjectCertified(): boolean {
    return (this.assessment?.score_estetico || 0) >= 88 && this.criticalFindingsCount === 0;
  }

  get isProjectApproved(): boolean {
    return (this.assessment?.score_estetico || 0) >= 75 && this.criticalFindingsCount === 0;
  }

  // --- Integración con Fase 4 ---
  getImageUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiUrl}${cleanPath}`;
  }

  inspectScreen(pantalla: PantallaFase4Item): void {
    this.selectedPantalla = pantalla;
    this.isScreenModalOpen = true;
  }

  closeScreenModal(): void {
    this.isScreenModalOpen = false;
    this.selectedPantalla = null;
  }

  filterByScreen(nodoId: number | 'todas'): void {
    this.selectedScreenFilter = nodoId;
  }

  get pantallasFase4(): PantallaFase4Item[] {
    return this.assessment?.pantallas_fase4 || [];
  }

  get filteredFindings(): Hallazgo[] {
    let list = this.assessment?.hallazgos || [];

    // Filtro por pantalla si está seleccionado
    if (this.selectedScreenFilter !== 'todas') {
      const p = this.assessment?.pantallas_fase4?.find(item => item.nodo_id === this.selectedScreenFilter);
      if (p) {
        list = list.filter(h => h.problema.toLowerCase().includes(p.nombre_pantalla.toLowerCase()));
      }
    }

    // Filtro por tabs de estado
    if (this.findingsFilter === 'criticos') {
      list = list.filter(h => h.severidad === 'critico');
    } else if (this.findingsFilter === 'pendientes') {
      list = list.filter(h => !h.resuelto);
    } else if (this.findingsFilter === 'resueltos') {
      list = list.filter(h => h.resuelto);
    }

    // Búsqueda por texto si existe
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(h =>
        h.problema.toLowerCase().includes(term) ||
        h.fase_origen_nombre.toLowerCase().includes(term) ||
        h.severidad.toLowerCase().includes(term)
      );
    }

    return list;
  }

  syncWithFase4(): void {
    this.isSyncingFase4 = true;
    this.assessmentService.syncFase4(this.projectId).subscribe({
      next: (res) => {
        this.assessment = res;
        this.isSyncingFase4 = false;
        this.showToast('Alertas de Fase 4 sincronizadas en la Matriz de Hallazgos');
      },
      error: (err) => {
        console.error('Error al sincronizar con Fase 4:', err);
        this.isSyncingFase4 = false;
        this.dialogService.error('Ocurrió un error al sincronizar con los resultados de Fase 4.');
      }
    });
  }


}

