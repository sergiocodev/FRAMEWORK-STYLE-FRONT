import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router, ParamMap } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { DialogService } from '../../../../../core/services/dialog.service';
import { environment } from '../../../../../../environments/environment';
import {
  EvaluacionEsteticaResponse,
  PantallaFase4Item,
  Hallazgo,
  HallazgoCreateRequest
} from '../../../../../models/assessment.model';
import {
  GestaltTdaResponse,
  SimplexVertex,
  SimplexEdge,
  SimplexCycle,
  HallazgoSugerido
} from '../../../../../models/gestalt-tda.model';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-assessment-topology-gestalt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './assessment-topology-gestalt.component.html',
  styleUrl: './assessment-topology-gestalt.component.scss'
})
export class AssessmentTopologyGestaltComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private assessmentService: AssessmentService = inject(AssessmentService);
  private projectService: ProjectService = inject(ProjectService);
  private dialogService: DialogService = inject(DialogService);

  projectId: number = 1;
  project: any = null;
  assessment: EvaluacionEsteticaResponse | null = null;
  pantallasFase4: PantallaFase4Item[] = [];

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
    { label: 'Topología Gestalt (TDA)', active: true }
  ];

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  // TDA State
  isLoadingTda: boolean = true;
  isApplyingTda: boolean = false;
  tdaResult: GestaltTdaResponse | null = null;
  selectedTdaScreenId: number | null = null;
  showVrEdges: boolean = true;
  showH1Cycles: boolean = true;
  showContinuation: boolean = true;
  activeTdaDiagramTab: '0pd' | '1pd' = '0pd';

  // Toast message
  toastMessage: string | null = null;
  private toastTimeout: any;

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
        { label: 'Topología Gestalt (TDA)', active: true }
      ];

      this.loadProject();
      this.loadAssessmentAndTda();
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
      },
      error: (err: any) => console.error('Error al cargar proyecto:', err)
    });
  }

  loadAssessmentAndTda(): void {
    this.assessmentService.getAssessment(this.projectId).subscribe({
      next: (data: EvaluacionEsteticaResponse) => {
        this.assessment = data;
        this.pantallasFase4 = data.pantallas_fase4 || [];

        // Verificar si vino un queryParam pantallaId
        this.route.queryParamMap.subscribe((qParams: ParamMap) => {
          const qPantallaId = qParams.get('pantallaId');
          if (qPantallaId) {
            this.selectedTdaScreenId = Number(qPantallaId);
          } else if (this.pantallasFase4.length > 0) {
            this.selectedTdaScreenId = this.pantallasFase4[0].id;
          }
          this.runTdaAnalysis(this.selectedTdaScreenId);
        });
      },
      error: (err: any) => {
        console.error('Error al cargar evaluación:', err);
        this.runTdaAnalysis(null);
      }
    });
  }

  runTdaAnalysis(pantallaId?: number | null): void {
    this.isLoadingTda = true;
    this.assessmentService.getGestaltTda(this.projectId, pantallaId).subscribe({
      next: (res: GestaltTdaResponse) => {
        this.tdaResult = res;
        this.isLoadingTda = false;
      },
      error: (err: any) => {
        console.error('Error al ejecutar TDA Gestalt:', err);
        this.isLoadingTda = false;
        this.showToast('No se pudo completar el análisis topológico.');
      }
    });
  }

  onTdaScreenChange(screenIdStr: string): void {
    const screenId = screenIdStr ? parseInt(screenIdStr, 10) : null;
    this.selectedTdaScreenId = screenId;
    this.runTdaAnalysis(screenId);
  }

  applyTdaToAssessment(): void {
    if (!this.tdaResult) return;
    this.isApplyingTda = true;
    this.assessmentService.applyGestaltTda(this.projectId, {
      pantalla_id: this.selectedTdaScreenId,
      actualizar_checklist: true,
      crear_hallazgos: true
    }).subscribe({
      next: (res: { success: boolean; mensaje: string; score_gestalt_global: number; evaluacion: EvaluacionEsteticaResponse }) => {
        this.isApplyingTda = false;
        if (res.evaluacion) {
          this.assessment = res.evaluacion;
        }
        this.showToast(res.mensaje || '¡Resultados de TDA aplicados al checklist y hallazgos!');
      },
      error: (err: any) => {
        console.error('Error al aplicar resultados TDA:', err);
        this.isApplyingTda = false;
        this.dialogService.error('Ocurrió un error al aplicar las calificaciones topológicas.');
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
      next: (created: Hallazgo) => {
        this.showToast(`Hallazgo de ${hs.heuristica_id.toUpperCase()} agregado a la matriz.`);
      },
      error: (err: any) => {
        console.error('Error al agregar hallazgo TDA:', err);
        this.showToast('No se pudo agregar el hallazgo a la matriz.');
      }
    });
  }

  getImageUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiUrl}${cleanPath}`;
  }

  getVertexById(id: number): SimplexVertex | undefined {
    return this.tdaResult?.vertices.find((v: SimplexVertex) => v.id === id);
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
      .map((id: number) => {
        const v = this.getVertexById(id);
        return v ? `${v.x * 100},${v.y * 100}` : '';
      })
      .filter((p: string) => !!p)
      .join(' ');
  }

  showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }
}
