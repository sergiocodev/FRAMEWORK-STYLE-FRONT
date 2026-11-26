import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProjectsService, ProyectoResponse } from './projects.service';
import { ClientsService, ClientResponse } from './clients.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { DialogService } from '../../core/services/dialog.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

export interface Project {
  id: string;
  name: string;
  client: string;
  lastModified: string;
  status: 'Nuevo' | 'En desarrollo' | 'En espera' | 'Completado';
  currentPhase: number;
  type: 'Nuevo' | 'Rediseño';
  icon: string;
  iconBg: string;
  iconColor: string;
  rawPlataforma?: string;
  rawNivelDiseno?: 'bajo' | 'medio' | 'alto';
  rawClienteId?: number;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private clientsService = inject(ClientsService);
  private authState = inject(AuthStateService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  userGreetingName = computed(() => {
    const user = this.authState.currentUser();
    if (user?.full_name) {
      return user.full_name.split(' ')[0];
    }
    return user?.username || 'Diseñador';
  });

  statusFilter = 'Todos';

  headerBreadcrumbs = [
    { label: 'Inicio', url: '#' },
    { label: 'Gestor de Proyectos', active: true }
  ];

  // 3 KPIs claros y reales (Total, En desarrollo, Completados)
  kpis = [
    { label: 'Total de proyectos', value: '0', trend: 'Registrados', bg: 'bg-primary-subtle', color: 'text-primary', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
    { label: 'En desarrollo', value: '0', trend: 'Fases activas', bg: 'bg-success-subtle', color: 'text-success', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01' },
    { label: 'Completados', value: '0', trend: 'Fase 5 culminada', bg: 'bg-info-subtle', color: 'text-info', icon: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' }
  ];

  phases = [
    'Investigación',
    'Diseño Conceptual',
    'Diseño Visual',
    'Diseño Detallado',
    'Evaluación Estética'
  ];

  projects: Project[] = [];
  filteredProjects: Project[] = [];

  isLoading = true;
  searchTerm = '';
  visibleCount = 6;

  // Modal State
  isCreateModalOpen = false;
  isSubmitting = false;
  newProject = {
    nombre: '',
    tipo: 'nuevo'
  };

  isEditModalOpen = false;
  editingProject: any = {
    id: '',
    nombre: '',
    cliente_id: null,
    plataforma: '',
    nivel_diseno_objetivo: 'medio'
  };

  // Clients State
  clientsList: ClientResponse[] = [];
  isCreatingClient = false;
  isSubmittingClient = false;
  newClientData = { nombre: '', contacto_correo: '' };

  // Custom Dropdown State
  isClientDropdownOpen = false;
  clientSearchTerm = '';

  // Default icons for generic mapping if needed
  private iconMap = [
    { bg: 'bg-primary-subtle', color: 'text-primary', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
    { bg: 'bg-purple-subtle', color: 'text-purple', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z' },
    { bg: 'bg-success-subtle', color: 'text-success', icon: 'M5 12h14M12 5v14M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { bg: 'bg-orange-subtle', color: 'text-orange', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }
  ];

  ngOnInit() {
    this.isLoading = true;

    // Load clients
    this.clientsService.getClients().subscribe({
      next: (clients) => {
        this.clientsList = clients;
      },
      error: (err) => console.error('Error loading clients:', err)
    });

    // Load projects
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        this.projects = data.map((p, index) => this.mapToProject(p, index));
        this.calculateKPIs(this.projects);
        this.filterProjects(); // Initialize filtered array
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.isLoading = false;
      }
    });
  }

  calculateKPIs(data: Project[]) {
    const total = data.length;
    const inDev = data.filter(p => p.status === 'En desarrollo' || p.status === 'Nuevo').length;
    const completed = data.filter(p => p.status === 'Completado').length;

    this.kpis[0].value = total.toString();
    this.kpis[1].value = inDev.toString();
    this.kpis[2].value = completed.toString();
  }

  filterProjects() {
    let result = this.projects;

    if (this.statusFilter === 'Activos' || this.statusFilter === 'En desarrollo') {
      result = result.filter(p => p.status === 'En desarrollo' || p.status === 'Nuevo');
    } else if (this.statusFilter === 'Completados') {
      result = result.filter(p => p.status === 'Completado');
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.client.toLowerCase().includes(term)
      );
    }

    this.filteredProjects = result;
    this.visibleCount = 6;
  }

  loadMore() {
    this.visibleCount += 6;
  }

  private mapToProject(dto: ProyectoResponse, index: number): Project {
    // Determine visual icon styling
    const visual = this.iconMap[index % this.iconMap.length];

    return {
      id: dto.id.toString(),
      name: dto.nombre,
      client: dto.cliente?.nombre || 'Cliente Desconocido',
      lastModified: this.formatDate(dto.actualizado_en || dto.creado_en),
      status: this.mapStatus(dto.estado),
      currentPhase: dto.fase_actual_id,
      type: dto.tipo === 'nuevo' ? 'Nuevo' : 'Rediseño',
      icon: visual.icon,
      iconBg: visual.bg,
      iconColor: visual.color,
      rawPlataforma: dto.plataforma,
      rawNivelDiseno: dto.nivel_diseno_objetivo,
      rawClienteId: dto.cliente_id
    };
  }

  private mapStatus(estado: string): 'Nuevo' | 'En desarrollo' | 'En espera' | 'Completado' {
    switch (estado) {
      case 'en_proceso': return 'En desarrollo';
      case 'en_espera': return 'En espera';
      case 'completado': return 'Completado';
      case 'detenido': return 'En espera'; // mapping detenido to 'En espera' conceptually
      default: return 'Nuevo';
    }
  }

  private formatDate(dateString: string): string {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Fecha inválida';

    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day < 10 ? '0' + day : day} ${month} ${year}, ${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Nuevo': return 'bg-primary-subtle text-primary border-0';
      case 'En desarrollo': return 'bg-purple-subtle text-purple border-0';
      case 'En espera': return 'bg-orange-subtle text-orange border-0';
      case 'Completado': return 'bg-success-subtle text-success border-0';
      default: return 'bg-light text-dark border-0';
    }
  }

  getPhaseTooltip(phaseIndex: number, currentPhase: number, phaseName: string): string {
    if (phaseIndex < currentPhase - 1) {
      return `${phaseName}: Completado satisfactoriamente.`;
    } else if (phaseIndex === currentPhase - 1) {
      return `${phaseName}: Fase actual en proceso.`;
    } else {
      return `${phaseName}: Pendiente de inicio.`;
    }
  }

  goToProject(id: string) {
    this.router.navigate(['/projects', id]);
  }

  continuePhase(project: Project, event: Event) {
    event.stopPropagation();

    let phaseRoute = 'investigation';
    switch (project.currentPhase) {
      case 1: phaseRoute = 'investigation'; break;
      case 2: phaseRoute = 'diseno_conceptual'; break;
      case 3: phaseRoute = 'visual'; break;
      case 4: phaseRoute = 'detallado'; break;
      case 5: phaseRoute = 'evaluacion'; break;
    }

    this.router.navigate(['/framework/projects', project.id, phaseRoute]);
  }

  goToPhase(project: Project, phaseIndex: number, event: Event) {
    event.stopPropagation();
    const phaseRoutes = [
      'investigation',
      'diseno_conceptual',
      'visual',
      'detallado',
      'evaluacion'
    ];
    const targetRoute = phaseRoutes[phaseIndex] || 'investigation';
    this.router.navigate(['/framework/projects', project.id, targetRoute]);
  }

  // Quick Actions (3-dots menu)
  openEditModal(project: Project, event: Event) {
    event.stopPropagation();
    this.editingProject = {
      id: project.id,
      nombre: project.name,
      cliente_id: project.rawClienteId || null,
      plataforma: project.rawPlataforma || '',
      nivel_diseno_objetivo: project.rawNivelDiseno || 'medio'
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.isCreatingClient = false;
    this.isClientDropdownOpen = false;
  }

  get filteredClientsList(): ClientResponse[] {
    if (!this.clientSearchTerm) return this.clientsList;
    const term = this.clientSearchTerm.toLowerCase();
    return this.clientsList.filter(c => c.nombre.toLowerCase().includes(term));
  }

  getClientName(clientId: number | null): string {
    if (!clientId) return 'Seleccione un cliente'; // From the screenshot
    const client = this.clientsList.find(c => c.id === clientId);
    return client ? client.nombre : 'Seleccione un cliente';
  }

  toggleClientDropdown() {
    this.isClientDropdownOpen = !this.isClientDropdownOpen;
    if (this.isClientDropdownOpen) {
      this.clientSearchTerm = '';
    }
  }

  selectClient(clientId: number | null) {
    this.editingProject.cliente_id = clientId;
    this.isClientDropdownOpen = false;
  }

  openCreateClient() {
    this.isCreatingClient = true;
    this.editingProject.cliente_id = null;
    this.newClientData = { nombre: '', contacto_correo: '' };
    this.isClientDropdownOpen = false;
  }

  cancelClientCreation() {
    this.isCreatingClient = false;
    this.editingProject.cliente_id = null;
  }

  createNewClientInline() {
    if (!this.newClientData.nombre.trim()) return;

    this.isSubmittingClient = true;
    this.clientsService.createClient(this.newClientData).subscribe({
      next: (createdClient) => {
        this.clientsList.push(createdClient);
        this.editingProject.cliente_id = createdClient.id;
        this.isCreatingClient = false;
        this.isSubmittingClient = false;
      },
      error: (err) => {
        console.error('Error creando cliente:', err);
        this.isSubmittingClient = false;
        this.dialogService.error('Ocurrió un error al intentar crear el cliente.');
      }
    });
  }

  submitEditProject() {
    if (!this.editingProject.nombre.trim()) return;

    this.isSubmitting = true;

    // Only send fields we actually want to update
    const updateData = {
      nombre: this.editingProject.nombre,
      cliente_id: this.editingProject.cliente_id,
      plataforma: this.editingProject.plataforma,
      nivel_diseno_objetivo: this.editingProject.nivel_diseno_objetivo
    };

    this.projectsService.updateProject(this.editingProject.id, updateData).subscribe({
      next: (updatedProj) => {
        // Find and update the local array
        const index = this.projects.findIndex(p => p.id === this.editingProject.id);
        if (index !== -1) {
          this.projects[index].name = updatedProj.nombre;
          this.projects[index].rawClienteId = updatedProj.cliente_id;
          this.projects[index].rawPlataforma = updatedProj.plataforma;
          this.projects[index].rawNivelDiseno = updatedProj.nivel_diseno_objetivo;

          // If we had a real clients endpoint, we would update the client name here too.
          // For now, if they change the client_id, the name might not update until refresh.

          this.filterProjects();
        }
        this.isSubmitting = false;
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error al editar:', err);
        this.isSubmitting = false;
        this.dialogService.error('Ocurrió un error al guardar los cambios del proyecto.');
      }
    });
  }

  async deleteProject(project: Project, event: Event) {
    event.stopPropagation();
    const confirmed = await this.dialogService.confirm({
      title: '¿Eliminar proyecto?',
      message: `¿Estás seguro de eliminar permanentemente el proyecto "${project.name}"?\nEsta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      this.projectsService.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
          this.filterProjects();
          this.calculateKPIs(this.projects);
          this.dialogService.success(`El proyecto "${project.name}" fue eliminado correctamente.`);
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.dialogService.error('Ocurrió un error al intentar eliminar el proyecto.');
        }
      });
    }
  }

  // Create Project Modal Logic
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
        // Map and add to the top of the list
        const newProj = this.mapToProject(createdProject, this.projects.length);
        this.projects.unshift(newProj);
        this.filterProjects();
        this.calculateKPIs(this.projects);

        this.isSubmitting = false;
        this.closeCreateModal();
        this.dialogService.success(`Proyecto "${newProj.name}" creado con éxito.`);
      },
      error: (err) => {
        console.error('Error al crear proyecto:', err);
        this.isSubmitting = false;
        this.dialogService.error('Ocurrió un error al crear el proyecto.');
      }
    });
  }
}
