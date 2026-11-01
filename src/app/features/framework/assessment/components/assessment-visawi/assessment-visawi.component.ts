import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router, ParamMap } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { environment } from '../../../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  VisawiMetrica,
  VisawiQuestionnaireItem,
  HallazgoCreateRequest,
  VisawiEncuestaResponse,
  VisawiEncuestaRespuestaInput,
  PantallaFase4Item
} from '../../../../../models/assessment.model';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/page-header/page-header.component';
@Component({
  selector: 'app-assessment-visawi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './assessment-visawi.component.html',
  styleUrl: './assessment-visawi.component.scss'
})
export class AssessmentVisawiComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private assessmentService: AssessmentService = inject(AssessmentService);
  private projectService: ProjectService = inject(ProjectService);

  projectId: number = 1;
  project: any = null;
  assessment: EvaluacionEsteticaResponse | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isFinalReportModalOpen: boolean = false;

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
    { label: 'Psicométrico VisAWI', active: true }
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

  // VisAWI Modal de Ajuste y Métricas
  isVisawiModalOpen: boolean = false;
  tempVisawiMetrics: VisawiMetrica[] = [];

  // Modal de Encuesta Activa & Respuestas en Vivo
  isSurveyModalOpen: boolean = false;
  isSavingSurvey: boolean = false;
  surveyEvaluatorName: string = 'Participante Anónimo';
  surveyEvaluatorRole: string = 'Participante Anónimo';
  surveyItemAnswers: Record<number, number> = {};

  // Visor de Pantalla Integrado en el Modal
  selectedScreenId: number | null = null;
  screenViewerMode: 'contain' | 'width' = 'contain';
  isScreenZoomModalOpen: boolean = false;

  // Detalle de Encuesta y Eliminación
  selectedSurveyDetails: VisawiEncuestaResponse | null = null;
  isDeletingSurveyId: number | null = null;

  get selectedScreen(): PantallaFase4Item | undefined {
    if (!this.assessment?.pantallas_fase4?.length) return undefined;
    if (!this.selectedScreenId) return this.assessment.pantallas_fase4[0];
    return this.assessment.pantallas_fase4.find(s => s.id === this.selectedScreenId) || this.assessment.pantallas_fase4[0];
  }

  onScreenChange(screenId: number): void {
    this.selectedScreenId = screenId;
  }

  setScreenViewerMode(mode: 'contain' | 'width'): void {
    this.screenViewerMode = mode;
  }

  toggleScreenZoomModal(open: boolean): void {
    this.isScreenZoomModalOpen = open;
  }

  getImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Compatibilidad hacia atrás
  get isPreviewSurveyModalOpen(): boolean {
    return this.isSurveyModalOpen;
  }
  set isPreviewSurveyModalOpen(val: boolean) {
    this.isSurveyModalOpen = val;
  }
  previewSurveyMode: 'completo' | 'dimensiones' = 'completo';
  get previewItemAnswers(): Record<number, number> {
    return this.surveyItemAnswers;
  }
  set previewItemAnswers(val: Record<number, number>) {
    this.surveyItemAnswers = val;
  }
  previewAnswers: Record<string, number> = {};

  isVisawiQuestionsOpen: boolean = false;

  readonly visawiDimensions = [
    {
      name: 'Simplicidad',
      descripcion: 'Facilidad de uso, claridad en la jerarquía y ausencia de elementos superfluos que saturen la percepción.',
      itemsCount: 5
    },
    {
      name: 'Claridad',
      descripcion: 'Grado en el que el diseño se comprende de inmediato, transmite profesionalismo y orden estructurado.',
      itemsCount: 4
    },
    {
      name: 'Diversidad',
      descripcion: 'Variedad, agilidad visual, creatividad y dinamismo que mantienen cautivo el interés del usuario.',
      itemsCount: 5
    },
    {
      name: 'Armonía',
      descripcion: 'Cohesión estética global, balance equilibrado y compatibilidad cromática de todos los componentes.',
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
    { value: 1, label: 'Totalmente en desacuerdo', short: 'Totalmente en desacuerdo' },
    { value: 2, label: 'En desacuerdo', short: 'En desacuerdo' },
    { value: 3, label: 'Ligeramente en desacuerdo', short: 'Ligeramente en desacuerdo' },
    { value: 4, label: 'Neutral', short: 'Neutral' },
    { value: 5, label: 'Ligeramente de acuerdo', short: 'Ligeramente de acuerdo' },
    { value: 6, label: 'De acuerdo', short: 'De acuerdo' },
    { value: 7, label: 'Totalmente de acuerdo', short: 'Totalmente de acuerdo' }
  ];

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
        { label: 'Psicométrico VisAWI', active: true }
      ];

      this.loadProject();
      this.loadAssessment();
    });
  }

  loadProject(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res;
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
        if (this.assessment?.pantallas_fase4?.length && !this.selectedScreenId) {
          this.selectedScreenId = this.assessment.pantallas_fase4[0].id;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evaluación:', err);
        this.isLoading = false;
      }
    });
  }

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
      const currentScore = Math.max(1, Math.min(7, m.puntaje || 0));
      const r = (currentScore / 7) * maxRadius;
      const angleRad = (idx * (360 / n)) * (Math.PI / 180);
      const x = center.x + r * Math.sin(angleRad);
      const y = center.y - r * Math.cos(angleRad);
      return { x, y, label: m.dimension, score: currentScore };
    });
  }

  get radarPoints(): string {
    return this.radarPolygonPoints;
  }

  get averageVisawi(): number {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return 0;
    const sum = metricas.reduce((acc, curr) => acc + (curr.puntaje || 0), 0);
    return Number((sum / metricas.length).toFixed(1));
  }

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

  get radarTargetPoints(): string {
    return this.radarBenchmarkPolygonPoints;
  }

  get averageBenchmark(): number {
    const metricas = this.assessment?.visawi_metricas || [];
    if (!metricas.length) return 6.0;
    const sum = metricas.reduce((acc, curr) => acc + (curr.target || 6.0), 0);
    return Number((sum / metricas.length).toFixed(1));
  }

  get averageTarget(): number {
    return this.averageBenchmark;
  }

  get averageVisawiGap(): number {
    const current = this.averageVisawi;
    const target = this.averageBenchmark;
    const diff = target - current;
    return diff > 0 ? Number(diff.toFixed(1)) : 0;
  }

  get lowestDimension(): { dimension: string; puntaje: number; target: number; gap: number; recommendation: string } | null {
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

  get lowestVisawiMetric() {
    return this.lowestDimension;
  }

  getMetricLevel(score: number): { label: string; badgeClass: string; barClass: string } {
    if (score >= 6.0) return { label: 'Sobresaliente', badgeClass: 'bg-success text-white', barClass: 'bg-success' };
    if (score >= 5.0) return { label: 'Bueno', badgeClass: 'bg-primary text-white', barClass: 'bg-primary' };
    if (score >= 4.0) return { label: 'Aceptable', badgeClass: 'bg-warning text-dark', barClass: 'bg-warning' };
    return { label: 'Deficiente', badgeClass: 'bg-danger text-white', barClass: 'bg-danger' };
  }

  // --- Métricas VisAWI Modal & Actions ---
  openVisawiModal(): void {
    const list = this.assessment?.visawi_metricas || [
      { dimension: 'Simplicidad', puntaje: 5.8, target: 6.0, reactivo: 'Evaluación de la facilidad de uso y la ausencia de elementos innecesarios que puedan distraer al usuario.' },
      { dimension: 'Claridad', puntaje: 6.1, target: 6.0, reactivo: 'Evaluación del grado en el que el diseño es claro y comprensible.' },
      { dimension: 'Diversidad', puntaje: 5.2, target: 5.5, reactivo: 'Evaluación de la variedad y dinamismo en el diseño que mantienen el interés del usuario.' },
      { dimension: 'Armonía', puntaje: 5.9, target: 6.0, reactivo: 'Evaluación de la cohesión y coherencia de los elementos visuales.' }
    ];
    this.tempVisawiMetrics = JSON.parse(JSON.stringify(list));
    this.isVisawiModalOpen = true;
  }

  closeVisawiModal(): void {
    this.isVisawiModalOpen = false;
  }

  saveVisawiMetrics(): void {
    if (!this.assessment) return;

    this.isSaving = true;
    this.assessmentService.updateAssessment(this.projectId, { visawi_metricas: this.tempVisawiMetrics }).subscribe({
      next: (res: EvaluacionEsteticaResponse) => {
        this.assessment = res;
        this.isSaving = false;
        this.closeVisawiModal();
        this.showToast('Métricas VisAWI actualizadas exitosamente');
      },
      error: (err: any) => {
        console.error('Error al actualizar métricas VisAWI:', err);
        this.isSaving = false;
        alert('Hubo un error al guardar las métricas VisAWI.');
      }
    });
  }

  toggleVisawiQuestions(): void {
    this.isVisawiQuestionsOpen = !this.isVisawiQuestionsOpen;
  }

  // --- Informe Final Modal ---
  openFinalReportModal(): void {
    this.isFinalReportModalOpen = true;
  }

  closeFinalReportModal(): void {
    this.isFinalReportModalOpen = false;
  }

  // --- Cálculos en Vivo para la Encuesta Activa ---
  get totalAnsweredCount(): number {
    return this.visawiOfficialItems.filter(it => this.surveyItemAnswers[it.id] !== undefined && this.surveyItemAnswers[it.id] !== null).length;
  }

  calculateLiveDimensionScore(dimension: string): number {
    const items = this.getItemsByDimension(dimension);
    if (!items.length) return 0;
    const answered = items.filter(it => this.surveyItemAnswers[it.id] !== undefined && this.surveyItemAnswers[it.id] !== null);
    if (!answered.length) return 0;
    let sum = 0;
    for (const it of answered) {
      const raw = this.surveyItemAnswers[it.id];
      const score = it.inverso ? (8 - raw) : raw;
      sum += score;
    }
    return Number((sum / answered.length).toFixed(1));
  }

  get liveSurveySimplicidad(): number {
    return this.calculateLiveDimensionScore('Simplicidad');
  }

  get liveSurveyClaridad(): number {
    return this.calculateLiveDimensionScore('Claridad');
  }

  get liveSurveyDiversidad(): number {
    return this.calculateLiveDimensionScore('Diversidad');
  }

  get liveSurveyArmonia(): number {
    return this.calculateLiveDimensionScore('Armonía');
  }

  get liveSurveyGlobal(): number {
    if (this.totalAnsweredCount === 0) return 0;
    const s = this.liveSurveySimplicidad;
    const c = this.liveSurveyClaridad;
    const d = this.liveSurveyDiversidad;
    const a = this.liveSurveyArmonia;
    const scores = [s, c, d, a].filter(v => v > 0);
    if (!scores.length) return 0;
    return Number((scores.reduce((acc, curr) => acc + curr, 0) / scores.length).toFixed(1));
  }

  openSurveyModal(): void {
    this.surveyItemAnswers = {};
    this.surveyEvaluatorName = 'Participante Anónimo';
    this.surveyEvaluatorRole = 'Participante Anónimo';
    this.previewSurveyMode = 'completo';
    if (this.assessment?.pantallas_fase4?.length && !this.selectedScreenId) {
      this.selectedScreenId = this.assessment.pantallas_fase4[0].id;
    }
    this.isSurveyModalOpen = true;
  }

  closeSurveyModal(): void {
    this.isSurveyModalOpen = false;
  }

  openPreviewSurveyModal(): void {
    this.openSurveyModal();
  }

  closePreviewSurveyModal(): void {
    this.closeSurveyModal();
  }

  submitSurvey(): void {
    if (this.isSavingSurvey) return;

    if (this.totalAnsweredCount < 18) {
      this.showToast(`Por favor responde los 18 reactivos del cuestionario (${this.totalAnsweredCount}/18 respondidos).`);
      return;
    }

    this.isSavingSurvey = true;
    const payload: VisawiEncuestaRespuestaInput = {
      evaluador_nombre: 'Participante Anónimo',
      evaluador_rol: 'Participante Anónimo',
      respuestas: this.surveyItemAnswers
    };

    this.assessmentService.submitVisawiSurvey(this.projectId, payload).subscribe({
      next: (updated: EvaluacionEsteticaResponse) => {
        this.assessment = updated;
        this.isSavingSurvey = false;
        this.closeSurveyModal();
        this.showToast('¡Encuesta VisAWI guardada en la base de datos! Métricas actualizadas.');
      },
      error: (err: any) => {
        console.error('Error al guardar encuesta VisAWI:', err);
        this.isSavingSurvey = false;
        alert('Hubo un error al guardar la encuesta en la base de datos.');
      }
    });
  }

  deleteSurvey(surveyId: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!confirm('¿Deseas eliminar esta evaluación registrada de la base de datos? Se recalcularán los promedios globales.')) {
      return;
    }

    this.isDeletingSurveyId = surveyId;
    this.assessmentService.deleteVisawiSurvey(this.projectId, surveyId).subscribe({
      next: (updated: EvaluacionEsteticaResponse) => {
        this.assessment = updated;
        this.isDeletingSurveyId = null;
        if (this.selectedSurveyDetails?.id === surveyId) {
          this.selectedSurveyDetails = null;
        }
        this.showToast('Evaluación eliminada de la base de datos. Métricas actualizadas.');
      },
      error: (err: any) => {
        console.error('Error al eliminar evaluación:', err);
        this.isDeletingSurveyId = null;
        alert('No se pudo eliminar la evaluación.');
      }
    });
  }

  viewSurveyDetails(survey: VisawiEncuestaResponse): void {
    this.selectedSurveyDetails = survey;
  }

  closeSurveyDetails(): void {
    this.selectedSurveyDetails = null;
  }

  getItemById(id: number): VisawiQuestionnaireItem | undefined {
    return this.visawiOfficialItems.find(i => i.id === id);
  }

  getItemsByDimension(dim: string): VisawiQuestionnaireItem[] {
    return this.visawiOfficialItems.filter(i => i.dimension.toLowerCase() === dim.toLowerCase());
  }

  get publicSurveyUrl(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/survey/visawi/${this.projectId}`;
    }
    return `http://localhost:4200/survey/visawi/${this.projectId}`;
  }

  copySurveyUrl(): void {
    const url = this.publicSurveyUrl;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('¡Enlace de encuesta pública copiado al portapapeles!');
      }).catch(() => {
        this.showToast('Enlace listo para compartir');
      });
    } else {
      this.showToast('Enlace listo para compartir');
    }
  }

  openPublicSurvey(): void {
    if (typeof window !== 'undefined') {
      window.open(this.publicSurveyUrl, '_blank');
    }
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

    const finding: HallazgoCreateRequest = {
      problema: `[VisAWI - ${metric.dimension}] Calificación baja en percepción de usuarios (${metric.puntaje}/7.0). ${metric.recommendation}`,
      severidad: severidad,
      fase_origen: faseOrigen,
      fase_origen_nombre: faseNombre
    };

    this.assessmentService.addFinding(this.projectId, finding).subscribe({
      next: () => {
        this.showToast(`Hallazgo agregado a la matriz: [VisAWI - ${metric.dimension}]`);
      },
      error: (err: any) => {
        console.error('Error al agregar hallazgo desde VisAWI:', err);
        alert('No se pudo registrar el hallazgo.');
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}
