import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WcagApcaComponent } from './wcag-apca.component';

describe('WcagApcaComponent', () => {
  let component: WcagApcaComponent;
  let fixture: ComponentFixture<WcagApcaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WcagApcaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WcagApcaComponent);
    component = fixture.componentInstance;
    component.proyectoId = 1;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar filtros por defecto en "todos"', () => {
    expect(component.filtroNivel()).toBe('todos');
    expect(component.mostrarTodasLasCombinaciones()).toBeFalse();
  });

  it('debe formatear números Lc con signo correctamente', () => {
    expect(component.formatSignedLc(102.4)).toBe('+102.4');
    expect(component.formatSignedLc(-85.1)).toBe('-85.1');
  });
});

