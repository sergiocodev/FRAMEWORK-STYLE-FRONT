import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private apiService = inject(ApiService);
  
  // Usamos signals para manejar el estado global
  currentUser = signal<UserProfile | null>(null);
  
  loadUserProfile() {
    return this.apiService.get<UserProfile>('users/me').subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.currentUser.set(null);
      }
    });
  }

  clearState() {
    this.currentUser.set(null);
    localStorage.removeItem('access_token');
  }
}
