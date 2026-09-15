import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  themeService = inject(ThemeService);

  user = {
    name: 'Sergio',
    avatarUrl: 'https://i.pravatar.cc/150?img=12'
  };

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
