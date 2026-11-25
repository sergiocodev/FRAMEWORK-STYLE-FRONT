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

  @Output() next = new EventEmitter<void>();

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

  appendPrompt(field: 'problema' | 'objetivo' | 'producto', text: string) {
    if (field === 'problema') {
      const current = this.problema ? this.problema.trim() + ' ' : '';
      this.onProblemaChange(current + text);
    } else if (field === 'objetivo') {
      const current = this.objetivo ? this.objetivo.trim() + ' ' : '';
      this.onObjetivoChange(current + text);
    } else if (field === 'producto') {
      const current = this.producto ? this.producto.trim() + ' ' : '';
      this.onProductoChange(current + text);
    }
  }

  onNext() {
    this.next.emit();
  }
}
