import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BallDialog } from './ball-dialog';

describe('BallDialog', () => {
  let component: BallDialog;
  let fixture: ComponentFixture<BallDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BallDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BallDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
