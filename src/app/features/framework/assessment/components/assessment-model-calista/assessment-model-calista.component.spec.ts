import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentModelCalistaComponent } from './assessment-model-calista.component';

describe('AssessmentModelCalistaComponent', () => {
  let component: AssessmentModelCalistaComponent;
  let fixture: ComponentFixture<AssessmentModelCalistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentModelCalistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentModelCalistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
