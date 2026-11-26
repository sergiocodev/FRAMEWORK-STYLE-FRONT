import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../services/project.service';
import { DialogService } from '../services/dialog.service';

export const phaseGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const projectService = inject(ProjectService);
  const dialogService = inject(DialogService);
  
  const projectId = Number(route.paramMap.get('id'));
  const requiredPhase = route.data['phase'] as number;

  if (!projectId || !requiredPhase) {
    return true; // Si no hay ID o fase requerida configurada, deja pasar
  }

  return projectService.getProjectById(projectId).pipe(
    map(project => {
      if (project.fase_actual_id >= requiredPhase) {
        return true; // El proyecto ya alcanzó o superó esta fase
      } else {
        // Redirigir al dashboard del proyecto
        dialogService.warning(
          'Acceso restringido: Aún no has completado las fases anteriores para acceder a esta pantalla.',
          'Fase No Desbloqueada'
        );
        return router.createUrlTree(['/framework/projects', projectId]);
      }
    }),
    catchError(() => {
      // En caso de error (ej. proyecto no existe), redirigir al listado de proyectos
      return of(router.createUrlTree(['/projects']));
    })
  );
};
