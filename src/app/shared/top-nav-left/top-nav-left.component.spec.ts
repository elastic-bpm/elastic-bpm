import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNavLeftComponent } from './top-nav-left.component';

describe('TopNavLeftComponent', () => {
  let component: TopNavLeftComponent;
  let fixture: ComponentFixture<TopNavLeftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopNavLeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
