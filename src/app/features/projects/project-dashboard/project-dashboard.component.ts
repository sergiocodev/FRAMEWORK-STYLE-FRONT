import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProjectsService, ProyectoResponse } from '../projects.service';
import { ClientsService, ClientResponse } from '../clients.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

export interface PhaseInfo {
  id: number;
  name: string;
  route: string;
  subtitle: string;
  badgeLabel: string;
}

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.scss'
})
export class ProjectDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectsService = inject(ProjectsService);
  private clientsService = inject(ClientsService);
  private dialogService = inject(DialogService);

  project: ProyectoResponse | null = null;
  isLoading = true;
  error = '';

  // Edit Modal State
  isEditModalOpen = false;
  isSubmitting = false;
  clientsList: ClientResponse[] = [];
  editingProject: any = {
    nombre: '',
    cliente_id: null,
    plataforma: 'web',
    nivel_diseno_objetivo: 'medio',
    estado: 'en_proceso'
  };

  phases: PhaseInfo[] = [
    {
      id: 1,
      name: 'Investigación',
      route: 'investigation',
      subtitle: 'Benchmark competitivo y matriz de requisitos',
      badgeLabel: 'Fase 1'
    },
    {
      id: 2,
      name: 'Diseño Conceptual',
      route: 'diseno_conceptual',
      subtitle: 'Jerarquía funcional, wireframes y diagnóstico ortogonal',
      badgeLabel: 'Fase 2'
    },
    {
      id: 3,
      name: 'Diseño Visual',
      route: 'visual',
      subtitle: 'Moodboard, paleta cromática, tipografía y tokens',
      badgeLabel: 'Fase 3'
    },
    {
      id: 4,
      name: 'Diseño Detallado',
      route: 'detallado',
      subtitle: 'Componentes GUI, layouts y accesibilidad WCAG 2.2',
      badgeLabel: 'Fase 4'
    },
    {
      id: 5,
      name: 'Evaluación Estética',
      route: 'evaluacion',
      subtitle: 'Validación con ViSAWI, Calista AI y Topología Gestalt',
      badgeLabel: 'Fase 5'
    }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
      this.loadClients();
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

  loadClients() {
    this.clientsService.getClients().subscribe({
      next: (clients) => this.clientsList = clients,
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  // --- NAVEGACIÓN LIBRE DE FASES ---
  isPhaseUnlocked(phaseId: number): boolean {
    if (!this.project) return false;
    return phaseId <= this.project.fase_actual_id;
  }

  navigateToPhase(phase: PhaseInfo) {
    if (!this.project) return;
    if (this.isPhaseUnlocked(phase.id)) {
      this.router.navigate(['/framework/projects', this.project.id, phase.route]);
    } else {
      this.dialogService.warning(
        `La Fase ${phase.id} (${phase.name}) se encuentra bloqueada actualmente.\nDebes completar las fases anteriores para poder acceder.`,
        'Fase Bloqueada'
      );
    }
  }

  getPhaseTooltip(phase: PhaseInfo): string {
    if (!this.project) return '';
    if (phase.id < this.project.fase_actual_id) {
      return `Fase ${phase.id}: Completada. Clic para acceder y revisar.`;
    } else if (phase.id === this.project.fase_actual_id) {
      return `Fase ${phase.id}: En proceso actualmente. Clic para continuar.`;
    } else {
      return `Fase ${phase.id}: Bloqueada. Completa las fases previas primero.`;
    }
  }

  // --- MODAL DE EDICIÓN ---
  openEditModal() {
    if (!this.project) return;
    this.editingProject = {
      nombre: this.project.nombre,
      cliente_id: this.project.cliente_id || null,
      plataforma: this.project.plataforma || 'web',
      nivel_diseno_objetivo: this.project.nivel_diseno_objetivo || 'medio',
      estado: this.project.estado || 'en_proceso'
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  submitEditProject() {
    if (!this.project || !this.editingProject.nombre.trim()) return;

    this.isSubmitting = true;
    const updateData = {
      nombre: this.editingProject.nombre.trim(),
      cliente_id: this.editingProject.cliente_id ? Number(this.editingProject.cliente_id) : null,
      plataforma: this.editingProject.plataforma,
      nivel_diseno_objetivo: this.editingProject.nivel_diseno_objetivo,
      estado: this.editingProject.estado
    };

    this.projectsService.updateProject(this.project.id.toString(), updateData).subscribe({
      next: (updatedProj) => {
        this.project = updatedProj;
        this.isSubmitting = false;
        this.closeEditModal();
        this.dialogService.success('Proyecto actualizado correctamente.');
      },
      error: (err) => {
        console.error('Error al editar proyecto:', err);
        this.isSubmitting = false;
        this.dialogService.error('Ocurrió un error al guardar los cambios del proyecto.');
      }
    });
  }
}
