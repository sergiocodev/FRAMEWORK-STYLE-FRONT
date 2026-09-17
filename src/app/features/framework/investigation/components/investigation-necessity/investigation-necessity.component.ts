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
  @Input() problema: string = '';
  @Output() problemaChange = new EventEmitter<string>();

  @Input() objetivo: string = '';
  @Output() objetivoChange = new EventEmitter<string>();

  @Input() producto: string = '';
  @Output() productoChange = new EventEmitter<string>();

  onProblemaChange(value: string) {
    this.problema = value;
    this.problemaChange.emit(this.problema);
  }

  onObjetivoChange(value: string) {
    this.objetivo = value;
    this.objetivoChange.emit(this.objetivo);
  }

  onProductoChange(value: string) {
    this.producto = value;
    this.productoChange.emit(this.producto);
  }
}
