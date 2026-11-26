import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserArchetypeCardComponent } from '../../../../../shared/components/cards/user-archetype-card/user-archetype-card.component';
import { InvestigationService } from '../../../services/investigation.service';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-investigation-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserArchetypeCardComponent],
  templateUrl: './investigation-users.component.html',
  styleUrls: ['./investigation-users.component.scss']
})
export class InvestigationUsersComponent {
  private investigationService = inject(InvestigationService);
  private dialogService = inject(DialogService);

  @Input() projectId!: number;
  @Input() usuarios: any[] = [];
  @Output() usuariosChange = new EventEmitter<any[]>();

  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  isCreating: boolean = false;

  addUser(preset?: { role: string, name: string, tag: string, need: string }) {
    if (!this.projectId) return;

    this.isCreating = true;
    const newUser = {
      name: preset?.name || 'Nombre del Usuario',
      role: preset?.role || 'Rol del Usuario',
      tag: preset?.tag || 'General',
      needs: preset?.need ? [preset.need] : ['Necesidad principal de interfaz']
    };

    const payload = {
      nombre: `${newUser.role} | ${newUser.name}`,
      etiqueta: newUser.tag,
      necesidades: newUser.needs.map(n => ({ descripcion: n }))
    };

    this.investigationService.createArquetipo(this.projectId, payload).subscribe({
      next: (res: any) => {
        (newUser as any).id = res.id;
        this.usuarios.push(newUser);
        this.emitChanges();
        this.isCreating = false;
      },
      error: (err) => {
        console.error('Error al crear arquetipo', err);
        this.isCreating = false;
        this.dialogService.error('Hubo un error al crear el arquetipo de usuario.');
      }
    });
  }

  updateUser(user: any) {
    if (!this.projectId || !user.id) return;
    
    const payload = {
      nombre: `${user.role} | ${user.name}`,
      etiqueta: user.tag,
      necesidades: user.needs.map((n: string) => ({ descripcion: n }))
    };

    this.investigationService.updateArquetipo(this.projectId, user.id, payload).subscribe({
      next: () => {
        // Guardado con éxito
      },
      error: (err) => {
        console.error('Error al actualizar arquetipo', err);
      }
    });
    
    this.emitChanges();
  }

  async removeUser(index: number) {
    const userToRemove = this.usuarios[index];
    const confirmed = await this.dialogService.confirm({
      title: '¿Eliminar arquetipo?',
      message: `¿Estás seguro de eliminar el arquetipo "${userToRemove.name || userToRemove.role || 'seleccionado'}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    if (userToRemove.id && this.projectId) {
      this.investigationService.deleteArquetipo(this.projectId, userToRemove.id).subscribe({
        next: () => {
          this.usuarios.splice(index, 1);
          this.emitChanges();
          this.dialogService.success('Arquetipo eliminado.');
        },
        error: (err) => {
          console.error('Error al eliminar arquetipo', err);
          this.dialogService.error('No se pudo eliminar el arquetipo del servidor.');
        }
      });
    } else {
      this.usuarios.splice(index, 1);
      this.emitChanges();
    }
  }

  emitChanges() {
    this.usuarios = [...this.usuarios];
    this.usuariosChange.emit(this.usuarios);
  }

  onNext() {
    this.next.emit();
  }

  onPrev() {
    this.prev.emit();
  }
}
