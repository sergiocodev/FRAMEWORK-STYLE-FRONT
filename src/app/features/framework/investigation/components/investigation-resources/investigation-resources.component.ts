import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationService } from '../../../services/investigation.service';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-investigation-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-resources.component.html',
  styleUrls: ['./investigation-resources.component.scss']
})
export class InvestigationResourcesComponent {
  private investigationService = inject(InvestigationService);
  private dialogService = inject(DialogService);

  @Input() projectId!: number;
  @Input() recursos: any[] = [];
  @Output() recursosChange = new EventEmitter<any[]>();

  @Input() restricciones: string = '';
  @Output() restriccionesChange = new EventEmitter<string>();

  @Input() identidadMarca: { tieneManual: boolean, colores: string, notas: string } = { tieneManual: false, colores: '', notas: '' };
  @Output() identidadMarcaChange = new EventEmitter<any>();

  @Output() prev = new EventEmitter<void>();
  @Output() openPreview = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();

  isDragging = false;
  isUploading = false;

  onRestriccionesChange(value: string) {
    this.restricciones = value;
    this.restriccionesChange.emit(this.restricciones);
  }

  appendPrompt(text: string) {
    const current = this.restricciones ? this.restricciones.trim() + ' ' : '';
    this.onRestriccionesChange(current + text);
  }

  onIdentidadMarcaChange() {
    this.identidadMarca = { ...this.identidadMarca };
    this.identidadMarcaChange.emit(this.identidadMarca);
  }

  // Parse color hex codes to show live color chips
  get colorSwatches(): string[] {
    if (!this.identidadMarca?.colores) return [];
    const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
    const matches = this.identidadMarca.colores.match(hexRegex);
    return matches ? Array.from(new Set(matches)) : [];
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFiles(event.target.files);
    }
  }

  private handleFiles(files: FileList) {
    if (!this.projectId) {
      console.warn('No projectId provided, cannot upload files.');
      return;
    }

    this.isUploading = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.name.endsWith('.pdf') ? 'pdf' : 
                   (file.name.endsWith('.zip') ? 'zip' : 'image');
                   
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      const newRecurso = {
        name: file.name,
        size: sizeMB,
        type: type,
        file: file,
        id: null
      };
      
      this.recursos.push(newRecurso);
      this.emitRecursosChange();

      this.investigationService.uploadRecurso(this.projectId, file).subscribe({
        next: (response: any) => {
          newRecurso.id = response.id;
          this.emitRecursosChange();
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Error uploading recurso:', err);
          this.recursos = this.recursos.filter(r => r !== newRecurso);
          this.emitRecursosChange();
          this.isUploading = false;
          this.dialogService.error('Hubo un error al subir el archivo: ' + file.name);
        }
      });
    }
  }

  async removeFile(index: number) {
    const fileToRemove = this.recursos[index];
    const confirmed = await this.dialogService.confirm({
      title: '¿Eliminar archivo?',
      message: `¿Estás seguro de eliminar el archivo "${fileToRemove.nombre || fileToRemove.name || 'seleccionado'}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;
    
    if (fileToRemove.id && this.projectId) {
      this.investigationService.deleteRecurso(this.projectId, fileToRemove.id).subscribe({
        next: () => {
          this.recursos.splice(index, 1);
          this.emitRecursosChange();
          this.dialogService.success('Archivo eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error deleting recurso:', err);
          this.dialogService.error('No se pudo eliminar el archivo del servidor.');
        }
      });
    } else {
      this.recursos.splice(index, 1);
      this.emitRecursosChange();
    }
  }

  private emitRecursosChange() {
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }

  onPrev() {
    this.prev.emit();
  }

  onOpenPreview() {
    this.openPreview.emit();
  }

  onComplete() {
    this.complete.emit();
  }
}
