import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-investigation-expectations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-expectations.component.html',
  styleUrls: ['./investigation-expectations.component.scss']
})
export class InvestigationExpectationsComponent {
  @Input() expectativas: string = '';
  @Output() expectativasChange = new EventEmitter<string>();

  @Input() referencias: { url: string, notas: string }[] = [];
  @Output() referenciasChange = new EventEmitter<any[]>();

  @Input() analisisActual: string = '';
  @Output() analisisActualChange = new EventEmitter<string>();

  onExpectativasChange(value: string) {
    this.expectativas = value;
    this.expectativasChange.emit(this.expectativas);
  }

  onAnalisisActualChange(value: string) {
    this.analisisActual = value;
    this.analisisActualChange.emit(this.analisisActual);
  }

  addReferencia() {
    this.referencias.push({ url: '', notas: '' });
    this.emitReferenciasChange();
  }

  removeReferencia(index: number) {
    this.referencias.splice(index, 1);
    this.emitReferenciasChange();
  }

  onReferenciaChange() {
    this.emitReferenciasChange();
  }

  private emitReferenciasChange() {
    this.referencias = [...this.referencias];
    this.referenciasChange.emit(this.referencias);
  }
}
