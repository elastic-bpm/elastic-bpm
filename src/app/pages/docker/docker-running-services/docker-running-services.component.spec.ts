import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockerRunningServicesComponent } from './docker-running-services.component';

describe('DockerRunningServicesComponent', () => {
  let component: DockerRunningServicesComponent;
  let fixture: ComponentFixture<DockerRunningServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockerRunningServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockerRunningServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
