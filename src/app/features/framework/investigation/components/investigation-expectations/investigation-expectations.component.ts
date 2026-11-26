import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationService } from '../../../services/investigation.service';
import { DialogService } from '../../../../../core/services/dialog.service';
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
  private dialogService = inject(DialogService);

  @Input() projectId!: number;
  @Input() expectativas: string = '';
  @Output() expectativasChange = new EventEmitter<string>();

  @Input() referencias: { url: string, notas: string }[] = [];
  @Output() referenciasChange = new EventEmitter<any[]>();

  @Input() analisisActual: string = '';
  @Output() analisisActualChange = new EventEmitter<string>();

  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  isUploadingImage: boolean = false;

  onExpectativasChange(value: string) {
    this.expectativas = value;
    this.expectativasChange.emit(this.expectativas);
  }

  onAnalisisActualChange(value: string) {
    this.analisisActual = value;
    this.analisisActualChange.emit(this.analisisActual);
  }

  appendPrompt(field: 'expectativas' | 'analisisActual', text: string) {
    if (field === 'expectativas') {
      const current = this.expectativas ? this.expectativas.trim() + ' ' : '';
      this.onExpectativasChange(current + text);
    } else if (field === 'analisisActual') {
      const current = this.analisisActual ? this.analisisActual.trim() + ' ' : '';
      this.onAnalisisActualChange(current + text);
    }
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
      this.isUploadingImage = true;
      this.investigationService.uploadReferencia(this.projectId, file).subscribe({
        next: (response) => {
          this.referencias.push({ url: response.url, notas: 'Referencia visual subida' });
          this.emitReferenciasChange();
          this.isUploadingImage = false;
        },
        error: (err) => {
          console.error('Error uploading referencia', err);
          this.isUploadingImage = false;
          this.dialogService.error('Hubo un error al subir la imagen. Inténtalo nuevamente.');
        }
      });
    } else if (!this.projectId) {
      console.warn('Falta projectId, no se puede subir el archivo.');
    }
    
    if (event.target) {
      event.target.value = '';
    }
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.apiUrl}${url}`;
  }

  private emitReferenciasChange() {
    this.referencias = [...this.referencias];
    this.referenciasChange.emit(this.referencias);
  }

  onNext() {
    this.next.emit();
  }

  onPrev() {
    this.prev.emit();
  }
}
