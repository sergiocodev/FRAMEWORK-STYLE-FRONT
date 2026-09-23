import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserArchetypeCardComponent } from '../../../../../shared/components/cards/user-archetype-card/user-archetype-card.component';
import { InvestigationService } from '../../../services/investigation.service';

@Component({
  selector: 'app-investigation-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserArchetypeCardComponent],
  templateUrl: './investigation-users.component.html',
  styleUrls: ['./investigation-users.component.scss']
})
export class InvestigationUsersComponent {
  private investigationService = inject(InvestigationService);

  @Input() projectId!: number;
  @Input() usuarios: any[] = [];
  @Output() usuariosChange = new EventEmitter<any[]>();

  addUser() {
    if (!this.projectId) return;

    const newUser = {
      name: 'Nuevo Nombre',
      role: 'Nuevo Rol',
      tag: 'General',
      needs: ['Nueva necesidad']
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
      },
      error: (err) => {
        console.error('Error al crear arquetipo', err);
        alert('Hubo un error al crear el arquetipo.');
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

  removeUser(index: number) {
    const userToRemove = this.usuarios[index];
    if (userToRemove.id && this.projectId) {
      this.investigationService.deleteArquetipo(this.projectId, userToRemove.id).subscribe({
        next: () => {
          this.usuarios.splice(index, 1);
          this.emitChanges();
        },
        error: (err) => {
          console.error('Error al eliminar arquetipo', err);
          alert('No se pudo eliminar el arquetipo del servidor.');
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
}
