import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-investigation-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigation-resources.component.html',
  styleUrls: ['./investigation-resources.component.scss']
})
export class InvestigationResourcesComponent {
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.name.endsWith('.pdf') ? 'pdf' : 
                   (file.name.endsWith('.zip') ? 'zip' : 'image');
                   
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      this.recursos.push({
        name: file.name,
        size: sizeMB,
        type: type,
        file: file
      });
    }
    
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }

  removeFile(index: number) {
    this.recursos.splice(index, 1);
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }
}
