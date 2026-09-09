import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Phase } from '../../../shared/components/stepper/stepper.component';
import { InvestigationHeaderComponent } from './components/investigation-header/investigation-header.component';
import { InvestigationNecessityComponent } from './components/investigation-necessity/investigation-necessity.component';
import { InvestigationUsersComponent } from './components/investigation-users/investigation-users.component';
import { InvestigationResourcesComponent } from './components/investigation-resources/investigation-resources.component';
import { InvestigationPreviewComponent } from './components/investigation-preview/investigation-preview.component';

import { ProjectService } from '../../../core/services/project.service';
import { InvestigationService } from '../services/investigation.service';

@Component({
  selector: 'app-investigation',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    InvestigationHeaderComponent,
    InvestigationNecessityComponent,
    InvestigationUsersComponent,
    InvestigationResourcesComponent,
    InvestigationPreviewComponent
  ],
  templateUrl: './investigation.component.html',
  styleUrls: ['./investigation.component.scss']
})
export class InvestigationComponent implements OnInit {
  private projectService = inject(ProjectService);
  private investigationService = inject(InvestigationService);
  private route = inject(ActivatedRoute);

  isLoading = true;
  error = false;

  project: any = {};
  phases: Phase[] = [];
  necesidad: string = '';
  usuarios: any[] = [];
  recursos: any[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const projectId = Number(idParam);
        this.fetchData(projectId);
      } else {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private fetchData(projectId: number) {
    this.isLoading = true;
    forkJoin({
      project: this.projectService.getProjectById(projectId),
      // Si el informe no existe (404), capturamos el error para no romper todo el forkJoin
      informe: this.investigationService.getInforme(projectId).pipe(catchError(() => of({ necesidad_proyecto: 'Aún no se ha definido una necesidad.' }))),
      arquetipos: this.investigationService.getArquetipos(projectId).pipe(catchError(() => of([]))),
      recursosList: this.investigationService.getRecursos(projectId).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        // Map Project
        this.project = {
          title: data.project.nombre,
          status: data.project.estado,
          type: data.project.tipo,
          client: data.project.cliente?.nombre || 'Sin cliente asignado'
        };

        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: data.project.fase_actual_id >= 1 ? 'active' : 'upcoming' },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: data.project.fase_actual_id >= 2 ? (data.project.fase_actual_id === 2 ? 'active' : 'completed') : 'upcoming' },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: data.project.fase_actual_id >= 3 ? (data.project.fase_actual_id === 3 ? 'active' : 'completed') : 'upcoming' },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: data.project.fase_actual_id >= 4 ? (data.project.fase_actual_id === 4 ? 'active' : 'completed') : 'upcoming' },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: data.project.fase_actual_id >= 5 ? (data.project.fase_actual_id === 5 ? 'active' : 'completed') : 'upcoming' }
        ];

        // Map Informe
        this.necesidad = data.informe.necesidad_proyecto || 'Sin descripción detallada';

        // Map Arquetipos
        this.usuarios = data.arquetipos.map((a: any) => ({
          name: a.nombre,
          role: a.nombre, 
          tag: a.etiqueta || 'General',
          photoUrl: 'https://i.pravatar.cc/150?img=11', // Placeholder genérico temporal
          needs: a.necesidades ? a.necesidades.map((n: any) => n.descripcion) : []
        }));

        // Map Recursos
        this.recursos = data.recursosList.map((r: any) => {
          const type = r.nombre_original.endsWith('.pdf') ? 'pdf' : 
                       (r.nombre_original.endsWith('.zip') ? 'zip' : 'image');
                       
          const sizeMB = r.tamano_bytes ? (r.tamano_bytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Desconocido';

          return {
            name: r.nombre_original,
            size: sizeMB,
            type: type
          };
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }
}
