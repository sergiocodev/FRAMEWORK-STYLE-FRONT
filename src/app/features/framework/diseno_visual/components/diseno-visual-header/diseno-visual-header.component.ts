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

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    
    // Replace underscores with spaces and capitalize first letter
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
}
