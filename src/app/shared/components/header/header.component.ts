import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  themeService = inject(ThemeService);
  private authState = inject(AuthStateService);

  // Derive user info from global auth state, fallback to defaults if not available
  user = computed(() => {
    const currentUser = this.authState.currentUser();
    return {
      name: currentUser?.full_name || currentUser?.username || 'User',
      avatarUrl: currentUser?.profile_picture || 'https://i.pravatar.cc/150?img=12'
    };
  });

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
