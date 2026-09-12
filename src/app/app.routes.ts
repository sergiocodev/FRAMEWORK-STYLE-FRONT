import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LandingComponent } from './features/landing/landing.component';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'framework/projects/:id/investigation', loadComponent: () => import('./features/framework/investigation/investigation.component').then(m => m.InvestigationComponent) },
      { path: 'framework/projects/:id/diseno_conceptual', loadComponent: () => import('./features/framework/diseno_conceptual/diseno-conceptual.component').then(m => m.DisenoConceptualComponent) }
    ]
  }
];
