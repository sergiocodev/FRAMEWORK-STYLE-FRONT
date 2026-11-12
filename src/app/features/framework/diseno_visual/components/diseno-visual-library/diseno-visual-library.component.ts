import { Component, OnInit, inject, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisenoVisualService } from '../../services/diseno-visual.service';
import { InvestigationService } from '../../../services/investigation.service';
import { DisenoVisualColorsComponent } from './components/diseno-visual-colors/diseno-visual-colors.component';
import { DisenoVisualTypographyComponent } from './components/diseno-visual-typography/diseno-visual-typography.component';
import { DisenoVisualWcagComponent } from './components/diseno-visual-wcag/diseno-visual-wcag.component';
import { DisenoVisualIconsComponent } from './components/diseno-visual-icons/diseno-visual-icons.component';
import { DisenoVisualLayoutComponent } from './components/diseno-visual-layout/diseno-visual-layout.component';

export type SystemTab = 'colors' | 'typography' | 'wcag' | 'icons' | 'layout';

export interface FlowStep {
  id: SystemTab;
  stepNumber: number;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-diseno-visual-library',
  standalone: true,
  imports: [
    CommonModule,
    DisenoVisualColorsComponent,
    DisenoVisualTypographyComponent,
    DisenoVisualWcagComponent,
    DisenoVisualIconsComponent,
    DisenoVisualLayoutComponent
  ],
  templateUrl: './diseno-visual-library.component.html',
  styleUrls: ['./diseno-visual-library.component.scss']
})
export class DisenoVisualLibraryComponent implements OnInit {
  @Input({ required: true }) proyectoId!: number;

  private disenoVisualService = inject(DisenoVisualService);
  private investigationService = inject(InvestigationService);

  identidadMarca: any = null;
  activeTab: SystemTab = 'colors';

  // Flujo obligatorio secuencial (5 pasos: 1. Color, 2. Tipografía, 3. Contraste, 4. Iconografía, 5. Espaciado y Layout)
  steps: FlowStep[] = [
    {
      id: 'colors',
      stepNumber: 1,
      label: 'Color',
      icon: 'bi-palette-fill',
      description: 'Paleta cromática y roles'
    },
    {
      id: 'typography',
      stepNumber: 2,
      label: 'Tipografía',
      icon: 'bi-fonts',
      description: 'Jerarquía y Fuentes'
    },
    {
      id: 'wcag',
      stepNumber: 3,
      label: 'Contraste',
      icon: 'bi-circle-half',
      description: 'Matriz WCAG y Accesibilidad'
    },
    {
      id: 'icons',
      stepNumber: 4,
      label: 'Iconografía',
      icon: 'bi-app-indicator',
      description: 'Librerías y SVG'
    },
    {
      id: 'layout',
      stepNumber: 5,
      label: 'Espaciado y Layout',
      icon: 'bi-distribute-horizontal',
      description: 'Grilla de 8pt y Formas'
    }
  ];

  // Seguimiento de pasos completados manualmente o por datos existentes
  completedSteps = signal<Record<SystemTab, boolean>>({
    colors: false,
    typography: false,
    wcag: false,
    icons: false,
    layout: false
  });

  // Verificaciones reactivas de compleción por datos del servicio
  isStepCompleted(tab: SystemTab): boolean {
    if (this.completedSteps()[tab]) return true;

    // Validación automática según datos existentes
    switch (tab) {
      case 'colors':
        return (this.disenoVisualService.colores() || []).length > 0;
      case 'typography':
        return (this.disenoVisualService.tipografias() || []).length > 0;
      case 'wcag':
        return this.completedSteps()['wcag'] || (this.disenoVisualService.colores() || []).length >= 2;
      case 'icons':
        return !!this.disenoVisualService.config()?.libreria_iconos;
      case 'layout':
        return !!this.disenoVisualService.config()?.escala_espaciado_base;
      default:
        return false;
    }
  }

  get currentStepIndex(): number {
  return this.steps.findIndex((s) => s.id === this.activeTab);
}

  get currentStep(): FlowStep {
  return this.steps[this.currentStepIndex] || this.steps[0];
}

  get nextStep(): FlowStep | null {
  const nextIdx = this.currentStepIndex + 1;
  return nextIdx < this.steps.length ? this.steps[nextIdx] : null;
}

  get previousStep(): FlowStep | null {
  const prevIdx = this.currentStepIndex - 1;
  return prevIdx >= 0 ? this.steps[prevIdx] : null;
}

  get completedStepsCount(): number {
  return this.steps.filter((s) => this.isStepCompleted(s.id)).length;
}

  get progressPercentage(): number {
  return Math.round((this.completedStepsCount / this.steps.length) * 100);
}

ngOnInit(): void {
  this.cargarDatos();
}

cargarDatos(): void {
  if(this.proyectoId) {
  this.disenoVisualService.cargarDisenoVisualCompleto(this.proyectoId).subscribe();
  this.investigationService.getInforme(this.proyectoId).subscribe({
    next: (informe: any) => {
      if (informe && informe.identidad_marca) {
        this.identidadMarca = informe.identidad_marca;
      }
    }
  });
}
  }

setTab(tab: SystemTab): void {
  this.activeTab = tab;
}

goToNextStep(): void {
  // Marcar el paso actual como completado
  this.completedSteps.update((curr) => ({
    ...curr,
    [this.activeTab]: true
  }));

  if(this.nextStep) {
  this.activeTab = this.nextStep.id;
  // Scroll suave hacia arriba
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  }

goToPreviousStep(): void {
  if(this.previousStep) {
  this.activeTab = this.previousStep.id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  }

markFlowCompleted(): void {
  this.completedSteps.update((curr) => ({
    ...curr,
    layout: true
  }));
}
}
