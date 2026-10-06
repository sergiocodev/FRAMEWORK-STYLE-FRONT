import { environment } from '../../../../../../environments/environment';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { Wireframe, WireframeChecklistItem } from '../../../../../models/diseno-conceptual.model';
import { DisenoChecklistComponent } from '../../components/diseno-checklist/diseno-checklist.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-diseno-checklists-screen',
  standalone: true,
  imports: [CommonModule, DisenoChecklistComponent, FormsModule],
  templateUrl: './diseno-checklists-screen.component.html',
  styleUrls: ['./diseno-checklists-screen.component.scss']
})
export class DisenoChecklistsScreenComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private disenoService = inject(DisenoConceptualService);

  projectId!: number;
  wireframes: Wireframe[] = [];
  currentIndex = 0;
  
  wireframeChecklist: WireframeChecklistItem[] = [];
  newChecklistItem = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = Number(params.get('id'));
      if (this.projectId) {
        this.loadWireframes();
      }
    });
  }

  loadWireframes() {
    this.disenoService.getWireframes(this.projectId).subscribe({
      next: (data: Wireframe[]) => {
        this.wireframes = data.map((w: any) => {
          if (w.archivo_url) {
            w.base64Data = environment.apiUrl + w.archivo_url;
          }
          return w;
        });
        if (this.wireframes.length > 0) {
          this.loadChecklistForCurrent();
        }
      },
      error: (err: any) => {
        console.error('Error fetching wireframes:', err);
      }
    });
  }
  
  get currentWireframe() {
    return this.wireframes[this.currentIndex];
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadChecklistForCurrent();
    }
  }

  next() {
    if (this.currentIndex < this.wireframes.length - 1) {
      this.currentIndex++;
      this.loadChecklistForCurrent();
    }
  }

  goBack() {
    this.router.navigate(['/framework/projects', this.projectId, 'diseno_conceptual']);
  }

  // --- Wireframe Checklist Logic ---
  loadChecklistForCurrent() {
    if (!this.currentWireframe || !this.currentWireframe.id) {
      this.wireframeChecklist = [];
      return;
    }
    
    this.disenoService.getWireframeChecklist(this.projectId, this.currentWireframe.id).subscribe({
      next: (data) => this.wireframeChecklist = data,
      error: () => this.wireframeChecklist = []
    });
  }

  addChecklistItem() {
    if (!this.newChecklistItem.trim() || !this.currentWireframe?.id) return;
    
    const newItem: WireframeChecklistItem = {
      pregunta: this.newChecklistItem,
      estado: 'pendiente',
      origen: 'manual'
    };

    this.disenoService.createWireframeChecklistItem(this.projectId, this.currentWireframe.id, newItem).subscribe({
      next: (item) => {
        this.wireframeChecklist.push(item);
        this.newChecklistItem = '';
      },
      error: (err) => console.error(err)
    });
  }

  toggleCheckRow(item: WireframeChecklistItem) {
    const isChecked = item.estado === 'aceptado';
    const newEstado = isChecked ? 'pendiente' : 'aceptado';
    item.estado = newEstado;
    
    if (item.id && this.currentWireframe?.id) {
      this.disenoService.updateWireframeChecklistItem(this.projectId, this.currentWireframe.id, item.id, { estado: newEstado }).subscribe({
        error: () => item.estado = isChecked ? 'aceptado' : 'pendiente' // revert on error
      });
    }
  }

  toggleCheck(item: WireframeChecklistItem, event: any) {
    const isChecked = event.target.checked;
    item.estado = isChecked ? 'aceptado' : 'pendiente';
    
    if (item.id && this.currentWireframe?.id) {
      this.disenoService.updateWireframeChecklistItem(this.projectId, this.currentWireframe.id, item.id, { estado: item.estado }).subscribe({
        error: () => item.estado = isChecked ? 'pendiente' : 'aceptado' // revert on error
      });
    }
  }
}
