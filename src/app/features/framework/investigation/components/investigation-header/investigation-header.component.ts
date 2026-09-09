import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperComponent, Phase } from '../../../../../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-investigation-header',
  standalone: true,
  imports: [CommonModule, StepperComponent],
  templateUrl: './investigation-header.component.html',
  styleUrls: ['./investigation-header.component.scss']
})
export class InvestigationHeaderComponent {
  @Input() project: any;
  @Input() phases: Phase[] = [];
}
