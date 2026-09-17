import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase } from '../../../../../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-investigation-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investigation-header.component.html',
  styleUrls: ['./investigation-header.component.scss']
})
export class InvestigationHeaderComponent {
  @Input() project: any;
  @Input() phases: Phase[] = [];
  @Input() isSaving: boolean = false;
  @Input() saveSuccess: boolean = false;

  get formattedStatus(): string {
    const status = this.project?.status || this.project?.estado;
    if (!status) return 'En progreso';
    
    // Replace underscores with spaces and capitalize first letter
    const formatted = status.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
}
