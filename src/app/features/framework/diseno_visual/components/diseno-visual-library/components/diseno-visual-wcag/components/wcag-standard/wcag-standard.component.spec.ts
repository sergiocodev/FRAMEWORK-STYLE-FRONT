import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WcagStandardComponent } from './wcag-standard.component';

describe('WcagStandardComponent', () => {
  let component: WcagStandardComponent;
  let fixture: ComponentFixture<WcagStandardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WcagStandardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WcagStandardComponent);
    component = fixture.componentInstance;
    component.proyectoId = 1;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar filtros por defecto en "todos"', () => {
    expect(component.filtroEstado()).toBe('todos');
    expect(component.mostrarTodasLasCombinaciones()).toBeFalse();
  });
});

