import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-investigation-necessity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-necessity.component.html',
  styleUrls: ['./investigation-necessity.component.scss']
})
export class InvestigationNecessityComponent {
  @Input() necesidad: string = '';
  @Output() necesidadChange = new EventEmitter<string>();

  onNecesidadChange(value: string) {
    this.necesidad = value;
    this.necesidadChange.emit(this.necesidad);
  }
}
