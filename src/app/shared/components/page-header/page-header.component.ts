import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  
  // Search Configuration
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Buscar...';
  
  // Two-way binding for search term
  @Input() searchTerm: string = '';
  @Output() searchTermChange = new EventEmitter<string>();

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
  }
}
