import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { DisenoConceptualChecklistItem } from '../../../../../models/diseno-conceptual.model';

@Component({
  selector: 'app-diseno-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diseno-checklist.component.html',
  styleUrls: ['./diseno-checklist.component.scss']
})
export class DisenoChecklistComponent implements OnInit {
  @Input() projectId!: number;
  private disenoService = inject(DisenoConceptualService);

  checklist: DisenoConceptualChecklistItem[] = [];

  ngOnInit() {
    if (this.projectId) {
      this.loadChecklist();
    }
  }

  loadChecklist() {
    this.disenoService.getProjectChecklist(this.projectId).subscribe({
      next: (data: DisenoConceptualChecklistItem[]) => this.checklist = data,
      error: (err: any) => console.error('Error cargando checklist', err)
    });
  }

  toggleCheck(item: DisenoConceptualChecklistItem, event: any) {
    const isChecked = event.target.checked;
    const newState = isChecked ? 'aceptado' : 'pendiente';
    if (item.id) {
      this.disenoService.updateProjectChecklistItem(this.projectId, item.id, { estado: newState }).subscribe({
        next: (updated: DisenoConceptualChecklistItem) => item.estado = updated.estado,
        error: (err: any) => {
          console.error('Error actualizando checklist', err);
          event.target.checked = !isChecked; // revert
        }
      });
    }
  }

  isRegenerating = false;

  regenerateChecklist() {
    if(confirm('¿Estás seguro de regenerar el checklist? Esto borrará tu progreso actual y generará uno nuevo basado en la Fase 1.')) {
      this.isRegenerating = true;
      this.disenoService.regenerateProjectChecklist(this.projectId).subscribe({
        next: (data) => {
          this.checklist = data;
          this.isRegenerating = false;
        },
        error: (err) => {
          console.error('Error regenerando checklist', err);
          this.isRegenerating = false;
        }
      });
    }
  }
}
