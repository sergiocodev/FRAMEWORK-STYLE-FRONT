import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentHeuristicReviewComponent } from './assessment-heuristic-review.component';

describe('AssessmentHeuristicReviewComponent', () => {
  let component: AssessmentHeuristicReviewComponent;
  let fixture: ComponentFixture<AssessmentHeuristicReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentHeuristicReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentHeuristicReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
