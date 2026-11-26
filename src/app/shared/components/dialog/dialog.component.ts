import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  dialogService = inject(DialogService);

  get state() {
    return this.dialogService.state();
  }

  onConfirm() {
    this.dialogService.close(true);
  }

  onCancel() {
    this.dialogService.close(false);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey() {
    if (this.state) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent) {
    if (this.state) {
      event.preventDefault();
      this.onConfirm();
    }
  }
}
