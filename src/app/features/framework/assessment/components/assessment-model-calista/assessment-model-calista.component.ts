import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AssessmentService } from '../../../services/assessment.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { environment } from '../../../../../../environments/environment';
import {
  CalistaEvaluacionResponse,
  CalistaPantallaResult,
  CalistaApplyRequest,
  CalistaModeloInfo
} from '../../../../../models/assessment.model';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-assessment-model-calista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './assessment-model-calista.component.html',
  styleUrl: './assessment-model-calista.component.scss'
})
export class AssessmentModelCalistaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assessmentService = inject(AssessmentService);
  private projectService = inject(ProjectService);

  projectId: number = 1;
  project: any = null;
  calistaData: CalistaEvaluacionResponse | null = null;
  pantallaSeleccionada: CalistaPantallaResult | null = null;

  modelosDisponibles: CalistaModeloInfo[] = [];
  modeloSeleccionado: string = '';

  isLoading: boolean = true;
  isAnalyzing: boolean = false;
  isApplyingFinding: boolean = false;
  viewerMode: 'contain' | 'width' | 'natural' = 'contain';
  toastMessage: string | null = null;
  private toastTimeout: any;

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
    { label: 'Modelo Calista (AI)', active: true }
  ];

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = Number(id);
        this.updateBreadcrumbs();
        this.loadProject();
        this.loadCalistaData();
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = Number(id);
        this.updateBreadcrumbs();
        this.loadProject();
        this.loadCalistaData();
      }
    });
  }

  updateBreadcrumbs(): void {
    this.headerBreadcrumbs = [
      { label: 'Inicio', url: '/' },
      { label: 'Proyectos', url: '/projects' },
      { label: 'Evaluación Estética', url: `/framework/projects/${this.projectId}/evaluacion` },
      { label: 'Modelo Calista (AI)', active: true }
    ];
  }

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
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
        const currentPhaseId = res?.fase_actual_id || 5;
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: currentPhaseId > 1 ? 'completed' : (currentPhaseId === 1 ? 'active' : 'upcoming') },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: currentPhaseId > 2 ? 'completed' : (currentPhaseId === 2 ? 'active' : 'upcoming') },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: currentPhaseId > 3 ? 'completed' : (currentPhaseId === 3 ? 'active' : 'upcoming') },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: currentPhaseId > 4 ? 'completed' : (currentPhaseId === 4 ? 'active' : 'upcoming') },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: currentPhaseId >= 5 ? 'active' : 'upcoming' }
        ];
      },
      error: (err: any) => console.error('Error al cargar proyecto:', err)
    });
  }

  get modeloActivoInfo(): CalistaModeloInfo | undefined {
    return this.modelosDisponibles.find(m => m.id === this.modeloSeleccionado);
  }

  loadCalistaData(pantallaId?: number, modeloId?: string): void {
    this.isLoading = true;
    const targetModel = modeloId || this.modeloSeleccionado;

    this.assessmentService.getCalista(this.projectId, pantallaId, targetModel).subscribe({
      next: (data: CalistaEvaluacionResponse) => {
        this.calistaData = data;
        this.isLoading = false;

        if (data.modelos_disponibles && data.modelos_disponibles.length > 0) {
          this.modelosDisponibles = data.modelos_disponibles;
        }

        if (data.modelo_activo) {
          this.modeloSeleccionado = data.modelo_activo;
        } else if (!this.modeloSeleccionado && this.modelosDisponibles.length > 0) {
          this.modeloSeleccionado = this.modelosDisponibles[0].id;
        }

        if (pantallaId) {
          const encontrada = data.pantallas.find(p => p.pantalla_id === pantallaId);
          this.pantallaSeleccionada = encontrada || data.pantallas[0] || null;
        } else if (data.pantalla_seleccionada) {
          this.pantallaSeleccionada = data.pantalla_seleccionada;
        } else if (data.pantallas && data.pantallas.length > 0) {
          this.pantallaSeleccionada = data.pantallas[0];
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evaluación Calista:', err);
        this.isLoading = false;
        this.showToast('Error al conectar con el servicio Calista.');
      }
    });
  }

  onModeloChange(nuevoModeloId: string): void {
    if (nuevoModeloId === this.calistaData?.modelo_activo && nuevoModeloId === this.modeloSeleccionado) {
      return;
    }
    this.modeloSeleccionado = nuevoModeloId;
    const mInfo = this.modelosDisponibles.find(m => m.id === nuevoModeloId);
    this.showToast(`Cambiando motor neuronal a: ${mInfo?.nombre || nuevoModeloId}`);
    this.loadCalistaData(this.pantallaSeleccionada?.pantalla_id, nuevoModeloId);
  }

  imageLoadFailed: boolean = false;

  seleccionarPantalla(pantalla: CalistaPantallaResult): void {
    this.pantallaSeleccionada = pantalla;
    this.imageLoadFailed = false;
  }

  onImageError(): void {
    this.imageLoadFailed = true;
  }

  onScreenSelectChange(pantallaIdVal: any): void {
    const id = Number(pantallaIdVal);
    const p = this.calistaData?.pantallas.find(item => item.pantalla_id === id);
    if (p) {
      this.seleccionarPantalla(p);
    }
  }

  ejecutarInferencia(): void {
    if (!this.pantallaSeleccionada) return;
    this.isAnalyzing = true;
    this.assessmentService.analizarCalista(
      this.projectId,
      this.pantallaSeleccionada.pantalla_id,
      this.modeloSeleccionado
    ).subscribe({
      next: (data: CalistaEvaluacionResponse) => {
        this.calistaData = data;
        this.isAnalyzing = false;
        if (data.modelos_disponibles) {
          this.modelosDisponibles = data.modelos_disponibles;
        }
        if (data.modelo_activo) {
          this.modeloSeleccionado = data.modelo_activo;
        }
        const actualizada = data.pantallas.find(p => p.pantalla_id === this.pantallaSeleccionada?.pantalla_id);
        if (actualizada) {
          this.pantallaSeleccionada = actualizada;
        }
        this.showToast(`Inferencia ejecutada con éxito con el modelo: ${this.modeloActivoInfo?.nombre || this.modeloSeleccionado}`);
      },
      error: (err: any) => {
        console.error('Error al ejecutar inferencia Calista:', err);
        this.isAnalyzing = false;
        this.showToast('Error al ejecutar la predicción con el modelo.');
      }
    });
  }

  aplicarHallazgo(): void {
    if (!this.pantallaSeleccionada || !this.pantallaSeleccionada.hallazgo_sugerido) return;

    const sugerido = this.pantallaSeleccionada.hallazgo_sugerido;
    const req: CalistaApplyRequest = {
      pantalla_id: this.pantallaSeleccionada.pantalla_id,
      problema: sugerido.problema,
      severidad: sugerido.severidad,
      fase_origen: sugerido.fase_origen,
      fase_origen_nombre: sugerido.fase_origen_nombre
    };

    this.isApplyingFinding = true;
    this.assessmentService.aplicarCalistaHallazgo(this.projectId, req).subscribe({
      next: (res: any) => {
        this.isApplyingFinding = false;
        this.showToast(res.mensaje || 'Hallazgo transferido exitosamente a la Matriz Central.');
      },
      error: (err: any) => {
        console.error('Error al aplicar hallazgo:', err);
        this.isApplyingFinding = false;
        this.showToast('No se pudo transferir el hallazgo a la matriz.');
      }
    });
  }

  setViewerMode(mode: 'contain' | 'width' | 'natural'): void {
    this.viewerMode = mode;
  }

  getImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getCategoriaBadgeClass(categoria?: string | null): string {
    switch (categoria) {
      case 'Alta': return 'badge-calista-alta';
      case 'Media': return 'badge-calista-media';
      case 'Baja': return 'badge-calista-baja';
      case 'Pendiente': return 'badge-calista-pendiente';
      default: return 'bg-secondary text-white';
    }
  }

  getPercentilWidth(score?: number | null): number {
    if (score === null || score === undefined) return 0;
    return Math.round(((Math.max(1, Math.min(7, score)) - 1) / (7 - 1)) * 100);
  }

  showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }
}
