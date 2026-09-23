import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationService } from '../../../services/investigation.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-investigation-expectations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-expectations.component.html',
  styleUrls: ['./investigation-expectations.component.scss']
})
export class InvestigationExpectationsComponent {
  private investigationService = inject(InvestigationService);

  @Input() projectId!: number;
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.projectId) {
      // Optimizacion: subimos la imagen fisicamente y guardamos solo la URL en el JSON
      this.investigationService.uploadReferencia(this.projectId, file).subscribe({
        next: (response) => {
          this.referencias.push({ url: response.url, notas: '' });
          this.emitReferenciasChange();
        },
        error: (err) => {
          console.error('Error uploading referencia', err);
          alert('Hubo un error al subir la imagen. Inténtalo nuevamente.');
        }
      });
    } else if (!this.projectId) {
      console.warn('Falta projectId, no se puede subir el archivo.');
    }
    
    // Reset input so the same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    // Si la URL ya es absoluta (http, https, data:image), la retornamos tal cual
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    // Si es una ruta relativa del backend, le agregamos el apiUrl
    return `${environment.apiUrl}${url}`;
  }

  private emitReferenciasChange() {
    this.referencias = [...this.referencias];
    this.referenciasChange.emit(this.referencias);
  }
}
