import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserArchetypeCardComponent } from '../../../../../shared/components/cards/user-archetype-card/user-archetype-card.component';

@Component({
  selector: 'app-investigation-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserArchetypeCardComponent],
  templateUrl: './investigation-users.component.html',
  styleUrls: ['./investigation-users.component.scss']
})
export class InvestigationUsersComponent {
  @Input() usuarios: any[] = [];
  @Output() usuariosChange = new EventEmitter<any[]>();

  addUser() {
    this.usuarios.push({
      name: 'Nuevo Nombre',
      role: 'Nuevo Rol',
      tag: 'General',
      photoUrl: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
      needs: ['Nueva necesidad']
    });
    this.emitChanges();
  }

  removeUser(index: number) {
    this.usuarios.splice(index, 1);
    this.emitChanges();
  }

  addNeed(user: any) {
    user.needs.push('');
    this.emitChanges();
  }

  removeNeed(user: any, needIndex: number) {
    user.needs.splice(needIndex, 1);
    this.emitChanges();
  }

  emitChanges() {
    // Es importante crear una nueva referencia del arreglo para que change detection actúe
    this.usuarios = [...this.usuarios];
    this.usuariosChange.emit(this.usuarios);
  }
}
