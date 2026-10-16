import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LandingComponent } from './features/landing/landing.component';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { phaseGuard } from './core/guards/phase.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'inicio', loadComponent: () => import('./features/inicio/inicio.component').then(m => m.InicioComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-dashboard/project-dashboard.component').then(m => m.ProjectDashboardComponent) },
      { 
        path: 'framework/projects/:id/investigation', 
        loadComponent: () => import('./features/framework/investigation/investigation.component').then(m => m.InvestigationComponent),
        canActivate: [phaseGuard],
        data: { phase: 1 }
      },
      { 
        path: 'framework/projects/:id/diseno_conceptual', 
        loadComponent: () => import('./features/framework/diseno_conceptual/diseno-conceptual.component').then(m => m.DisenoConceptualComponent),
        canActivate: [phaseGuard],
        data: { phase: 2 }
      },
      { 
        path: 'framework/projects/:id/diseno_conceptual/checklists', 
        loadComponent: () => import('./features/framework/diseno_conceptual/screens/diseno-checklists-screen/diseno-checklists-screen.component').then(m => m.DisenoChecklistsScreenComponent),
        canActivate: [phaseGuard],
        data: { phase: 2 }
      },
      { 
        path: 'framework/projects/:id/visual', 
        loadComponent: () => import('./features/framework/diseno_visual/diseno_visual.component').then(m => m.DisenoVisualComponent),
        canActivate: [phaseGuard],
        data: { phase: 3 }
      },
      { 
        path: 'framework/projects/:id/detallado', 
        loadComponent: () => import('./features/framework/diseno-detallado/diseno-detallado.component').then(m => m.DisenoDetalladoComponent),
        canActivate: [phaseGuard],
        data: { phase: 4 }
      },
      {
        path: 'framework/projects/:id/evaluacion',
        loadComponent: () => import('./features/framework/assessment/assessment.component').then(m => m.AssessmentComponent),
        canActivate: [phaseGuard],
        data: { phase: 5 }
      },
      {
        path: 'framework/projects/:id/assessment',
        redirectTo: 'framework/projects/:id/evaluacion',
        pathMatch: 'full'
      }
    ]
  }
];
