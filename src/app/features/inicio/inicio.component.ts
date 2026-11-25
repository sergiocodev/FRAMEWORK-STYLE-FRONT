import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ProjectsService } from '../projects/projects.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent {
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  // Modal State
  isCreateModalOpen = false;
  isSubmitting = false;
  newProject = {
    nombre: '',
    tipo: 'nuevo'
  };

  openCreateModal(tipo: 'nuevo' | 'rediseño') {
    this.newProject = {
      nombre: '',
      tipo: tipo
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  submitCreateProject() {
    if (!this.newProject.nombre.trim()) return;

    this.isSubmitting = true;
    this.projectsService.createProject(this.newProject).subscribe({
      next: (createdProject) => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.router.navigate(['/projects', createdProject.id]);
      },
      error: (err) => {
        console.error('Error al crear proyecto:', err);
        this.isSubmitting = false;
        alert('Ocurrió un error al crear el proyecto.');
      }
    });
  }
}
