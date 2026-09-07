import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Router, RouterLink } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private authService = inject(SocialAuthService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.authService.authState.subscribe((user: SocialUser) => {
      if (user && user.idToken) {
        this.loginWithGoogle(user.idToken);
      }
    });
  }

  loginWithGoogle(token: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.post<any>('auth/google', { token: token }).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access_token);
        this.isLoading = false;
        alert('¡Login exitoso con Google! Token guardado.');
        // this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al iniciar sesión con Google';
        console.error(err);
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new URLSearchParams();
    formData.set('username', this.loginForm.value.username);
    formData.set('password', this.loginForm.value.password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    this.apiService.post<any>('auth/login', formData.toString(), headers).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access_token);
        this.isLoading = false;
        alert('¡Login exitoso! Token guardado.');
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas';
        } else {
          this.errorMessage = 'Error de conexión con el servidor';
        }
      }
    });
  }
}
