import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Phase } from '../../../shared/components/stepper/stepper.component';

import { DisenoHeaderComponent } from './components/diseno-header/diseno-header.component';
import { DisenoCanvasComponent } from './components/diseno-canvas/diseno-canvas.component';
import { DisenoInventoryComponent } from './components/diseno-inventory/diseno-inventory.component';
import { DisenoWireframesComponent } from './components/diseno-wireframes/diseno-wireframes.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ProjectService } from '../../../core/services/project.service';
import { DisenoConceptualService } from '../services/diseno-conceptual.service';

@Component({
  selector: 'app-diseno-conceptual',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    DragDropModule,
    DisenoHeaderComponent,
    DisenoCanvasComponent,
    DisenoInventoryComponent,
    DisenoWireframesComponent
  ],
  templateUrl: './diseno-conceptual.component.html',
  styleUrls: ['./diseno-conceptual.component.scss']
})
export class DisenoConceptualComponent implements OnInit {
  private projectService = inject(ProjectService);
  private disenoConceptualService = inject(DisenoConceptualService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = true;
  error = false;

  project: any = {};
  phases: Phase[] = [];
  projectId!: number;
  isCompleting: boolean = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = Number(idParam);
        this.fetchData(this.projectId);
      } else {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private fetchData(projectId: number) {
    this.isLoading = true;
    
    // Solo traemos el proyecto para armar el header y stepper
    this.projectService.getProjectById(projectId).subscribe({
      next: (projectData: any) => {
        this.project = {
          title: projectData.nombre,
          status: projectData.estado,
          type: projectData.tipo,
          client: projectData.cliente?.nombre || 'Sin cliente asignado'
        };

        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: 'completed' },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: 'active' },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: 'upcoming' },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: 'upcoming' },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: 'upcoming' }
        ];

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        // Fallback for static demo if API fails
        this.project = {
          title: 'Plataforma Educativa',
          status: 'Nuevo',
          type: 'Web',
          client: 'Colegio San Martín'
        };
        this.phases = [
          { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: 'completed' },
          { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: 'active' },
          { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: 'upcoming' },
          { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: 'upcoming' },
          { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: 'upcoming' }
        ];
        this.isLoading = false;
      }
    });
  }

  completePhase(): void {
    if (!this.projectId) return;

    this.isCompleting = true;
    
    // Validación básica: Al menos un nodo creado
    this.disenoConceptualService.getNodos(this.projectId).subscribe({
      next: (nodos) => {
        if (!nodos || nodos.length === 0) {
          alert('Por favor agrega al menos una pantalla (nodo) en el mapa conceptual antes de continuar.');
          this.isCompleting = false;
          return;
        }

        // Si pasa validación, continuar
        this.projectService.updateProject(this.projectId, { fase_actual_id: 3 }).subscribe({
          next: () => {
            this.isCompleting = false;
            this.router.navigate(['/framework/projects', this.projectId, 'visual']);
          },
          error: (err) => {
            console.error('Error al avanzar fase', err);
            this.isCompleting = false;
            alert('Ocurrió un error al intentar avanzar de fase.');
          }
        });
      },
      error: () => {
        alert('No se pudo validar el mapa conceptual. Intenta nuevamente.');
        this.isCompleting = false;
      }
    });
  }
}
