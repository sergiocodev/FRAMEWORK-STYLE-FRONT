import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  host: {
    '[attr.title]': 'null'
  }
})
export class ModalComponent {
  /** Indicates if the modal is currently open */
  @Input() isOpen = false;
  
  /** Optional title to display in the header */
  @Input() title = '';
  
  /** Size of the modal. Controls max-width. */
  @Input() size: 'small' | 'medium' | 'large' | 'full' = 'medium';
  
  /** Whether to hide the default close button in the top right */
  @Input() hideCloseButton = false;
  
  /** Emitted when the user wants to close the modal (e.g. clicks overlay, X button, or Escape key) */
  @Output() closeEvent = new EventEmitter<void>();

  close() {
    this.closeEvent.emit();
  }

  // Close when clicking outside the modal content (on the overlay)
  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
  
  // Close on Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.isOpen) {
      this.close();
    }
  }
}
