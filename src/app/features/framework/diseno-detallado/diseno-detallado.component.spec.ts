import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisenoDetalladoComponent } from './diseno-detallado.component';

describe('DisenoDetalladoComponent', () => {
  let component: DisenoDetalladoComponent;
  let fixture: ComponentFixture<DisenoDetalladoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisenoDetalladoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisenoDetalladoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
