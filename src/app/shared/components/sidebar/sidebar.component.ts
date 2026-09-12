import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MenuItem {
  label: string;
  link: string;
  iconSvg?: string;
  isSubItem?: boolean;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  isCollapsed = false;

  constructor(private sanitizer: DomSanitizer) {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  getSafeIcon(svgContent?: string, isCollapsed: boolean = false): SafeHtml {
    if (!svgContent) return '';
    const marginClass = isCollapsed ? '' : 'me-3';
    const fullSvg = `<svg class="${marginClass} nav-icon flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(fullSvg);
  }

  mainSections: MenuSection[] = [
    {
      title: 'NAVEGACIÓN',
      items: [
        { label: 'Inicio', link: '/dashboard', iconSvg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
        { label: 'Mis proyectos', link: '/projects', iconSvg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' },
        { label: 'Compartidos', link: '/shared', iconSvg: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line>' },
        { label: 'Biblioteca', link: '/library', iconSvg: '<path d="M6 2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><path d="M4 6v14a2 2 0 0 0 2 2h11"></path>' }
      ]
    },
    {
      title: 'FRAMEWORK STYLE',
      items: [
        { label: 'Investigación', link: '/framework/projects/1/investigation', iconSvg: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' },
        { label: 'Conceptual', link: '/framework/projects/1/diseno_conceptual', iconSvg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>' },
        { label: 'Visual', link: '/framework/projects/1/visual', iconSvg: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.61-1.59-.44-.48-.68-1.07-.64-1.69.09-1.28 1.15-2.22 2.45-2.22H18c2.21 0 4-1.79 4-4 0-4.42-4.48-8-10-8z"></path>' },
        { label: 'Detallado', link: '/framework/projects/1/detallado', iconSvg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>' },
        { label: 'Evaluación', link: '/framework/projects/1/evaluacion', iconSvg: '<polyline points="20 6 9 17 4 12"></polyline>' }
      ]
    }
  ];

  footerSection: MenuSection = {
    items: [
      { label: 'Ayuda', link: '/help', iconSvg: '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>' },
      { label: 'Salir', link: '/login', iconSvg: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>' }
    ]
  };

}
