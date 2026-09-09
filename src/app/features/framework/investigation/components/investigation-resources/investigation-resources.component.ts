import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-investigation-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investigation-resources.component.html',
  styleUrls: ['./investigation-resources.component.scss']
})
export class InvestigationResourcesComponent {
  @Input() recursos: any[] = [];
  @Output() recursosChange = new EventEmitter<any[]>();

  isDragging = false;

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
    // Para simplificar, añadimos la representación del archivo localmente.
    // Aquí es donde normalmente se subiría el archivo a la API (POST /recursos).
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.name.endsWith('.pdf') ? 'pdf' : 
                   (file.name.endsWith('.zip') ? 'zip' : 'image');
                   
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      this.recursos.push({
        name: file.name,
        size: sizeMB,
        type: type,
        file: file // Save reference if we want to upload it later
      });
    }
    
    // Emitir cambios
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }

  removeFile(index: number) {
    this.recursos.splice(index, 1);
    this.recursos = [...this.recursos];
    this.recursosChange.emit(this.recursos);
  }
}
