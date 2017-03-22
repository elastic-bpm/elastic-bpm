import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationComponent } from './navigation.component';
import { TopNavLeftComponent } from '../top-nav-left/top-nav-left.component';
import { TopNavRightComponent } from '../top-nav-right/top-nav-right.component';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';


describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TopNavLeftComponent,
        NavigationComponent,
        TopNavRightComponent,
        NavSidebarComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
