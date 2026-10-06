import { environment } from '../../../../../../environments/environment';
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { Wireframe } from '../../../../../models/diseno-conceptual.model';

import { Router } from '@angular/router';

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
  private router = inject(Router);
  
  wireframes: Wireframe[] = [];
  isDragging = false;

  ngOnInit() {
    if (this.projectId) {
      this.loadWireframes();
    }
  }

  scrollToChecklists() {
    this.router.navigate(['/framework/projects', this.projectId, 'diseno_conceptual', 'checklists']);
  }

  loadWireframes() {
    this.disenoService.getWireframes(this.projectId).subscribe({
      next: (data: Wireframe[]) => {
        this.wireframes = data.map(w => {
          // Now we use the real URL from backend!
          if (w.archivo_url) {
            
             
            // If backend is on 8000, we should prepend the backend URL. The DisenoConceptualService has apiUrl. We can just use environment.apiUrl.
            
            w.base64Data = w.archivo_url;
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

  showErrorModal = false;
  errorMessage = '';

  closeErrorModal() {
    this.showErrorModal = false;
  }

  private handleFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      this.disenoService.createWireframe(this.projectId, file as any).subscribe({
        next: (res: any) => {
          if (res.archivo_url) res.base64Data = environment.apiUrl + res.archivo_url;
          this.wireframes.push(res);
        },
        error: (err: any) => console.error('Error guardando wireframe en backend', err)
      });
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
