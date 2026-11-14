import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WcagStandardComponent } from './components/wcag-standard/wcag-standard.component';

@Component({
  selector: 'app-diseno-visual-wcag',
  standalone: true,
  imports: [CommonModule, WcagStandardComponent],
  templateUrl: './diseno-visual-wcag.component.html',
  styleUrls: ['./diseno-visual-wcag.component.scss']
})
export class DisenoVisualWcagComponent {
  @Input({ required: true }) proyectoId!: number;
}
