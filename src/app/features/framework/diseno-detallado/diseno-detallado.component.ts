import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DisenoDetalladoService, Fase4Pantalla, DisenoDetalladoArchivo } from '../services/diseno-detallado.service';
import { ProjectService } from '../../../core/services/project.service';
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
  selectedScreenId: string = '';

  checklists: ChecklistItem[] = [
    { id: 'c1', label: 'Colores aplicados correctamente', checked: false },
    { id: 'c2', label: 'Tipografías aplicadas correctamente', checked: false },
    { id: 'c3', label: 'Iconografía aplicada correctamente', checked: false },
    { id: 'c4', label: 'Espaciado y alineación correcta', checked: false }
  ];

  isSidebarOpen = true;
  isDragging = false;
  searchQuery: string = '';

  constructor(
    private disenoService: DisenoDetalladoService,
    private projectService: ProjectService,
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

  loadScreens() {
    this.disenoService.getScreens(this.projectId).subscribe({
      next: (data) => {
        // Map backend screens to frontend model
        this.screens = data.map(n => ({
          ...n,
          id: n.id.toString(), // frontend expects string id for UI tracking
          _dbId: n.id,
          title: n.nombre,
          icon: n.icono || 'file',
          status: 'Pendiente', // default until we load design
          lastUpdate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        }));
        if (this.screens.length > 0 && !this.selectedScreenId) {
          this.selectedScreenId = this.screens[0].id;
          this.loadDesignForScreen(this.screens[0]);
        } else if (this.currentScreen) {
           this.loadDesignForScreen(this.currentScreen);
        }
      },
      error: (err) => console.error('Error loading screens', err)
    });
  }

  // Se llama cuando el usuario hace clic en una pantalla
  selectScreen(id: string) {
    this.selectedScreenId = id;
    const screen = this.currentScreen;
    if (screen && !screen.image) {
      this.loadDesignForScreen(screen);
    }
  }

  loadDesignForScreen(screen: Fase4Pantalla) {
    this.disenoService.getDesign(this.projectId, screen._dbId).subscribe({
      next: (design) => {
        if (design && design.archivo_url) {
          screen.image = design.archivo_url;
          screen.status = design.estado === 'verificado' ? 'Verificada' : 'En revisión';
          
          if (design.alertas && design.alertas.length > 0) {
            screen.alerts = design.alertas.map(a => ({
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
        }
      },
      error: (err) => {
        // Normal if no design exists yet
        if (err.status !== 404) console.error('Error loading design', err);
      }
    });
  }

  get filteredScreens() {
    if (!this.searchQuery) return this.screens;
    const lower = this.searchQuery.toLowerCase();
    return this.screens.filter(s => s.title.toLowerCase().includes(lower));
  }

  get isAllChecked() {
    return this.checklists.every(c => c.checked);
  }

  toggleCheck(item: ChecklistItem) {
    item.checked = !item.checked;
    this.updateScreenStatus();
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

  addScreen() {
    const newName = 'Nueva pantalla';
    this.disenoService.createScreen(this.projectId, { nombre: newName, icono: 'file' }).subscribe({
      next: (n) => {
        const newScreen: Fase4Pantalla = {
          id: n.id.toString(),
          _dbId: n.id,
          proyecto_id: n.proyecto_id,
          fase_creacion: n.fase_creacion,
          title: n.nombre,
          status: 'Pendiente',
          lastUpdate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          icon: n.icono || 'file'
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
    
    // Todas las pantallas cargadas aquí son exclusivas de Fase 4, así que se pueden borrar sin afectar Fase 2.
    this.disenoService.deleteScreen(this.projectId, screen._dbId).subscribe({
      next: () => {
        this.screens = this.screens.filter(s => s.id !== id);
        if (this.selectedScreenId === id) {
           const first = this.screens.length > 0 ? this.screens[0] : null;
           if (first) this.selectScreen(first.id);
           else this.selectedScreenId = '';
        }
      },
      error: (err) => console.error('Error deleting screen', err)
    });
  }

  // --- File Upload Logic ---
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
    this.checklists.forEach(c => c.checked = false);

    // Guardar preview local rápido
    const reader = new FileReader();
    reader.onload = (e: any) => {
      screen.image = e.target.result;
    };
    reader.readAsDataURL(file);

    // Subir al backend
    this.disenoService.uploadDesign(this.projectId, screen._dbId, file).subscribe({
      next: (design) => {
        screen.isAnalyzing = false;
        screen.status = design.estado === 'verificado' ? 'Verificada' : 'En revisión';
        
        // Cargar alertas de la IA
        if (design.alertas && design.alertas.length > 0) {
          screen.alerts = design.alertas.map(a => ({
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
      },
      error: (err) => {
        screen.isAnalyzing = false;
        console.error('Error uploading design', err);
        alert('Ocurrió un error al analizar el diseño.');
      }
    });
  }

  clearImage() {
    const screen = this.currentScreen;
    if (screen) {
      this.disenoService.deleteDesign(this.projectId, screen._dbId).subscribe({
        next: () => {
          screen.image = undefined;
          screen.alerts = [];
          screen.status = 'Pendiente';
          this.checklists.forEach(c => c.checked = false);
        },
        error: (err) => console.error('Error clearing design', err)
      });
    }
  }

  completePhase(): void {
    if (!this.projectId) return;

    // Validación básica: Al menos una pantalla con diseño (imagen)
    const hasDesigns = this.screens.some(s => !!s.image);
    if (!hasDesigns) {
      alert('Por favor sube al menos el diseño detallado de una pantalla antes de continuar.');
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
        alert('Ocurrió un error al intentar avanzar de fase.');
      }
    });
  }
}
