import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-archetype-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-archetype-card.component.html',
  styleUrls: ['./user-archetype-card.component.scss']
})
export class UserArchetypeCardComponent {
  @Input() user: any;
  @Output() userChange = new EventEmitter<any>();
  @Output() remove = new EventEmitter<void>();

  addNeed() {
    if (!this.user.needs) {
      this.user.needs = [];
    }
    this.user.needs.push('');
    this.emitChanges();
  }

  removeNeed(needIndex: number) {
    this.user.needs.splice(needIndex, 1);
    this.emitChanges();
  }

  emitChanges() {
    this.userChange.emit(this.user);
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
