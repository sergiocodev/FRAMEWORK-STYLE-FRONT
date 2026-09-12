import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { Wireframe } from '../../../../../models/diseno-conceptual.model';

@Component({
  selector: 'app-diseno-wireframes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diseno-wireframes.component.html',
  styleUrls: ['./diseno-wireframes.component.scss']
})
export class DisenoWireframesComponent implements OnInit {
  @Input() projectId!: number;
  private disenoService = inject(DisenoConceptualService);
  
  wireframes: Wireframe[] = [];
  isDragging = false;

  ngOnInit() {
    if (this.projectId) {
      this.loadWireframes();
    }
  }

  loadWireframes() {
    const localData = localStorage.getItem(`mock_wireframes_${this.projectId}`);
    if (localData) {
      try {
        this.wireframes = JSON.parse(localData);
      } catch (e) {}
    }
    
    this.disenoService.getWireframes(this.projectId).subscribe({
      next: (data: Wireframe[]) => {
        const apiIds = new Set(data.map(w => w.id));
        const localOnly = this.wireframes.filter(w => !apiIds.has(w.id));
        this.wireframes = [...data, ...localOnly];
        this.saveWireframesLocal();
      },
      error: (err: any) => {
        console.error('Error cargando wireframes de backend', err);
      }
    });
  }

  saveWireframesLocal() {
    localStorage.setItem(`mock_wireframes_${this.projectId}`, JSON.stringify(this.wireframes));
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
    // Procesar cada archivo seleccionado
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // En una aplicación real, aquí subiríamos el archivo al backend
      // usando FormData a un endpoint como POST /api/archivos
      // y recibiríamos el archivo_id.
      
      // Simularemos la subida creando un wireframe con un archivo_id aleatorio
      const dummyArchivoId = Math.floor(Math.random() * 10000) + 1;
      
      const newWireframe: Wireframe = {
        archivo_id: dummyArchivoId,
        version: '1.0'
      };
      
      this.disenoService.createWireframe(this.projectId, newWireframe).subscribe({
        next: (res) => {
          this.wireframes.push(res);
          this.saveWireframesLocal();
        },
        error: (err) => {
          console.error('Error guardando wireframe en backend, usando fallback local', err);
          newWireframe.id = Math.floor(Math.random() * 100000);
          this.wireframes.push(newWireframe);
          this.saveWireframesLocal();
        }
      });
    }
  }

  deleteWireframe(id: number) {
    // Remove locally first for immediate UI feedback
    this.wireframes = this.wireframes.filter(w => w.id !== id);
    this.saveWireframesLocal();
    
    // Attempt backend delete
    this.disenoService.deleteWireframe(this.projectId, id).subscribe({
      next: () => {
        // Success
      },
      error: (err: any) => console.error('Error al eliminar wireframe en backend (puede ser local)', err)
    });
  }
}
