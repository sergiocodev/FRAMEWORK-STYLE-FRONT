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
    this.disenoService.getWireframes(this.projectId).subscribe({
      next: (data: Wireframe[]) => {
        this.wireframes = data.map(w => {
          const cacheStr = localStorage.getItem(`wf_cache_${w.id}`);
          if (cacheStr) {
            try {
              const cache = JSON.parse(cacheStr);
              w.base64Data = cache.base64Data;
              w.fileName = cache.fileName;
            } catch(e) {}
          }
          return w;
        });
      },
      error: (err: any) => {
        console.error('Error cargando wireframes de backend', err);
      }
    });
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
    // Clear input so the same file can be selected again
    event.target.value = '';
  }

  private handleFiles(files: FileList) {
    // Procesar cada archivo seleccionado
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar que solo sea imagen
      if (!file.type.startsWith('image/')) {
        alert(`El archivo "${file.name}" no es una imagen y ha sido ignorado.`);
        continue;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        // Here we'd ideally upload the file first and get an archivo_id
        // For now, we mock the archivo_id as 1 to satisfy the backend
        const dummyArchivoId = 1;
        
        const newWireframe: Wireframe = {
          archivo_id: dummyArchivoId,
          version: '1.0',
          fileName: file.name,
          base64Data: e.target.result
        };
        
        this.disenoService.createWireframe(this.projectId, newWireframe).subscribe({
          next: (res) => {
            // Keep base64 locally to show the image if backend doesn't store it yet
            res.base64Data = newWireframe.base64Data;
            res.fileName = newWireframe.fileName;
            this.wireframes.push(res);
            
            // Guardar en cache temporal para la pantalla de validación
            const cacheKey = `wf_cache_${res.id}`;
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                base64Data: res.base64Data,
                fileName: res.fileName
              }));
            } catch(e) { console.error('Cache limit exceeded'); }
          },
          error: (err) => {
            console.error('Error guardando wireframe en backend', err);
          }
        });
      };
      
      reader.readAsDataURL(file);
    }
  }

  deleteWireframe(id: number) {
    this.disenoService.deleteWireframe(this.projectId, id).subscribe({
      next: () => {
        this.wireframes = this.wireframes.filter(w => w.id !== id);
      },
      error: (err: any) => console.error('Error al eliminar wireframe', err)
    });
  }
}
