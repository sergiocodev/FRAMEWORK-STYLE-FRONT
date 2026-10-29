import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssessmentService } from '../services/assessment.service';
import { ProjectService } from '../../../core/services/project.service';
import { environment } from '../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  ChecklistItem,
  SubcriterioItem,
  HeuristicState,
  VisawiMetrica,
  VisawiQuestionnaireItem,
  Hallazgo,
  HallazgoCreateRequest,
  PantallaFase4Item
} from '../../../models/assessment.model';
import {
  GestaltTdaResponse,
  DiagramPoint,
  SimplexVertex,
  SimplexEdge,
  SimplexCycle,
  HeuristicScore,
  HallazgoSugerido
} from '../../../models/gestalt-tda.model';
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

  // Dropdown states
  isMethodDropdownOpen: boolean = false;
  availableMethods: { id: string; name: string; icon: string }[] = [
    { id: 'm1', name: 'Revisión Heurística (Checklist)', icon: 'checklist' },
    { id: 'm2', name: 'Cuestionario VisAWI (Psicométrico)', icon: 'survey' },
    { id: 'm3', name: 'Prueba A/B', icon: 'ab' },
    { id: 'm4', name: 'Análisis de Mapas de Calor', icon: 'heatmap' }
  ];

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

  // VisAWI Edit Modal & Preview
  isVisawiModalOpen: boolean = false;
  tempVisawiMetrics: VisawiMetrica[] = [];
  isVisawiQuestionsOpen: boolean = false;
  isPreviewSurveyModalOpen: boolean = false;
  previewAnswers: Record<string, number> = {};
  previewSurveyMode: 'completo' | 'dimensiones' = 'completo';
  previewItemAnswers: Record<number, number> = {};

  readonly visawiDimensions = [
    {
      name: 'Simplicidad',
      descripcion: 'Evaluación de la facilidad de uso y la ausencia de elementos innecesarios que puedan distraer al usuario.',
      itemsCount: 5
    },
    {
      name: 'Claridad',
      descripcion: 'Evaluación del grado en el que el diseño es claro y comprensible.',
      itemsCount: 4
    },
    {
      name: 'Diversidad',
      descripcion: 'Evaluación de la variedad y dinamismo en el diseño que mantienen el interés del usuario.',
      itemsCount: 5
    },
    {
      name: 'Armonía',
      descripcion: 'Evaluación de la cohesión y coherencia de los elementos visuales.',
      itemsCount: 4
    }
  ];

  readonly visawiOfficialItems: VisawiQuestionnaireItem[] = [
    { id: 1, dimension: 'Simplicidad', pregunta: '¿Sientes que la pantalla está sobrecargada o tiene demasiados elementos juntos?', inverso: true },
    { id: 2, dimension: 'Simplicidad', pregunta: '¿Es fácil entender cómo está organizada la interfaz a simple vista?', inverso: false },
    { id: 3, dimension: 'Simplicidad', pregunta: '¿Los elementos de la pantalla se ven bien ordenados y con una estructura clara?', inverso: false },
    { id: 4, dimension: 'Simplicidad', pregunta: '¿La interfaz se percibe desarticulada o con partes que parecen puestas al azar?', inverso: true },
    { id: 5, dimension: 'Simplicidad', pregunta: '¿Sientes que todos los elementos visuales guardan coherencia y encajan bien entre sí?', inverso: false },
    { id: 6, dimension: 'Claridad', pregunta: '¿El diseño de la interfaz transmite una apariencia profesional?', inverso: false },
    { id: 7, dimension: 'Claridad', pregunta: '¿El diseño visual se siente anticuado o desactualizado?', inverso: true },
    { id: 8, dimension: 'Claridad', pregunta: '¿Se nota dedicación y cuidado en los detalles del diseño de la interfaz?', inverso: false },
    { id: 9, dimension: 'Claridad', pregunta: '¿Parece que al diseño le falta una idea clara o una línea visual definida?', inverso: true },
    { id: 10, dimension: 'Diversidad', pregunta: '¿El diseño visual te resulta aburrido o poco llamativo?', inverso: true },
    { id: 11, dimension: 'Diversidad', pregunta: '¿La distribución y el diseño de la interfaz muestran creatividad y originalidad?', inverso: false },
    { id: 12, dimension: 'Diversidad', pregunta: '¿El diseño parece monótono o falto de creatividad?', inverso: true },
    { id: 13, dimension: 'Diversidad', pregunta: '¿El diseño de la pantalla transmite dinamismo y agilidad visual?', inverso: false },
    { id: 14, dimension: 'Diversidad', pregunta: '¿La interfaz ofrece una variedad visual agradable sin volverse repetitiva?', inverso: false },
    { id: 15, dimension: 'Armonía', pregunta: '¿La combinación general de colores de la interfaz te resulta atractiva?', inverso: false },
    { id: 16, dimension: 'Armonía', pregunta: '¿Consideras que los colores utilizados chocan entre sí o no combinan?', inverso: true },
    { id: 17, dimension: 'Armonía', pregunta: '¿Sientes que la elección de colores fue desacertada o poco adecuada?', inverso: true },
    { id: 18, dimension: 'Armonía', pregunta: '¿Los colores empleados en la interfaz son agradables a la vista?', inverso: false }
  ];

  readonly likertScale7 = [
    { value: 1, label: 'Totalmente en desacuerdo', short: 'TD (1)' },
    { value: 2, label: 'En desacuerdo', short: 'D (2)' },
    { value: 3, label: 'Ligeramente en desacuerdo', short: 'LD (3)' },
    { value: 4, label: 'Neutral', short: 'N (4)' },
    { value: 5, label: 'Ligeramente de acuerdo', short: 'LA (5)' },
    { value: 6, label: 'De acuerdo', short: 'A (6)' },
    { value: 7, label: 'Totalmente de acuerdo', short: 'TA (7)' }
  ];

  // Fase 4 Integration & Screen Modal
  selectedPantalla: PantallaFase4Item | null = null;
  isScreenModalOpen: boolean = false;
  isSyncingFase4: boolean = false;
  selectedScreenFilter: number | 'todas' = 'todas';

  // Heuristic State & Accordion
  expandedHeuristicIds: Set<string> = new Set<string>();
  heuristicScreenFilter: number | 'todas' = 'todas';
  editingObservacionId: string | null = null;
  tempObservacionText: string = '';

  // Gestalt TDA (Homología Persistente - Chen et al., 2025)
  isTdaModalOpen: boolean = false;
  isLoadingTda: boolean = false;
  isApplyingTda: boolean = false;
  tdaResult: GestaltTdaResponse | null = null;
  selectedTdaScreenId: number | null = null;
  showVrEdges: boolean = true;
  showH1Cycles: boolean = true;
  showContinuation: boolean = true;
  activeTdaDiagramTab: '0pd' | '1pd' = '0pd';

  // Close menus on clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    this.isMethodDropdownOpen = false;
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

  toggleMethodDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isMethodDropdownOpen = !this.isMethodDropdownOpen;
  }

  selectMethod(methodName: string): void {
    if (!this.assessment || this.assessment.metodo_seleccionado === methodName) {
      this.isMethodDropdownOpen = false;
      return;
    }

    this.assessment.metodo_seleccionado = methodName;
    this.isMethodDropdownOpen = false;

    this.assessmentService.updateAssessment(this.projectId, {
      metodo_seleccionado: methodName
    }).subscribe({
      next: (updated) => {
        this.assessment = updated;
        this.showToast(`Método actualizado a "${methodName}"`);
      },
      error: (err) => console.error('Error al actualizar método:', err)
    });
  }

  toggleChecklistItem(item: ChecklistItem): void {
    if (!this.assessment) return;
    const nextState: HeuristicState = (item.estado === 'cumple' || item.cumple) ? 'no_cumple' : 'cumple';
    this.setHeuristicState(item, nextState);
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
      next: (updated) => {
        this.assessment = updated;
        const labels: Record<HeuristicState, string> = {
          'cumple': 'Cumple totalmente',
          'parcial': 'Cumple parcialmente',
          'no_cumple': 'No cumple',
          'no_aplica': 'No aplica (excluido)'
        };
        this.showToast(`${item.titulo}: ${labels[state]}`);
      },
      error: (err) => {
        console.error('Error al actualizar estado heurístico:', err);
        item.estado = previousState;
        item.cumple = (previousState === 'cumple');
      }
    });
  }

  toggleSubcriterio(item: ChecklistItem, sub: SubcriterioItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.assessment) return;

    // Conmutación visual optimista
    sub.cumple = !sub.cumple;

    // Auto-cálculo de estado gradual a partir de subcriterios
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
      next: (updated) => {
        this.assessment = updated;
      },
      error: (err) => {
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
      next: (updated) => {
        this.assessment = updated;
        this.showToast('Nota de auditoría guardada correctamente');
      },
      error: (err) => {
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

    // Determinar severidad sugerida
    const severidad: 'critico' | 'mayor' | 'menor' = item.estado === 'no_cumple' 
      ? 'critico' 
      : (item.estado === 'parcial' ? 'mayor' : 'menor');

    // Determinar fase
    let faseOrigen = 4;
    let faseNombre = 'Diseño Detallado';
    if (this.selectedScreenFilter !== 'todas') {
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

  copySurveyUrl(): void {
    const url = this.assessment?.encuesta_url || `https://style-eval.com/survey/proj-${this.projectId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('¡Enlace de encuesta copiado al portapapeles!');
      }).catch(() => {
        this.showToast('Enlace listo para compartir');
      });
    } else {
      this.showToast('Enlace listo para compartir');
    }
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
      error: (err) => {
        console.error('Error al agregar hallazgo:', err);
        this.isSaving = false;
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
      alert('Por favor describe el problema detectado.');
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

  deleteFinding(findingId: number): void {
    if (!confirm('¿Estás seguro de eliminar este hallazgo?')) return;

    this.activeActionRowId = null;
    this.assessmentService.deleteFinding(this.projectId, findingId).subscribe({
      next: () => {
        this.showToast('Hallazgo eliminado correctamente');
        this.loadAssessment();
      },
      error: (err) => console.error('Error al eliminar hallazgo:', err)
    });
  }

  // --- VisAWI Modal de Métricas y Encuesta ---
  openVisawiModal(): void {
    const list = this.assessment?.visawi_metricas || [
      { dimension: 'Simplicidad', puntaje: 5.8, target: 6.0, reactivo: 'Evaluación de la facilidad de uso y la ausencia de elementos innecesarios que puedan distraer al usuario.' },
      { dimension: 'Claridad', puntaje: 6.1, target: 6.0, reactivo: 'Evaluación del grado en el que el diseño es claro y comprensible.' },
      { dimension: 'Diversidad', puntaje: 5.2, target: 5.5, reactivo: 'Evaluación de la variedad y dinamismo en el diseño que mantienen el interés del usuario.' },
      { dimension: 'Armonía', puntaje: 5.9, target: 6.0, reactivo: 'Evaluación de la cohesión y coherencia de los elementos visuales.' }
    ];
    this.tempVisawiMetrics = list.map(m => ({
      dimension: m.dimension,
      puntaje: m.puntaje,
      target: m.target || 6.0,
      reactivo: m.reactivo
    }));
    this.isVisawiModalOpen = true;
  }

  closeVisawiModal(): void {
    this.isVisawiModalOpen = false;
  }

  saveVisawiMetrics(): void {
    this.isSaving = true;
    this.assessmentService.updateAssessment(this.projectId, {
      visawi_metricas: this.tempVisawiMetrics
    }).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.assessment = updated;
        this.closeVisawiModal();
        this.showToast('Métricas y Benchmarks VisAWI actualizados con éxito');
      },
      error: (err) => {
        console.error('Error al actualizar métricas VisAWI:', err);
        this.isSaving = false;
      }
    });
  }

  toggleVisawiQuestions(): void {
    this.isVisawiQuestionsOpen = !this.isVisawiQuestionsOpen;
  }

  openPreviewSurveyModal(): void {
    this.previewAnswers = {};
    const metricas = this.assessment?.visawi_metricas || [];
    metricas.forEach(m => {
      this.previewAnswers[m.dimension] = Math.round(m.puntaje);
    });

    // Cargar respuestas representativas de los 18 ítems del archivo VISAWIdev.xlsx
    this.previewItemAnswers = {
      1: 2, 2: 6, 3: 6, 4: 2, 5: 6,
      6: 6, 7: 2, 8: 6, 9: 2,
      10: 2, 11: 5, 12: 2, 13: 5, 14: 6,
      15: 6, 16: 2, 17: 2, 18: 6
    };
    this.previewSurveyMode = 'completo';
    this.isPreviewSurveyModalOpen = true;
  }

  closePreviewSurveyModal(): void {
    this.isPreviewSurveyModalOpen = false;
  }

  getItemsByDimension(dim: string): VisawiQuestionnaireItem[] {
    return this.visawiOfficialItems.filter(i => i.dimension.toLowerCase() === dim.toLowerCase());
  }

  // --- Finalización del Proyecto ---
  finalizeProject(): void {
    if (this.criticalFindingsCount > 0) {
      alert('No puedes finalizar el proyecto mientras existan hallazgos críticos pendientes de resolver.');
      return;
    }

    if (!confirm('¿Deseas dar por concluida la evaluación y finalizar el proyecto en el Framework STYLE?')) {
      return;
    }

    this.isFinalizingProject = true;
    this.projectService.updateProject(this.projectId, {
      estado: 'completado',
      fase_actual_id: 5
    }).subscribe({
      next: (updatedProject: any) => {
        this.project = updatedProject;
        this.isFinalizingProject = false;
        this.showToast('¡Proyecto finalizado y aprobado con éxito!');
        this.loadProject();
      },
      error: (err) => {
        console.error('Error al finalizar el proyecto:', err);
        this.isFinalizingProject = false;
        alert('Ocurrió un error al intentar finalizar el proyecto.');
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

  // --- Helpers matemáticos para el Radar SVG ---
  get radarPolygonPoints(): string {
    const points = this.radarDataPoints;
    return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  get radarDataPoints(): { x: number; y: number; label: string; score: number }[] {
    const metricas = this.assessment?.visawi_metricas || [];
    const center = { x: 200, y: 185 };
    const maxRadius = 125;
    const n = metricas.length || 4;

    return metricas.map((m, idx) => {
      const score = Math.max(1, Math.min(7, m.puntaje));
      const r = (score / 7) * maxRadius;
      const angleRad = (idx * (360 / n)) * (Math.PI / 180);
      const x = center.x + r * Math.sin(angleRad);
      const y = center.y - r * Math.cos(angleRad);
      return { x, y, label: m.dimension, score: m.puntaje };
    });
  }

  get averageVisawi(): number {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return 0;
    const sum = metricas.reduce((acc, curr) => acc + curr.puntaje, 0);
    return Number((sum / metricas.length).toFixed(1));
  }

  // --- Benchmark Layer for Radar Chart ---
  get radarBenchmarkPolygonPoints(): string {
    const points = this.radarBenchmarkDataPoints;
    return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  get radarBenchmarkDataPoints(): { x: number; y: number; label: string; score: number }[] {
    const metricas = this.assessment?.visawi_metricas || [];
    const center = { x: 200, y: 185 };
    const maxRadius = 125;
    const n = metricas.length || 4;

    return metricas.map((m, idx) => {
      const targetScore = Math.max(1, Math.min(7, m.target || 6.0));
      const r = (targetScore / 7) * maxRadius;
      const angleRad = (idx * (360 / n)) * (Math.PI / 180);
      const x = center.x + r * Math.sin(angleRad);
      const y = center.y - r * Math.cos(angleRad);
      return { x, y, label: m.dimension, score: targetScore };
    });
  }

  get averageBenchmark(): number {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return 6.0;
    const sum = metricas.reduce((acc, curr) => acc + (curr.target || 6.0), 0);
    return Number((sum / metricas.length).toFixed(1));
  }

  getMetricLevel(score: number): { label: string; badgeClass: string; barClass: string } {
    if (score >= 5.8) {
      return { label: 'Excelente', badgeClass: 'level-excellent', barClass: 'bar-excellent' };
    }
    if (score >= 5.0) {
      return { label: 'Satisfactorio', badgeClass: 'level-satisfactory', barClass: 'bar-satisfactory' };
    }
    if (score >= 4.0) {
      return { label: 'Observación', badgeClass: 'level-regular', barClass: 'bar-regular' };
    }
    return { label: 'Deficiente', badgeClass: 'level-deficient', barClass: 'bar-deficient' };
  }

  get lowestVisawiMetric(): {
    dimension: string;
    puntaje: number;
    target: number;
    gap: number;
    recommendation: string;
  } | null {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return null;

    let lowest = metricas[0];
    for (const m of metricas) {
      if (m.puntaje < lowest.puntaje) {
        lowest = m;
      }
    }

    const recommendations: Record<string, string> = {
      'Simplicidad': 'Reducir la sobrecarga cognitiva: eliminar elementos redundantes o innecesarios, aumentar el espaciado (whitespace) y simplificar la disposición de controles para que la pantalla no se perciba saturada.',
      'Claridad': 'Transmitir apariencia profesional y estructura limpia: ordenar los bloques temáticos de forma comprensible a primera vista y renovar estilos visuales que puedan percibirse anticuados.',
      'Diversidad': 'Aumentar el dinamismo y atractivo visual: incorporar ritmo visual interactivo, variedad estética y creatividad en componentes destacados para evitar monotonía visual.',
      'Armonía': 'Armonizar la paleta cromática: garantizar que los colores convivan en equilibrio armónico, no choquen entre sí y transmitan una sensación agradable y cohesiva.'
    };

    const target = lowest.target || 6.0;
    const gap = Number((target - lowest.puntaje).toFixed(1));

    return {
      dimension: lowest.dimension,
      puntaje: lowest.puntaje,
      target: target,
      gap: gap > 0 ? gap : 0,
      recommendation: recommendations[lowest.dimension] || 'Revisar la coherencia visual, espaciados y armonía de la interfaz.'
    };
  }

  convertVisawiToFinding(metric: { dimension: string; puntaje: number; recommendation: string }, event?: MouseEvent): void {
    if (event) event.stopPropagation();

    const severidad: 'critico' | 'mayor' | 'menor' = metric.puntaje < 4.0 ? 'critico' : (metric.puntaje < 5.0 ? 'mayor' : 'menor');
    let faseOrigen = 3;
    let faseNombre = 'Diseño Visual';
    if (metric.dimension === 'Simplicidad') {
      faseOrigen = 2;
      faseNombre = 'Diseño Conceptual';
    } else if (metric.dimension === 'Claridad') {
      faseOrigen = 3;
      faseNombre = 'Diseño Visual';
    }

    this.newFinding = {
      problema: `[VisAWI - ${metric.dimension}] Calificación baja en percepción de usuarios (${metric.puntaje}/7.0). ${metric.recommendation}`,
      severidad: severidad,
      fase_origen: faseOrigen,
      fase_origen_nombre: faseNombre
    };
    this.isAddModalOpen = true;
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
      return list.filter(h => h.severidad === 'critico');
    }
    if (this.findingsFilter === 'pendientes') {
      return list.filter(h => !h.resuelto);
    }
    if (this.findingsFilter === 'resueltos') {
      return list.filter(h => h.resuelto);
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
        alert('Ocurrió un error al sincronizar con los resultados de Fase 4.');
      }
    });
  }

  // --- Gestalt Topological Data Analysis (TDA) ---

  openTdaModal(pantalla?: PantallaFase4Item): void {
    this.isTdaModalOpen = true;
    if (pantalla) {
      this.selectedTdaScreenId = pantalla.id;
    } else if (this.pantallasFase4.length > 0) {
      this.selectedTdaScreenId = this.pantallasFase4[0].id;
    } else {
      this.selectedTdaScreenId = null;
    }
    this.runTdaAnalysis(this.selectedTdaScreenId);
  }

  closeTdaModal(): void {
    this.isTdaModalOpen = false;
  }

  onTdaScreenChange(screenIdStr: string): void {
    const screenId = screenIdStr ? parseInt(screenIdStr, 10) : null;
    this.selectedTdaScreenId = screenId;
    this.runTdaAnalysis(screenId);
  }

  runTdaAnalysis(pantallaId?: number | null): void {
    this.isLoadingTda = true;
    this.assessmentService.getGestaltTda(this.projectId, pantallaId).subscribe({
      next: (res) => {
        this.tdaResult = res;
        this.isLoadingTda = false;
      },
      error: (err) => {
        console.error('Error al ejecutar TDA Gestalt:', err);
        this.isLoadingTda = false;
        this.showToast('No se pudo completar el análisis topológico.');
      }
    });
  }

  applyTdaToAssessment(): void {
    if (!this.tdaResult) return;
    this.isApplyingTda = true;
    this.assessmentService.applyGestaltTda(this.projectId, {
      pantalla_id: this.selectedTdaScreenId,
      actualizar_checklist: true,
      crear_hallazgos: true
    }).subscribe({
      next: (res) => {
        this.isApplyingTda = false;
        if (res.evaluacion) {
          this.assessment = res.evaluacion;
        }
        this.showToast(res.mensaje || '¡Resultados de TDA aplicados al checklist y hallazgos!');
        this.closeTdaModal();
      },
      error: (err) => {
        console.error('Error al aplicar resultados TDA:', err);
        this.isApplyingTda = false;
        alert('Ocurrió un error al aplicar las calificaciones topológicas.');
      }
    });
  }

  addTdaFindingToMatrix(hs: HallazgoSugerido): void {
    const nuevoReq: HallazgoCreateRequest = {
      problema: hs.problema,
      severidad: hs.severidad,
      fase_origen: hs.fase_origen,
      fase_origen_nombre: hs.fase_origen_nombre
    };

    this.assessmentService.addFinding(this.projectId, nuevoReq).subscribe({
      next: (created) => {
        if (!this.assessment!.hallazgos) {
          this.assessment!.hallazgos = [];
        }
        this.assessment!.hallazgos.unshift(created);
        this.showToast(`Hallazgo de ${hs.heuristica_id.toUpperCase()} agregado a la matriz.`);
      },
      error: (err) => {
        console.error('Error al agregar hallazgo TDA:', err);
        this.showToast('No se pudo agregar el hallazgo a la matriz.');
      }
    });
  }

  getVertexById(id: number): SimplexVertex | undefined {
    return this.tdaResult?.vertices.find(v => v.id === id);
  }

  getSvgLineCoords(edge: SimplexEdge): { x1: number; y1: number; x2: number; y2: number } | null {
    const v1 = this.getVertexById(edge.source);
    const v2 = this.getVertexById(edge.target);
    if (!v1 || !v2) return null;
    return {
      x1: v1.x * 100,
      y1: v1.y * 100,
      x2: v2.x * 100,
      y2: v2.y * 100
    };
  }

  getCyclePointsSvg(cycle: SimplexCycle): string {
    return cycle.vertices
      .map(id => {
        const v = this.getVertexById(id);
        return v ? `${v.x * 100},${v.y * 100}` : '';
      })
      .filter(p => !!p)
      .join(' ');
  }
}

