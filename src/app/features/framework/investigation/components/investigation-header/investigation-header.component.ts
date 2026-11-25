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
  @Input() totalProgress: number = 0;
  @Input() completedSections: number = 0;
  @Input() totalSections: number = 4;
}
