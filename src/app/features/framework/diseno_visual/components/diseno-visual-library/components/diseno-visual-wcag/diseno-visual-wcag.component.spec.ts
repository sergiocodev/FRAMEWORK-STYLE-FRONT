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

  it('debe renderizar el módulo estándar WCAG 2.1', () => {
    const standardEl = fixture.nativeElement.querySelector('app-wcag-standard');
    expect(standardEl).toBeTruthy();
  });
});
