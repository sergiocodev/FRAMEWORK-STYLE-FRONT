import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectsService, ProyectoResponse } from '../projects.service';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.scss'
})
export class ProjectDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectsService = inject(ProjectsService);

  project: ProyectoResponse | null = null;
  isLoading = true;
  error = '';

  phases = [
    { id: 1, name: 'Investigación', route: 'investigation' },
    { id: 2, name: 'Diseño Conceptual', route: 'diseno_conceptual' },
    { id: 3, name: 'Diseño Visual', route: 'visual' },
    { id: 4, name: 'Diseño Detallado', route: 'detallado' },
    { id: 5, name: 'Evaluación Estética', route: 'evaluacion' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    } else {
      this.error = 'No se proporcionó un ID de proyecto válido.';
      this.isLoading = false;
    }
  }

  loadProject(id: string) {
    this.projectsService.getProjectById(id).subscribe({
      next: (data) => {
        this.project = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar el proyecto. Puede que no exista.';
        this.isLoading = false;
      }
    });
  }
}
