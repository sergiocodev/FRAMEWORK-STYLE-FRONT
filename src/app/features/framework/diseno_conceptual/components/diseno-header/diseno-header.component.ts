import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase } from '../../../../../shared/components/stepper/stepper.component';
import { InvestigationPreviewComponent } from '../../../investigation/components/investigation-preview/investigation-preview.component';
import { InvestigationService } from '../../../../framework/services/investigation.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-diseno-header',
  standalone: true,
  imports: [CommonModule, InvestigationPreviewComponent],
  templateUrl: './diseno-header.component.html',
  styleUrls: ['./diseno-header.component.scss']
})
export class DisenoHeaderComponent {
  private investigationService = inject(InvestigationService);

  @Input() project: any;
  @Input() phases: Phase[] = [];
  @Output() openPropuesta = new EventEmitter<void>();

  showPhase1Preview: boolean = false;
  isLoadingPhase1: boolean = false;

  // Phase 1 Data properties
  phase1Data: any = {};

  openPhase1Preview() {
    this.showPhase1Preview = true;
    if (!this.phase1Data.informe && this.project?.id) {
      this.isLoadingPhase1 = true;
      forkJoin({
        informe: this.investigationService.getInforme(this.project.id).pipe(catchError(() => of({} as any))),
        arquetipos: this.investigationService.getArquetipos(this.project.id).pipe(catchError(() => of([]))),
        recursosList: this.investigationService.getRecursos(this.project.id).pipe(catchError(() => of([])))
      }).subscribe({
        next: (data) => {
          this.phase1Data = {
            ...data,
            arquetipos: (data.arquetipos || []).map((a: any) => ({
              name: a.nombre,
              role: a.etiqueta || 'General', 
              tag: a.etiqueta || 'General',
              photoUrl: a.avatar_url || 'https://i.pravatar.cc/150?img=11',
              needs: a.necesidades ? a.necesidades.map((n: any) => n.descripcion) : []
            })),
            recursosList: (data.recursosList || []).map((r: any) => {
              const type = r.nombre_original.endsWith('.pdf') ? 'pdf' : 
                           (r.nombre_original.endsWith('.zip') ? 'zip' : 'image');
              return {
                id: r.id,
                name: r.nombre_original,
                type: type,
                size: (r.tamano_bytes / 1024).toFixed(1) + ' KB',
                url: r.url
              };
            })
          };
          this.isLoadingPhase1 = false;
        },
        error: () => {
          this.isLoadingPhase1 = false;
        }
      });
    }
  }

  closePhase1Preview() {
    this.showPhase1Preview = false;
  }
}
