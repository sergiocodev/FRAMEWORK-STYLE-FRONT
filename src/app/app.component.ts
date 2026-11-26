import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { DialogComponent } from './shared/components/dialog/dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'FRAMEWORK_FRONTEND';
  private authState = inject(AuthStateService);

  ngOnInit() {
    if (localStorage.getItem('access_token')) {
      this.authState.loadUserProfile();
    }
  }
}
