import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Phase {
  number: number;
  name: string;
  subtext: string;
  status: 'completed' | 'active' | 'upcoming';
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent {
  @Input() phases: Phase[] = [];
}
