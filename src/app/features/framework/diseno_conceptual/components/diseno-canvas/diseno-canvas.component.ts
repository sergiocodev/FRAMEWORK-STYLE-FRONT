import { Component, Input, OnInit, HostListener, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DisenoConceptualService } from '../../../services/diseno-conceptual.service';
import { NodoPantalla, ContenidoItem, NodoConexion } from '../../../../../models/diseno-conceptual.model';

@Component({
  selector: 'app-diseno-canvas',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './diseno-canvas.component.html',
  styleUrls: ['./diseno-canvas.component.scss']
})
export class DisenoCanvasComponent implements OnInit {
  @Input() projectId!: number;
  private disenoService = inject(DisenoConceptualService);
  
  nodos: NodoPantalla[] = [];
  conexiones: NodoConexion[] = [];
  
  isConnectionMode = false;
  selectedSourceNodeId: number | null = null;
  selectedNodeIds: Set<number> = new Set<number>();
  selectedConexionId: number | null = null;
  
  isBoxSelecting = false;
  selectionBox = { x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 };
  zoom = 1.0;

  isPrioritizationMode = false;
  activePriorityMenuNodeId: number | null = null;
  isFullscreen = false;

  undoStack: any[] = [];
  redoStack: any[] = [];

  pushAction(action: any) {
    this.undoStack.push(action);
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.isFullscreen) {
        this.toggleFullscreen();
      }
      if (this.isConnectionMode) {
        this.isConnectionMode = false;
        this.selectedSourceNodeId = null;
      }
      if (this.isPrioritizationMode) {
        this.isPrioritizationMode = false;
        this.activePriorityMenuNodeId = null;
      }
      this.selectedNodeIds.clear();
      this.selectedConexionId = null;
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      this.deshacer();
      event.preventDefault();
      return;
    }
    
    if (event.ctrlKey && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
      this.rehacer();
      event.preventDefault();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.hasAttribute('contenteditable'))) {
        return;
      }
      
      if (this.selectedNodeIds.size > 0) {
        // Only delete nodes if not editing text
        if (document.activeElement?.tagName !== 'H6') {
          const nodosToDelete = this.nodos.filter(n => n.id && this.selectedNodeIds.has(n.id));
          const groupId = Date.now().toString();
          nodosToDelete.forEach(nodo => this.deleteNodo(nodo, groupId));
          this.selectedNodeIds.clear();
        }
      } else if (this.selectedConexionId) {
        this.deleteSelectedConexion();
      }
    }
  }

  deleteSelectedConexion() {
    if (!this.selectedConexionId) return;
    const deletedConexion = this.conexiones.find(c => c.id === this.selectedConexionId);
    this.disenoService.deleteConexion(this.projectId, this.selectedConexionId).subscribe({
      next: () => {
        if (deletedConexion) {
          this.pushAction({
            type: 'DELETE_CONEXION',
            data: { conexion: deletedConexion }
          });
        }
        this.conexiones = this.conexiones.filter(c => c.id !== this.selectedConexionId);
        this.selectedConexionId = null;
      },
      error: (err: any) => console.error('Error eliminando conexión', err)
    });
  }

  selectConexion(con: NodoConexion, event: MouseEvent) {
    this.selectedConexionId = con.id!;
    event.stopPropagation();
  }

  ngOnInit() {
    if (this.projectId) {
      this.loadData();
    }
    
    this.disenoService.inventoryUpdated$.subscribe(() => {
      this.loadData();
    });
    
    this.disenoService.nodeSelected$.subscribe((nodeId) => {
      this.selectedNodeIds.clear();
      this.selectedNodeIds.add(nodeId);
    });
  }

  loadData() {
    this.disenoService.getNodos(this.projectId).subscribe({
      next: (data: NodoPantalla[]) => {
        this.nodos = data.map((n, i) => {
          if (!n.pos_x && !n.pos_y) {
            n.pos_x = 100 + (i * 300);
            n.pos_y = 100 + ((i % 2) * 200);
          }
          return n;
        });
      },
      error: (err: any) => console.error('Error cargando nodos', err)
    });
    
    this.disenoService.getConexiones(this.projectId).subscribe({
      next: (data: NodoConexion[]) => this.conexiones = data,
      error: (err: any) => console.error('Error cargando conexiones', err)
    });
  }
  scrollToChecklists() {
    const el = document.querySelector('app-diseno-checklist');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onDrop(event: CdkDragDrop<any>, nodo: NodoPantalla) {
    if (event.previousContainer !== event.container) {
      const itemToMove = event.item.data as ContenidoItem;
      if (itemToMove.id && nodo.id) {
        this.disenoService.updateContenidoInventario(this.projectId, itemToMove.id, { nodo_id: nodo.id }).subscribe({
          next: () => {
            if (!nodo.contenidos) nodo.contenidos = [];
            nodo.contenidos.push(itemToMove);
            this.disenoService.notifyInventoryUpdated();
          },
          error: (err: any) => console.error('Error moviendo item', err)
        });
      }
    }
  }

  onNodeDragMoved(event: any, nodo: any) {
    const transform = event.source.getFreeDragPosition();
    const deltaX = transform.x - (nodo._drag_x || transform.x);
    const deltaY = transform.y - (nodo._drag_y || transform.y);
    
    nodo._drag_x = transform.x;
    nodo._drag_y = transform.y;
    
    // Multi-drag: move other selected nodes
    if (nodo.id && this.selectedNodeIds.has(nodo.id)) {
      this.nodos.forEach(n => {
        if (n.id && n.id !== nodo.id && this.selectedNodeIds.has(n.id)) {
          n.pos_x = (n.pos_x || 0) + deltaX;
          n.pos_y = (n.pos_y || 0) + deltaY;
          // We don't update _drag_x/_drag_y here because cdkDrag free drag pos is managed by CDK for each item independently.
          // Wait, CDK Drag won't visually update other nodes via pos_x/pos_y during drag unless they are bounded or we force update.
          // We will sync them in onNodeDragEnded to be safe.
        }
      });
    }
  }

  onNodeDragEnded(event: CdkDragEnd, nodo: any) {
    const transform = event.source.getFreeDragPosition();
    const deltaX = Math.round(transform.x) - (nodo.pos_x || 0);
    const deltaY = Math.round(transform.y) - (nodo.pos_y || 0);
    
    const newX = Math.round(transform.x);
    const newY = Math.round(transform.y);
    
    if (nodo.pos_x !== newX || nodo.pos_y !== newY) {
      const oldX = nodo.pos_x;
      const oldY = nodo.pos_y;
      nodo.pos_x = newX;
      nodo.pos_y = newY;
      nodo._drag_x = undefined;
      nodo._drag_y = undefined;
      
      this.pushAction({
        type: 'MOVE_NODE',
        data: { id: nodo.id, oldX, oldY, newX, newY }
      });
      
      if (nodo.id) {
        this.disenoService.updateNodo(this.projectId, nodo.id, nodo).subscribe({
          next: () => console.log(`Posición del nodo ${nodo.id} actualizada`),
          error: (err: any) => console.error('Error actualizando posición', err)
        });
      }

      // Multi-drag end
      if (nodo.id && this.selectedNodeIds.has(nodo.id)) {
        this.nodos.forEach(n => {
          if (n.id && n.id !== nodo.id && this.selectedNodeIds.has(n.id)) {
            n.pos_x = Math.round(n.pos_x || 0);
            n.pos_y = Math.round(n.pos_y || 0);
            this.disenoService.updateNodo(this.projectId, n.id, n).subscribe({
              next: () => console.log(`Posición del nodo ${n.id} actualizada`),
              error: (err: any) => console.error('Error actualizando posición', err)
            });
          }
        });
      }
    } else {
      nodo._drag_x = undefined;
      nodo._drag_y = undefined;
    }
  }

  deleteNodo(nodo: NodoPantalla, groupId?: string) {
    if (nodo.id) {
      const attachedConexiones = this.conexiones.filter(c => c.nodo_origen_id === nodo.id || c.nodo_destino_id === nodo.id);
      
      this.disenoService.deleteNodo(this.projectId, nodo.id).subscribe({
        next: () => {
          this.pushAction({
            type: 'DELETE_NODE',
            groupId,
            data: { nodo, conexiones: attachedConexiones }
          });
          
          this.nodos = this.nodos.filter(n => n.id !== nodo.id);
          this.conexiones = this.conexiones.filter(c => c.nodo_origen_id !== nodo.id && c.nodo_destino_id !== nodo.id);
          this.selectedNodeIds.delete(nodo.id!);
        },
        error: (err: any) => console.error('Error eliminando nodo', err)
      });
    }
  }

  onNodeTextChange(event: Event, nodo: NodoPantalla, field: 'nombre' | 'descripcion') {
    const target = event.target as HTMLElement;
    const newValue = target.innerText.trim();
    if (newValue && newValue !== nodo[field]) {
      const oldValue = nodo[field];
      nodo[field] = newValue;
      this.pushAction({
        type: 'EDIT_TEXT',
        data: { id: nodo.id, field, oldValue, newValue }
      });
      if (nodo.id) {
        this.disenoService.updateNodo(this.projectId, nodo.id, nodo).subscribe({
          next: () => console.log(`Texto del nodo ${nodo.id} actualizado`),
          error: (err: any) => console.error('Error actualizando texto', err)
        });
      }
    }
  }

  enableEdit(element: HTMLElement, event: Event) {
    element.setAttribute('contenteditable', 'true');
    element.focus();
    event.stopPropagation();
    
    const range = document.createRange();
    range.selectNodeContents(element);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  onNodeTypeChange(event: Event, nodo: NodoPantalla) {
    const select = event.target as HTMLSelectElement;
    const newType = select.value as 'modulo' | 'pantalla' | 'componente';
    if (newType !== nodo.tipo) {
      nodo.tipo = newType;
      if (nodo.id) {
        this.disenoService.updateNodo(this.projectId, nodo.id, nodo).subscribe({
          next: () => console.log(`Tipo del nodo ${nodo.id} actualizado a ${newType}`),
          error: (err: any) => console.error('Error actualizando tipo de nodo', err)
        });
      }
    }
  }

  onContenidoTextChange(event: Event, cont: ContenidoItem) {
    const target = event.target as HTMLElement;
    const newValue = target.innerText.trim();
    if (newValue && newValue !== cont.nombre) {
      cont.nombre = newValue;
      if (cont.id) {
        this.disenoService.updateContenidoInventario(this.projectId, cont.id, { nombre: newValue }).subscribe({
          next: () => console.log(`Contenido ${cont.id} actualizado`),
          error: (err: any) => console.error('Error actualizando contenido', err)
        });
      }
    }
  }

  private getNewNodePosition(): { x: number, y: number } {
    const offset = (this.nodos.length % 10) * 40;
    return { x: 100 + offset, y: 100 + offset };
  }

  addNodo() {
    const pos = this.getNewNodePosition();
    this.disenoService.createNodo(this.projectId, {
      nombre: 'Nueva Pantalla',
      descripcion: 'Descripción',
      tipo: 'pantalla',
      pos_x: pos.x,
      pos_y: pos.y
    }).subscribe({
      next: (newNodo) => {
        this.nodos.push(newNodo);
        this.pushAction({
          type: 'CREATE_NODE',
          data: { nodo: newNodo }
        });
      },
      error: (err: any) => console.error('Error creando nodo', err)
    });
  }

  addTexto() {
    const pos = this.getNewNodePosition();
    this.disenoService.createNodo(this.projectId, {
      nombre: 'Texto',
      descripcion: '',
      tipo: 'pantalla',
      icono: 'texto_libre',
      pos_x: pos.x,
      pos_y: pos.y
    }).subscribe({
      next: (newNodo) => {
        this.nodos.push(newNodo);
        this.pushAction({
          type: 'CREATE_NODE',
          data: { nodo: newNodo }
        });
      },
      error: (err: any) => console.error('Error creando texto', err)
    });
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  toggleConexion() {
    this.isConnectionMode = !this.isConnectionMode;
    if (this.isConnectionMode) {
      this.isPrioritizationMode = false;
      this.activePriorityMenuNodeId = null;
    }
    this.selectedSourceNodeId = null;
  }

  togglePriorizacion() {
    this.isPrioritizationMode = !this.isPrioritizationMode;
    if (this.isPrioritizationMode) {
      this.isConnectionMode = false;
      this.selectedSourceNodeId = null;
      this.selectedNodeIds.clear();
    }
  }

  setPrioridadById(nodoId: number, prioridad: 'alta' | 'media' | 'baja' | null) {
    this.activePriorityMenuNodeId = null;
    if (this.selectedNodeIds.has(nodoId)) {
      // Priorizar todos los seleccionados
      this.nodos.forEach(n => {
        if (n.id && this.selectedNodeIds.has(n.id)) {
          this.setPrioridad(n, prioridad, true); // true para no limpiar activePriorityMenuNodeId
        }
      });
    } else {
      const nodo = this.nodos.find(n => n.id === nodoId);
      if (nodo) {
        this.setPrioridad(nodo, prioridad, true);
      }
    }
  }

  setPrioridad(nodo: NodoPantalla, prioridad: 'alta' | 'media' | 'baja' | null, skipMenuClose = false) {
    const oldPrioridad = nodo.prioridad || null;
    nodo.prioridad = prioridad;
    if (!skipMenuClose) this.activePriorityMenuNodeId = null;
    
    this.pushAction({
      type: 'SET_PRIORIDAD',
      data: { id: nodo.id, oldPrioridad, newPrioridad: prioridad }
    });
    
    if (nodo.id) {
      this.disenoService.updateNodo(this.projectId, nodo.id, { ...nodo, prioridad: prioridad } as any).subscribe();
    }
  }

  onNodeClick(nodo: NodoPantalla, event?: MouseEvent) {
    if (this.isPrioritizationMode) {
      this.activePriorityMenuNodeId = nodo.id!;
      return;
    }

    if (this.isConnectionMode) {
      if (!this.selectedSourceNodeId) {
        this.selectedSourceNodeId = nodo.id!;
      } else {
        if (this.selectedSourceNodeId !== nodo.id) {
          const payload: any = {
            nodo_origen_id: this.selectedSourceNodeId,
            nodo_destino_id: nodo.id!,
            tipo_conexion: 'navegacion'
          };
          this.disenoService.createConexion(this.projectId, payload).subscribe({
            next: (con: NodoConexion) => {
              this.conexiones.push(con);
              this.pushAction({
                type: 'CREATE_CONEXION',
                data: { conexionId: con.id, origenId: payload.nodo_origen_id, destinoId: payload.nodo_destino_id, conexionPayload: payload }
              });
            },
            error: (err: any) => console.error('Error creando conexión', err)
          });
        }
        // Limpiamos el nodo origen, pero no salimos del modo conexión. 
        // Así el usuario puede hacer clic en otro nodo para iniciar una nueva conexión.
        this.selectedSourceNodeId = null;
      }
      return;
    }

    if (nodo.id) {
      if (event && (event.ctrlKey || event.metaKey)) {
        if (this.selectedNodeIds.has(nodo.id)) {
          this.selectedNodeIds.delete(nodo.id);
        } else {
          this.selectedNodeIds.add(nodo.id);
        }
      } else {
        if (!this.selectedNodeIds.has(nodo.id)) {
          this.selectedNodeIds.clear();
          this.selectedNodeIds.add(nodo.id);
        }
      }
    }
  }

  // Multi-selection state
  preBoxSelectedNodeIds = new Set<number>();

  onCanvasMouseDown(event: MouseEvent) {
    if (this.isPrioritizationMode || this.isConnectionMode) return;
    this.isBoxSelecting = true;
    
    const container = document.querySelector('.flowchart-container') as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const zoom = this.zoom || 1;
    
    this.selectionBox.startX = (event.clientX - rect.left) / zoom;
    this.selectionBox.startY = (event.clientY - rect.top) / zoom;
    this.selectionBox.x = this.selectionBox.startX;
    this.selectionBox.y = this.selectionBox.startY;
    this.selectionBox.width = 0;
    this.selectionBox.height = 0;
    
    if (!event.ctrlKey && !event.metaKey) {
      this.clearSelection();
    }
    this.preBoxSelectedNodeIds = new Set(this.selectedNodeIds);
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isBoxSelecting) return;
    
    const container = document.querySelector('.flowchart-container') as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const zoom = this.zoom || 1;
    
    const currentX = (event.clientX - rect.left) / zoom;
    const currentY = (event.clientY - rect.top) / zoom;
    
    this.selectionBox.x = Math.min(this.selectionBox.startX, currentX);
    this.selectionBox.y = Math.min(this.selectionBox.startY, currentY);
    this.selectionBox.width = Math.abs(currentX - this.selectionBox.startX);
    this.selectionBox.height = Math.abs(currentY - this.selectionBox.startY);
    
    this.calculateBoxSelection();
  }

  onCanvasMouseUp(event: MouseEvent) {
    this.isBoxSelecting = false;
  }

  calculateBoxSelection() {
    const box = this.selectionBox;
    const boxRight = box.x + box.width;
    const boxBottom = box.y + box.height;
    
    // Reset to pre-box selection before recalculating intersections
    this.selectedNodeIds = new Set(this.preBoxSelectedNodeIds);
    
    const container = document.querySelector('.flowchart-container') as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const zoom = this.zoom || 1;
    
    this.nodos.forEach(nodo => {
      const el = document.getElementById('node-' + nodo.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        const nx = (rect.left - containerRect.left) / zoom;
        const ny = (rect.top - containerRect.top) / zoom;
        const nw = rect.width / zoom;
        const nh = rect.height / zoom;
        
        if (nx < boxRight && (nx + nw) > box.x && ny < boxBottom && (ny + nh) > box.y) {
           if (nodo.id) this.selectedNodeIds.add(nodo.id);
        }
      }
    });
  }

  isSelected(nodo: NodoPantalla): boolean {
    return !!nodo.id && this.selectedNodeIds.has(nodo.id);
  }

  clearSelection() {
    this.selectedNodeIds.clear();
    this.selectedConexionId = null;
  }

  getConnectorPath(con: NodoConexion): string {
    const origen = this.nodos.find(n => n.id === con.nodo_origen_id) as any;
    const destino = this.nodos.find(n => n.id === con.nodo_destino_id) as any;
    if (!origen || !destino) return '';
    
    let oxOffset = 85; let oyOffset = 50;
    let dxOffset = 85; let dyOffset = 50;

    const elOrigen = document.getElementById('node-' + origen.id);
    if (elOrigen) {
      oxOffset = elOrigen.offsetWidth / 2;
      oyOffset = elOrigen.offsetHeight / 2;
    } else if (origen.icono === 'texto_libre') {
      oxOffset = 40; oyOffset = 15;
    }

    const elDestino = document.getElementById('node-' + destino.id);
    if (elDestino) {
      dxOffset = elDestino.offsetWidth / 2;
      dyOffset = elDestino.offsetHeight / 2;
    } else if (destino.icono === 'texto_libre') {
      dxOffset = 40; dyOffset = 15;
    }
    
    const oCenterX = (origen._drag_x ?? origen.pos_x ?? 0) + oxOffset;
    const oCenterY = (origen._drag_y ?? origen.pos_y ?? 0) + oyOffset;
    const dCenterX = (destino._drag_x ?? destino.pos_x ?? 0) + dxOffset;
    const dCenterY = (destino._drag_y ?? destino.pos_y ?? 0) + dyOffset;

    let ox = oCenterX;
    let oy = oCenterY;
    let dx = dCenterX;
    let dy = dCenterY;

    // Calcular conexiones desde los bordes superior/inferior para evitar superposición visual
    const gap = 2; // Pequeño margen para que la flecha/línea no toque el pixel exacto
    if (dCenterY >= oCenterY) {
      // El destino está más abajo: salir por abajo de origen, entrar por arriba de destino
      oy = oCenterY + oyOffset + gap;
      dy = dCenterY - dyOffset - gap;
    } else {
      // El destino está más arriba: salir por arriba de origen, entrar por abajo de destino
      oy = oCenterY - oyOffset - gap;
      dy = dCenterY + dyOffset + gap;
    }
    
    return `M ${ox} ${oy} C ${ox} ${(oy+dy)/2}, ${dx} ${(oy+dy)/2}, ${dx} ${dy}`;
  }
  
  zoomIn() {
    this.zoom = Math.min(2.0, this.zoom + 0.1);
  }
  
  zoomOut() {
    this.zoom = Math.max(0.5, this.zoom - 0.1);
  }
  
  resetZoom() {
    this.zoom = 1.0;
  }

  async deshacer() {
    if (this.undoStack.length === 0) return;
    const firstAction = this.undoStack.pop();
    this.redoStack.push(firstAction);
    
    const actions = [firstAction];
    if (firstAction.groupId) {
      while (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1].groupId === firstAction.groupId) {
        const nextAction = this.undoStack.pop();
        this.redoStack.push(nextAction);
        actions.push(nextAction);
      }
    }
    await this._applyUndoGroup(actions);
  }

  private async _applyUndoGroup(actions: any[]) {
    const idMap = new Map<number, number>();
    
    for (const action of actions) {
      if (action.type === 'DELETE_NODE') {
        const nodo = { ...action.data.nodo };
        const oldId = nodo.id;
        delete nodo.id;
        
        try {
          const newNodo = await firstValueFrom(this.disenoService.createNodo(this.projectId, nodo));
          if (action.data.nodo.prioridad) {
            newNodo.prioridad = action.data.nodo.prioridad;
            await firstValueFrom(this.disenoService.updateNodo(this.projectId, newNodo.id!, { ...newNodo } as any));
          }
          this.nodos.push(newNodo);
          action.data.newId = newNodo.id;
          idMap.set(oldId, newNodo.id!);
        } catch (err) {
          console.error('Error recreating node', err);
        }
      }
    }
    
    for (const action of actions) {
      if (action.type === 'MOVE_NODE') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          nodo.pos_x = action.data.oldX;
          nodo.pos_y = action.data.oldY;
          this.disenoService.updateNodo(this.projectId, nodo.id!, nodo).subscribe();
        }
      } else if (action.type === 'EDIT_TEXT') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          (nodo as any)[action.data.field] = action.data.oldValue;
          this.disenoService.updateNodo(this.projectId, nodo.id!, nodo).subscribe();
        }
      } else if (action.type === 'SET_PRIORIDAD') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          nodo.prioridad = action.data.oldPrioridad || null;
          this.disenoService.updateNodo(this.projectId, nodo.id!, { ...nodo, prioridad: nodo.prioridad } as any).subscribe();
        }
      } else if (action.type === 'DELETE_CONEXION') {
        this.disenoService.createConexion(this.projectId, action.data.conexion).subscribe(con => {
          this.conexiones.push(con);
          action.data.newConexionId = con.id;
        });
      } else if (action.type === 'CREATE_CONEXION') {
        const idToDelete = action.data.newConexionId || action.data.conexionId;
        this.disenoService.deleteConexion(this.projectId, idToDelete).subscribe(() => {
          this.conexiones = this.conexiones.filter(c => c.id !== idToDelete);
        });
      } else if (action.type === 'DELETE_NODE') {
        if (action.data.conexiones) {
          for (const c of action.data.conexiones) {
            const origenId = idMap.get(c.nodo_origen_id) || c.nodo_origen_id;
            const destinoId = idMap.get(c.nodo_destino_id) || c.nodo_destino_id;
            
            const alreadyExists = this.conexiones.some(existing => existing.nodo_origen_id === origenId && existing.nodo_destino_id === destinoId);
            if (!alreadyExists) {
              try {
                const newC = await firstValueFrom(this.disenoService.createConexion(this.projectId, {
                  nodo_origen_id: origenId,
                  nodo_destino_id: destinoId,
                  tipo_conexion: c.tipo_conexion
                }));
                this.conexiones.push(newC);
              } catch (err) {
                console.error('Error recreating connection', err);
              }
            }
          }
        }
      }
    }
  }

  async rehacer() {
    if (this.redoStack.length === 0) return;
    const firstAction = this.redoStack.pop();
    this.undoStack.push(firstAction);
    
    const actions = [firstAction];
    if (firstAction.groupId) {
      while (this.redoStack.length > 0 && this.redoStack[this.redoStack.length - 1].groupId === firstAction.groupId) {
        const nextAction = this.redoStack.pop();
        this.undoStack.push(nextAction);
        actions.push(nextAction);
      }
    }
    
    actions.reverse();
    await this._applyRedoGroup(actions);
  }

  private async _applyRedoGroup(actions: any[]) {
    for (const action of actions) {
      if (action.type === 'MOVE_NODE') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          nodo.pos_x = action.data.newX;
          nodo.pos_y = action.data.newY;
          this.disenoService.updateNodo(this.projectId, nodo.id!, nodo).subscribe();
        }
      } else if (action.type === 'EDIT_TEXT') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          (nodo as any)[action.data.field] = action.data.newValue;
          this.disenoService.updateNodo(this.projectId, nodo.id!, nodo).subscribe();
        }
      } else if (action.type === 'SET_PRIORIDAD') {
        const nodo = this.nodos.find(n => n.id === action.data.id);
        if (nodo) {
          nodo.prioridad = action.data.newPrioridad || null;
          this.disenoService.updateNodo(this.projectId, nodo.id!, { ...nodo, prioridad: nodo.prioridad } as any).subscribe();
        }
      } else if (action.type === 'CREATE_NODE') {
        const nodo = action.data.nodo;
        const nodoData = { ...nodo };
        delete nodoData.id;
        this.disenoService.createNodo(this.projectId, nodoData).subscribe(newNodo => {
          this.nodos.push(newNodo);
          action.data.nodo = newNodo;
        });
      } else if (action.type === 'DELETE_NODE') {
        const idToDelete = action.data.newId || action.data.nodo.id;
        this.disenoService.deleteNodo(this.projectId, idToDelete).subscribe(() => {
          this.nodos = this.nodos.filter(n => n.id !== idToDelete);
          this.conexiones = this.conexiones.filter(c => c.nodo_origen_id !== idToDelete && c.nodo_destino_id !== idToDelete);
        });
      } else if (action.type === 'DELETE_CONEXION') {
        const idToDelete = action.data.newConexionId || action.data.conexion.id;
        this.disenoService.deleteConexion(this.projectId, idToDelete).subscribe(() => {
          this.conexiones = this.conexiones.filter(c => c.id !== idToDelete);
        });
      } else if (action.type === 'CREATE_CONEXION') {
        const payload: any = action.data.conexionPayload || {
          nodo_origen_id: action.data.origenId,
          nodo_destino_id: action.data.destinoId,
          tipo_conexion: 'navegacion'
        };
        this.disenoService.createConexion(this.projectId, payload).subscribe(con => {
          this.conexiones.push(con);
          action.data.newConexionId = con.id;
        });
      }
    }
  }
}
