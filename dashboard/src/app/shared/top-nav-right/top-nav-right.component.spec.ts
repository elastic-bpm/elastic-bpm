import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNavRightComponent } from './top-nav-right.component';

describe('TopNavRightComponent', () => {
  let component: TopNavRightComponent;
  let fixture: ComponentFixture<TopNavRightComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopNavRightComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
