import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Phase {
  name: string;
  status: 'completed' | 'active' | 'upcoming';
  number?: number;
  subtext?: string;
}

@Component({
  selector: 'app-diseno-visual-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diseno-visual-header.component.html',
  styleUrls: ['./diseno-visual-header.component.scss']
})
export class DisenoVisualHeaderComponent {
  @Input() project: any;
  @Input() phases: Phase[] = [];
  @Input() totalProgress: number = 0;
  @Input() completedSystems: number = 0;
  @Input() totalSystems: number = 5;

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
}
