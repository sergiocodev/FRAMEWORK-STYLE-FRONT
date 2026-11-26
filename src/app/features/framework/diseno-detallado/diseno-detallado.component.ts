import { environment } from '../../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DisenoDetalladoService, Fase4Pantalla, DisenoDetalladoArchivo, WireframeDisponible } from '../services/diseno-detallado.service';
import { ProjectService } from '../../../core/services/project.service';
import { DialogService } from '../../../core/services/dialog.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface AiAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  detected: string;
  expected: string;
  element: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-diseno-detallado',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './diseno-detallado.component.html',
  styleUrls: ['./diseno-detallado.component.scss']
})
export class DisenoDetalladoComponent implements OnInit {

  projectId = 1;
  isCompleting = false;
  isSyncingPhase2 = false;
  isChangingWireframe = false;
  project: any = {};
  phases: any[] = [];
  headerBreadcrumbs: any[] = [];
  
  get formattedStatus(): string {
    const status = this.project?.status;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
  
  screens: Fase4Pantalla[] = [];
  availableWireframes: WireframeDisponible[] = [];
  selectedScreenId: string = '';
  selectedPriorityFilter: 'todas' | 'alta' | 'media' | 'baja' = 'todas';
  activeViewMode: 'prototype' | 'wireframe' | 'split' = 'prototype';
  selectedWireframeToLink: number | null = null;

  checklists: ChecklistItem[] = [];

  isSidebarOpen = true;
  isDragging = false;
  searchQuery: string = '';
  editingScreenId: string | null = null;
  editingTitle: string = '';

  constructor(
    private disenoService: DisenoDetalladoService,
    private projectService: ProjectService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = Number(idParam);
      }
      this.fetchProject(this.projectId);
      this.loadScreens();
      this.loadAvailableWireframes();
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

        const currentPhaseId = data.fase_actual_id || 4;
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

  loadAvailableWireframes() {
    this.disenoService.getAvailableWireframes(this.projectId).subscribe({
      next: (wfs) => {
        this.availableWireframes = wfs;
      },
      error: (err) => console.error('Error cargando wireframes disponibles', err)
    });
  }

  loadScreens() {
    this.disenoService.getScreens(this.projectId).subscribe({
      next: (data) => {
        this.screens = data.map(n => ({
          ...n,
          id: n.id.toString(),
          _dbId: n.id,
          title: n.nombre,
          icon: n.icono || 'layout',
          prioridad: (n.prioridad || 'media').toLowerCase() as 'alta' | 'media' | 'baja',
          status: n.estado_diseno === 'verificado' ? 'Verificada' : (n.estado_diseno === 'en_revision' ? 'En revisión' : 'Pendiente'),
          lastUpdate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          tieneWireframe: n.tiene_wireframe,
          wireframeUrl: n.wireframe_url ? (environment.apiUrl + (n.wireframe_url.startsWith('/') ? '' : '/') + n.wireframe_url) : undefined,
          wireframeId: n.wireframe_id,
          wireframeNombre: n.wireframe_nombre,
          tieneDiseno: n.tiene_diseno,
          image: n.diseno_url ? (environment.apiUrl + (n.diseno_url.startsWith('/') ? '' : '/') + n.diseno_url) : undefined,
          totalAlertas: n.total_alertas || 0,
          totalChecklists: n.total_checklists || 0,
          checklistsAprobados: n.checklists_aprobados || 0
        }));

        if (this.screens.length > 0) {
          const exists = this.screens.some(s => s.id === this.selectedScreenId);
          if (!exists) {
            this.selectedScreenId = this.screens[0].id;
          }
          const current = this.currentScreen;
          if (current) {
            this.loadDesignForScreen(current);
          }
        } else {
          this.selectedScreenId = '';
          this.checklists = [];
        }
      },
      error: (err) => console.error('Error loading screens', err)
    });
  }

  selectScreen(id: string) {
    this.selectedScreenId = id;
    this.isChangingWireframe = false;
    this.selectedWireframeToLink = null;
    const screen = this.currentScreen;
    if (screen) {
      this.loadDesignForScreen(screen);
    }
  }

  loadDesignForScreen(screen: Fase4Pantalla) {
    this.checklists = [];

    if (!screen.tieneDiseno && !screen.image) {
      screen.image = undefined;
      screen.alerts = [];
      return;
    }

    this.disenoService.getDesign(this.projectId, screen._dbId).subscribe({
      next: (design) => {
        if (design && design.archivo_url) {
          screen.image = environment.apiUrl + (design.archivo_url.startsWith('/') ? '' : '/') + design.archivo_url;
          screen.status = design.estado === 'verificado' ? 'Verificada' : 'En revisión';
          
          if (design.alertas && design.alertas.length > 0) {
            screen.alerts = design.alertas.map((a: any) => ({
              id: a.id.toString(),
              type: a.tipo as 'error' | 'warning' | 'info',
              element: a.elemento,
              message: a.mensaje,
              detected: a.detectado,
              expected: a.esperado
            }));
          } else {
            screen.alerts = [];
          }
          
          if (design.checklist && design.checklist.length > 0) {
            this.checklists = design.checklist.map((c: any) => ({
              id: c.id.toString(),
              label: c.pregunta,
              checked: c.estado === 'aprobado' || c.estado === 'aceptado'
            }));
          }
        }
      },
      error: (err) => {
        this.checklists = [];
        if (err.status !== 404) console.error('Error loading design', err);
      }
    });
  }

  syncScreensFromPhase2() {
    this.isSyncingPhase2 = true;
    this.disenoService.syncFromPhase2(this.projectId).subscribe({
      next: () => {
        this.isSyncingPhase2 = false;
        this.loadScreens();
        this.loadAvailableWireframes();
      },
      error: (err) => {
        this.isSyncingPhase2 = false;
        console.error('Error al sincronizar con Fase 2', err);
      }
    });
  }

  startChangingWireframe() {
    this.isChangingWireframe = true;
    this.selectedWireframeToLink = this.currentScreen?.wireframeId || null;
  }

  cancelChangingWireframe() {
    this.isChangingWireframe = false;
    this.selectedWireframeToLink = null;
  }

  linkCurrentScreenToWireframe() {
    const screen = this.currentScreen;
    if (!screen || !this.selectedWireframeToLink) return;

    this.disenoService.linkWireframe(this.projectId, screen._dbId, this.selectedWireframeToLink).subscribe({
      next: (res) => {
        screen.tieneWireframe = true;
        screen.wireframeUrl = environment.apiUrl + (res.wireframe_url.startsWith('/') ? '' : '/') + res.wireframe_url;
        screen.wireframeId = res.wireframe_id;
        screen.wireframeNombre = res.nombre_archivo;
        this.isChangingWireframe = false;
        this.selectedWireframeToLink = null;
        this.loadAvailableWireframes();
      },
      error: (err) => console.error('Error al vincular wireframe', err)
    });
  }

  async unlinkCurrentScreenWireframe() {
    const screen = this.currentScreen;
    if (!screen) return;

    const confirmed = await this.dialogService.confirm({
      title: '¿Desvincular wireframe?',
      message: `¿Estás seguro de desvincular el wireframe de la pantalla "${screen.title}"?`,
      confirmText: 'Sí, desvincular',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    if (!confirmed) return;

    this.disenoService.unlinkWireframe(this.projectId, screen._dbId).subscribe({
      next: () => {
        screen.tieneWireframe = false;
        screen.wireframeUrl = undefined;
        screen.wireframeId = undefined;
        screen.wireframeNombre = undefined;
        this.isChangingWireframe = false;
        this.selectedWireframeToLink = null;
        this.loadAvailableWireframes();
      },
      error: (err) => console.error('Error al desvincular wireframe', err)
    });
  }

  getColorFromLabel(label: string): string | null {
    const match = label.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
    return match ? match[0] : null;
  }

  get filteredScreens(): Fase4Pantalla[] {
    let list = this.screens;
    if (this.selectedPriorityFilter !== 'todas') {
      list = list.filter(s => s.prioridad === this.selectedPriorityFilter);
    }
    if (this.searchQuery) {
      const lower = this.searchQuery.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(lower));
    }
    return list;
  }

  get isAllChecked(): boolean {
    return this.checklists.length > 0 && this.checklists.every(c => c.checked);
  }

  get checklistStats(): { completed: number, total: number, percent: number } {
    const total = this.checklists.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = this.checklists.filter(c => c.checked).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  get highPriorityCount(): number {
    return this.screens.filter(s => s.prioridad === 'alta').length;
  }

  get mediumPriorityCount(): number {
    return this.screens.filter(s => s.prioridad === 'media').length;
  }

  get lowPriorityCount(): number {
    return this.screens.filter(s => s.prioridad === 'baja').length;
  }

  get verifiedScreensCount(): number {
    return this.screens.filter(s => s.status === 'Verificada').length;
  }

  get prototypedScreensCount(): number {
    return this.screens.filter(s => !!s.image).length;
  }

  toggleCheck(item: ChecklistItem) {
    const screen = this.currentScreen;
    if (!screen) return;

    const previousChecked = item.checked;
    const nextChecked = !previousChecked;
    item.checked = nextChecked;

    const estadoBackend = nextChecked ? 'aprobado' : 'rechazado';
    const itemIdNum = Number(item.id);

    if (!isNaN(itemIdNum) && itemIdNum > 0) {
      this.disenoService.updateChecklistItem(this.projectId, screen._dbId, itemIdNum, estadoBackend).subscribe({
        next: (res) => {
          screen.status = res.diseno_estado === 'verificado' ? 'Verificada' : 'En revisión';
        },
        error: (err) => {
          console.error('Error al guardar estado de validación:', err);
          item.checked = previousChecked;
        }
      });
    } else {
      this.updateScreenStatus();
    }
  }
  
  get currentScreen(): Fase4Pantalla | undefined {
    return this.screens.find(s => s.id === this.selectedScreenId);
  }

  updateScreenStatus() {
    const screen = this.currentScreen;
    if (screen && screen.status !== 'Verificada') {
      if (this.isAllChecked) {
        screen.status = 'Verificada';
      } else {
        screen.status = 'En revisión';
      }
    }
  }

  toggleMarkVerified() {
    const screen = this.currentScreen;
    if (!screen || !screen.image) return;

    const targetEstado = screen.status === 'Verificada' ? 'en_revision' : 'verificado';
    this.disenoService.updateDesignStatus(this.projectId, screen._dbId, targetEstado).subscribe({
      next: (res) => {
        screen.status = res.estado === 'verificado' ? 'Verificada' : 'En revisión';
        if (screen.status === 'Verificada') {
          this.checklists.forEach(c => c.checked = true);
        }
      },
      error: (err) => console.error('Error cambiando estado de diseño:', err)
    });
  }

  setViewMode(mode: 'prototype' | 'wireframe' | 'split') {
    this.activeViewMode = mode;
  }

  addScreen() {
    const newName = 'Nueva pantalla';
    this.disenoService.createScreen(this.projectId, { nombre: newName, icono: 'file', prioridad: 'alta' }).subscribe({
      next: (n) => {
        const newScreen: Fase4Pantalla = {
          id: n.id.toString(),
          _dbId: n.id,
          proyecto_id: n.proyecto_id,
          fase_creacion: n.fase_creacion,
          title: n.nombre,
          prioridad: 'alta',
          status: 'Pendiente',
          lastUpdate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          icon: n.icono || 'file',
          tieneWireframe: false,
          tieneDiseno: false
        };
        this.screens.push(newScreen);
        this.selectScreen(newScreen.id);
      },
      error: (err) => console.error('Error creating screen', err)
    });
  }

  deleteScreen(id: string, event: Event) {
    event.stopPropagation();
    const screen = this.screens.find(s => s.id === id);
    if (!screen) return;
    
    this.disenoService.deleteScreen(this.projectId, screen._dbId).subscribe({
      next: () => {
        this.screens = this.screens.filter(s => s.id !== id);
        if (this.selectedScreenId === id) {
           const first = this.screens.length > 0 ? this.screens[0] : null;
           if (first) this.selectScreen(first.id);
           else this.selectedScreenId = '';
        }
        this.loadAvailableWireframes();
      },
      error: (err) => console.error('Error deleting screen', err)
    });
  }

  startEditing(screen: Fase4Pantalla, event: Event) {
    event.stopPropagation();
    this.editingScreenId = screen.id;
    this.editingTitle = screen.title;
  }

  cancelEdit(event: Event) {
    event.stopPropagation();
    this.editingScreenId = null;
    this.editingTitle = '';
  }

  saveEdit(screen: Fase4Pantalla, event: Event) {
    event.stopPropagation();
    if (!this.editingTitle || this.editingTitle.trim() === '') {
      this.cancelEdit(event);
      return;
    }
    
    if (this.editingTitle !== screen.title) {
      const newTitle = this.editingTitle.trim();
      this.disenoService.updateScreen(this.projectId, screen._dbId, { nombre: newTitle }).subscribe({
        next: () => {
          screen.title = newTitle;
          this.editingScreenId = null;
        },
        error: (err) => console.error('Error updating screen title', err)
      });
    } else {
      this.editingScreenId = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFiles(event.target.files);
    }
  }

  private handleFiles(files: FileList) {
    const file = files[0];
    const screen = this.currentScreen;
    if (!file || !screen) return;

    screen.isAnalyzing = true;
    screen.alerts = [];
    this.checklists = [];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      screen.image = e.target.result;
    };
    reader.readAsDataURL(file);

    this.disenoService.uploadDesign(this.projectId, screen._dbId, file).subscribe({
      next: (design) => {
        screen.isAnalyzing = false;
        screen.tieneDiseno = true;
        screen.status = design.estado === 'verificado' ? 'Verificada' : 'En revisión';
        
        if (design.alertas && design.alertas.length > 0) {
          screen.alerts = design.alertas.map((a: any) => ({
            id: a.id.toString(),
            type: a.tipo as 'error' | 'warning' | 'info',
            element: a.elemento,
            message: a.mensaje,
            detected: a.detectado,
            expected: a.esperado
          }));
        } else {
           screen.alerts = [];
        }
        
        if (design.checklist && design.checklist.length > 0) {
          this.checklists = design.checklist.map((c: any) => ({
            id: c.id.toString(),
            label: c.pregunta,
            checked: c.estado === 'aprobado' || c.estado === 'aceptado'
          }));
        }
      },
      error: (err) => {
        screen.isAnalyzing = false;
        console.error('Error uploading design', err);
        this.dialogService.error('Ocurrió un error al analizar el diseño.');
      }
    });
  }

  clearImage() {
    const screen = this.currentScreen;
    if (screen) {
      this.disenoService.deleteDesign(this.projectId, screen._dbId).subscribe({
        next: () => {
          screen.image = undefined;
          screen.tieneDiseno = false;
          screen.alerts = [];
          screen.status = 'Pendiente';
          this.checklists = [];
        },
        error: (err) => console.error('Error clearing design', err)
      });
    }
  }

  completePhase(): void {
    if (!this.projectId) return;

    const hasDesigns = this.screens.some(s => !!s.image || s.tieneDiseno);
    if (!hasDesigns) {
      this.dialogService.warning(
        'Por favor sube al menos el diseño detallado de una pantalla antes de continuar a la evaluación.',
        'Diseño Requerido'
      );
      return;
    }

    this.isCompleting = true;
    this.projectService.updateProject(this.projectId, { fase_actual_id: 5 }).subscribe({
      next: () => {
        this.isCompleting = false;
        this.router.navigate(['/framework/projects', this.projectId, 'evaluacion']);
      },
      error: (err) => {
        console.error('Error al avanzar fase', err);
        this.isCompleting = false;
        this.dialogService.error('Ocurrió un error al intentar avanzar de fase.');
      }
    });
  }
}
