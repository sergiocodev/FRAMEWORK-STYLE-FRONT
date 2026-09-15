import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { NodoPantalla } from '../../../../../models/diseno-conceptual.model';

@Component({
  selector: 'app-diseno-inventory',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './diseno-inventory.component.html',
  styleUrls: ['./diseno-inventory.component.scss']
})
export class DisenoInventoryComponent implements OnInit, OnDestroy {
  @Input() projectId!: number;
  private disenoService = inject(DisenoConceptualService);
  
  nodos: NodoPantalla[] = [];
  
  searchTerm = '';
  priorityFilter: 'todos' | 'alta' | 'media' | 'baja' = 'todos';
  activeTab: 'estructura' | 'imagenes' | 'otros' | 'todos' = 'estructura';

  private pollSub!: Subscription;

  ngOnInit() {
    if (this.projectId) {
      this.loadNodos();
      // Poll every 1 second for faster updates
      this.pollSub = interval(1000).subscribe(() => this.loadNodos());
    }
  }

  ngOnDestroy() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
  }

  loadNodos() {
    this.disenoService.getNodos(this.projectId).subscribe({
      next: (data: NodoPantalla[]) => {
        this.nodos = data;
      },
      error: (err: any) => console.error('Error cargando nodos para inventario', err)
    });
  }
  
  selectNode(id: number) {
    this.disenoService.selectNodeFromInventory(id);
  }
  
  get estructuraNodes() {
    return this.nodos; // Todos los elementos del lienzo
  }
  
  get imageNodes() {
    return this.nodos.filter(n => n.icono === 'imagen'); // If any
  }
  
  get otherNodes() {
    return []; // Empty for now as all go to estructura
  }
  
  get filteredItems() {
    let list = this.nodos;
    
    if (this.activeTab === 'estructura') {
      list = this.estructuraNodes;
    } else if (this.activeTab === 'imagenes') {
      list = this.imageNodes;
    } else if (this.activeTab === 'otros') {
      list = this.otherNodes;
    }
    
    if (this.priorityFilter !== 'todos') {
      list = list.filter(n => n.prioridad === this.priorityFilter);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(n => 
        (n.nombre && n.nombre.toLowerCase().includes(term)) || 
        (n.descripcion && n.descripcion.toLowerCase().includes(term))
      );
    }
    
    return list;
  }
}
