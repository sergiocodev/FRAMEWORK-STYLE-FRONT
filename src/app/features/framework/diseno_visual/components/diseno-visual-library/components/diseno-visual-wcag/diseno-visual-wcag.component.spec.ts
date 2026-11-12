import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DisenoVisualWcagComponent } from './diseno-visual-wcag.component';

describe('DisenoVisualWcagComponent', () => {
  let component: DisenoVisualWcagComponent;
  let fixture: ComponentFixture<DisenoVisualWcagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisenoVisualWcagComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DisenoVisualWcagComponent);
    component = fixture.componentInstance;
    component.proyectoId = 1;
    fixture.detectChanges();
  });

  it('debe crear el componente orquestador', () => {
    expect(component).toBeTruthy();
  });

  it('debe tener el método WCAG 2.1 activo por defecto', () => {
    expect(component.metodoActivo()).toBe('wcag21');
  });

  it('debe permitir cambiar al método APCA', () => {
    component.setMetodo('apca');
    expect(component.metodoActivo()).toBe('apca');
  });

  it('debe alternar la guía metodológica', () => {
    expect(component.mostrarGuiaMetodologica()).toBeFalse();
    component.toggleGuiaMetodologica();
    expect(component.mostrarGuiaMetodologica()).toBeTrue();
    component.toggleGuiaMetodologica();
    expect(component.mostrarGuiaMetodologica()).toBeFalse();
  });
});
