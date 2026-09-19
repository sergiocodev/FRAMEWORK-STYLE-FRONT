import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
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
