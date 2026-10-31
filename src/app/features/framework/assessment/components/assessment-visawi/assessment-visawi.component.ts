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
  HallazgoCreateRequest
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

  // Vista Previa de Encuesta
  isPreviewSurveyModalOpen: boolean = false;
  previewSurveyMode: 'completo' | 'dimensiones' = 'completo';
  previewAnswers: Record<string, number> = {};
  previewItemAnswers: Record<number, number> = {
    1: 2, 2: 6, 3: 6, 4: 2, 5: 6,
    6: 6, 7: 2, 8: 6, 9: 2,
    10: 2, 11: 5, 12: 2, 13: 5, 14: 6,
    15: 6, 16: 2, 17: 2, 18: 6
  };

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
    { value: 1, label: 'Totalmente en desacuerdo', short: 'TD (1)' },
    { value: 2, label: 'En desacuerdo', short: 'D (2)' },
    { value: 3, label: 'Ligeramente en desacuerdo', short: 'LD (3)' },
    { value: 4, label: 'Neutral', short: 'N (4)' },
    { value: 5, label: 'Ligeramente de acuerdo', short: 'LA (5)' },
    { value: 6, label: 'De acuerdo', short: 'A (6)' },
    { value: 7, label: 'Totalmente de acuerdo', short: 'TA (7)' }
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
          { label: 'Psicométrico VisAWI', active: true }
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
      },
      error: (err: any) => {
        console.error('Error al cargar evaluación:', err);
        this.isLoading = false;
      }
    });
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

  // --- Métricas VisAWI Modal & Actions ---
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
      next: (updated: EvaluacionEsteticaResponse) => {
        this.isSaving = false;
        this.assessment = updated;
        this.closeVisawiModal();
        this.showToast('Métricas y Benchmarks VisAWI actualizados con éxito');
      },
      error: (err: any) => {
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
