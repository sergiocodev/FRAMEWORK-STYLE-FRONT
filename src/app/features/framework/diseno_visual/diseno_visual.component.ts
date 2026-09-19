import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DisenoVisualHeaderComponent, Phase } from './components/diseno-visual-header/diseno-visual-header.component';
import { DisenoVisualLibraryComponent } from './components/diseno-visual-library/diseno-visual-library.component';
import { DisenoVisualPreviewComponent } from './components/diseno-visual-preview/diseno-visual-preview.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProjectService } from '../../../core/services/project.service';
import { DisenoVisualService } from './services/diseno-visual.service';

@Component({
  selector: 'app-diseno-visual',
  standalone: true,
  imports: [
    CommonModule,
    DisenoVisualHeaderComponent,
    DisenoVisualLibraryComponent,
    DisenoVisualPreviewComponent,
    ModalComponent,
    PageHeaderComponent
  ],
  templateUrl: './diseno_visual.component.html',
  styleUrls: ['./diseno_visual.component.scss']
})
export class DisenoVisualComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private disenoVisualService = inject(DisenoVisualService);

  isPreviewModalOpen = false;
  project: any = null;
  phases: Phase[] = [];
  currentProjectId: number = 0;
  isCompleting: boolean = false;

  headerBreadcrumbs: any[] = [];
  
  get formattedStatus(): string {
    const status = this.project?.status;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.currentProjectId = idParam ? Number(idParam) : 1; 
      this.fetchProject(this.currentProjectId);
    });
  }

  fetchProject(id: number) {
    this.projectService.getProjectById(id).subscribe({
      next: (data: any) => {
        this.project = {
          title: data.nombre,
          status: data.estado,
          type: data.tipo,
          client: data.cliente?.nombre || 'Sin cliente asignado'
        };

        this.headerBreadcrumbs = [
          { label: 'Inicio', url: '/' },
          { label: 'Proyectos', url: '/projects' },
          { label: this.project.title, active: true }
        ];

        const currentPhaseId = data.fase_actual_id || 1;
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: currentPhaseId > 1 ? 'completed' : (currentPhaseId === 1 ? 'active' : 'upcoming') },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: currentPhaseId > 2 ? 'completed' : (currentPhaseId === 2 ? 'active' : 'upcoming') },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: currentPhaseId > 3 ? 'completed' : (currentPhaseId === 3 ? 'active' : 'upcoming') },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: currentPhaseId > 4 ? 'completed' : (currentPhaseId === 4 ? 'active' : 'upcoming') },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: currentPhaseId > 5 ? 'completed' : (currentPhaseId === 5 ? 'active' : 'upcoming') }
        ];
      },
      error: (err: any) => {
        console.error('Error fetching project data:', err);
      }
    });
  }

  openPreviewModal() {
    this.isPreviewModalOpen = true;
  }

  closePreviewModal() {
    this.isPreviewModalOpen = false;
  }

  completePhase(): void {
    if (!this.currentProjectId) return;

    // Validación básica: Al menos un color y una tipografía definidos
    const colors = this.disenoVisualService.colores();
    const typos = this.disenoVisualService.tipografias();
    
    if (colors.length === 0 || typos.length === 0) {
      alert('Por favor agrega al menos un color y una tipografía a tu biblioteca de estilos antes de continuar.');
      return;
    }

    this.isCompleting = true;
    this.projectService.updateProject(this.currentProjectId, { fase_actual_id: 4 }).subscribe({
      next: () => {
        this.isCompleting = false;
        this.isPreviewModalOpen = false;
        this.router.navigate(['/framework/projects', this.currentProjectId, 'detallado']);
      },
      error: (err) => {
        console.error('Error al avanzar fase', err);
        this.isCompleting = false;
        alert('Ocurrió un error al intentar avanzar de fase.');
      }
    });
  }
}
