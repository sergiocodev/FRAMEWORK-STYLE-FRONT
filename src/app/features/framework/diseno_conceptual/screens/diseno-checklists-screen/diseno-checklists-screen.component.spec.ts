import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisenoChecklistsScreenComponent } from './diseno-checklists-screen.component';

describe('DisenoChecklistsScreenComponent', () => {
  let component: DisenoChecklistsScreenComponent;
  let fixture: ComponentFixture<DisenoChecklistsScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisenoChecklistsScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisenoChecklistsScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
