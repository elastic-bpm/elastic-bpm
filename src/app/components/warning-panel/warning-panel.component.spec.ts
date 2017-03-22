import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningPanelComponent } from './warning-panel.component';

describe('WarningPanelComponent', () => {
  let component: WarningPanelComponent;
  let fixture: ComponentFixture<WarningPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WarningPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarningPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
