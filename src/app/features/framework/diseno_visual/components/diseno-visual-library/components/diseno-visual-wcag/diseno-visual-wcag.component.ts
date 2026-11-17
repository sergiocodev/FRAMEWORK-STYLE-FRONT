import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WcagStandardComponent } from './components/wcag-standard/wcag-standard.component';
import { WcagApcaComponent } from './components/wcag-apca/wcag-apca.component';

export type MetodoAccesibilidad = 'wcag21' | 'apca';

@Component({
  selector: 'app-diseno-visual-wcag',
  standalone: true,
  imports: [CommonModule, WcagStandardComponent, WcagApcaComponent],
  templateUrl: './diseno-visual-wcag.component.html',
  styleUrls: ['./diseno-visual-wcag.component.scss']
})
export class DisenoVisualWcagComponent {
  @Input({ required: true }) proyectoId!: number;

  metodoActivo = signal<MetodoAccesibilidad>('wcag21');
  mostrarGuiaMetodologica = signal<boolean>(false);

  setMetodo(metodo: MetodoAccesibilidad): void {
    this.metodoActivo.set(metodo);
  }

  toggleGuiaMetodologica(): void {
    this.mostrarGuiaMetodologica.update((v) => !v);
  }
}
