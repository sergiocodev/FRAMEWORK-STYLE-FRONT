import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter, Subscription } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

export interface MenuItem {
  label: string;
  link: string;
  iconSvg?: string;
  isSubItem?: boolean;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
  isStepper?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  themeService = inject(ThemeService);
  private authState = inject(AuthStateService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  currentProjectId = 1;
  private routerSub!: Subscription;

  user = computed(() => {
    const currentUser = this.authState.currentUser();
    return {
      name: currentUser?.full_name || currentUser?.username || 'Usuario',
      email: currentUser?.email || '',
      avatarUrl: currentUser?.profile_picture || 'https://i.pravatar.cc/150?img=12'
    };
  });

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authState.clearState();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.extractProjectId(event.urlAfterRedirects);
    });
    // Check initial URL
    this.extractProjectId(this.router.url);
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private extractProjectId(url: string) {
    const match = url.match(/\/framework\/projects\/(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (id !== this.currentProjectId) {
        this.currentProjectId = id;
        this.updateProjectLinks();
      }
    }
  }

  private updateProjectLinks() {
    const frameworkSection = this.mainSections.find(s => s.title === 'FRAMEWORK STYLE');
    if (frameworkSection) {
      frameworkSection.items[0].link = `/framework/projects/${this.currentProjectId}/investigation`;
      frameworkSection.items[1].link = `/framework/projects/${this.currentProjectId}/diseno_conceptual`;
      frameworkSection.items[2].link = `/framework/projects/${this.currentProjectId}/visual`;
      frameworkSection.items[3].link = `/framework/projects/${this.currentProjectId}/detallado`;
      frameworkSection.items[4].link = `/framework/projects/${this.currentProjectId}/evaluacion`;
    }
  }

  getSafeIcon(svgContent?: string): SafeHtml {
    if (!svgContent) return '';
    const fullSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(fullSvg);
  }

  mainSections: MenuSection[] = [
    {
      title: 'NAVEGACIÓN',
      items: [
        { label: 'Proyectos', link: '/projects', iconSvg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' },
      ]
    },
    {
      title: 'FRAMEWORK STYLE',
      isStepper: true,
      items: [
        { label: 'Investigación', link: '/framework/projects/1/investigation', iconSvg: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' },
        { label: 'Conceptual', link: '/framework/projects/1/diseno_conceptual', iconSvg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>' },
        { label: 'Visual', link: '/framework/projects/1/visual', iconSvg: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.61-1.59-.44-.48-.68-1.07-.64-1.69.09-1.28 1.15-2.22 2.45-2.22H18c2.21 0 4-1.79 4-4 0-4.42-4.48-8-10-8z"></path>' },
        { label: 'Detallado', link: '/framework/projects/1/detallado', iconSvg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>' },
        { label: 'Evaluación', link: '/framework/projects/1/evaluacion', iconSvg: '<polyline points="20 6 9 17 4 12"></polyline>' }
      ]
    }
  ];
}
