import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DisenoVisualHeaderComponent, Phase } from './components/diseno-visual-header/diseno-visual-header.component';
import { DisenoVisualSidebarComponent } from './components/diseno-visual-sidebar/diseno-visual-sidebar.component';
import { DisenoVisualLibraryComponent } from './components/diseno-visual-library/diseno-visual-library.component';
import { DisenoVisualPreviewComponent } from './components/diseno-visual-preview/diseno-visual-preview.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-diseno-visual',
  standalone: true,
  imports: [
    CommonModule,
    DisenoVisualHeaderComponent,
    DisenoVisualSidebarComponent,
    DisenoVisualLibraryComponent,
    DisenoVisualPreviewComponent,
    ModalComponent
  ],
  templateUrl: './diseno_visual.component.html',
  styleUrls: ['./diseno_visual.component.scss']
})
export class DisenoVisualComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  isPreviewModalOpen = false;
  project: any = null;
  phases: Phase[] = [];
  currentProjectId: number = 0;

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
}
