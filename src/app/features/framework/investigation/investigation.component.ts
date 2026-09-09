import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StepperComponent, Phase } from '../../../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-investigation',
  standalone: true,
  imports: [CommonModule, RouterModule, StepperComponent],
  templateUrl: './investigation.component.html',
  styleUrls: ['./investigation.component.scss']
})
export class InvestigationComponent {

  // Static Data for the view based on the mockup
  project = {
    title: 'Plataforma Educativa',
    status: 'Nuevo',
    type: 'Nuevo proyecto',
    client: 'Colegio San Martín'
  };

  phases: Phase[] = [
    { number: 1, name: 'Investigación', subtext: 'Entradas del proyecto', status: 'active' },
    { number: 2, name: 'Diseño Conceptual', subtext: 'Estructura y flujo', status: 'upcoming' },
    { number: 3, name: 'Diseño Visual', subtext: 'Estilo y componentes', status: 'upcoming' },
    { number: 4, name: 'Diseño Detallado', subtext: 'Prototipo de alta fidelidad', status: 'upcoming' },
    { number: 5, name: 'Evaluación Estética', subtext: 'Validación y ajustes', status: 'upcoming' }
  ];

  necesidad = `El colegio necesita una plataforma educativa que permita a los estudiantes acceder a sus cursos, tareas y recursos de manera fácil y segura. Actualmente, el proceso es manual y genera confusión, por lo que se busca una solución digital que mejore la experiencia de aprendizaje y la gestión académica.`;

  usuarios = [
    {
      name: 'Ana Torres',
      role: 'Estudiante',
      tag: 'Principal',
      photoUrl: 'https://i.pravatar.cc/150?img=47',
      needs: ['Acceso fácil a sus cursos', 'Ver tareas y calificaciones', 'Recibir notificaciones']
    },
    {
      name: 'María López',
      role: 'Docente',
      tag: 'Secundario',
      photoUrl: 'https://i.pravatar.cc/150?img=32',
      needs: ['Gestionar sus cursos', 'Registrar calificaciones', 'Comunicar con estudiantes']
    },
    {
      name: 'Carlos Rojas',
      role: 'Padre de familia',
      tag: 'Secundario',
      photoUrl: 'https://i.pravatar.cc/150?img=11',
      needs: ['Ver el progreso académico', 'Recibir reportes', 'Comunicación con docentes']
    }
  ];

  recursos = [
    {
      name: 'Manual de marca.pdf',
      size: '2.4 MB',
      type: 'pdf'
    },
    {
      name: 'Interfaz anterior.png',
      size: '1.8 MB',
      type: 'image'
    },
    {
      name: 'Referencias inspiración.zip',
      size: '4.2 MB',
      type: 'zip'
    }
  ];

}
