import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase } from '../../../../../shared/components/stepper/stepper.component';


@Component({
  selector: 'app-diseno-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diseno-header.component.html',
  styleUrls: ['./diseno-header.component.scss']
})
export class DisenoHeaderComponent {
  @Input() project: any;
  @Input() phases: Phase[] = [];
}
