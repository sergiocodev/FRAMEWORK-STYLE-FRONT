import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationService } from '../../../services/investigation.service';

@Component({
  selector: 'app-investigation-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-resources.component.html',
  styleUrls: ['./investigation-resources.component.scss']
})
export class InvestigationResourcesComponent {
  private investigationService = inject(InvestigationService);

  @Input() projectId!: number;
  @Input() recursos: any[] = [];
  @Output() recursosChange = new EventEmitter<any[]>();

  @Input() restricciones: string = '';
  @Output() restriccionesChange = new EventEmitter<string>();

  @Input() identidadMarca: { tieneManual: boolean, colores: string, notas: string } = { tieneManual: false, colores: '', notas: '' };
  @Output() identidadMarcaChange = new EventEmitter<any>();

  isDragging = false;

  onRestriccionesChange(value: string) {
    this.restricciones = value;
    this.restriccionesChange.emit(this.restricciones);
  }

  onIdentidadMarcaChange() {
    // Create new reference to trigger change detection
    this.identidadMarca = { ...this.identidadMarca };
    this.identidadMarcaChange.emit(this.identidadMarca);
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.name.endsWith('.pdf') ? 'pdf' : 
                   (file.name.endsWith('.zip') ? 'zip' : 'image');
                   
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      // Añadimos el archivo temporalmente (podríamos ponerle un estado de 'cargando')
      const newRecurso = {
        name: file.name,
        size: sizeMB,
        type: type,
        file: file,
        id: null // Se llenará cuando responda el backend
      };
      
      this.recursos.push(newRecurso);
      this.emitRecursosChange();

      // Subimos físicamente
      this.investigationService.uploadRecurso(this.projectId, file).subscribe({
        next: (response: any) => {
          newRecurso.id = response.id; // Guardamos el ID real de la base de datos
          this.emitRecursosChange();
        },
        error: (err) => {
          console.error('Error uploading recurso:', err);
          // Opcional: removerlo si falla
          this.recursos = this.recursos.filter(r => r !== newRecurso);
          this.emitRecursosChange();
          alert('Hubo un error al subir el archivo: ' + file.name);
        }
      });
    }
  }

  removeFile(index: number) {
    const fileToRemove = this.recursos[index];
    
    // Si tiene un ID real, lo eliminamos del backend
    if (fileToRemove.id && this.projectId) {
      this.investigationService.deleteRecurso(this.projectId, fileToRemove.id).subscribe({
        next: () => {
          this.recursos.splice(index, 1);
          this.emitRecursosChange();
        },
        error: (err) => {
          console.error('Error deleting recurso:', err);
          alert('No se pudo eliminar el archivo del servidor.');
        }
      });
    } else {
      // Si no tiene ID (aún no ha subido o hubo error), solo lo removemos localmente
      this.recursos.splice(index, 1);
      this.emitRecursosChange();
    }
  }

  private emitRecursosChange() {
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }
}
