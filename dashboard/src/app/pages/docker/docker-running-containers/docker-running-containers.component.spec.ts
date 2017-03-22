import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockerRunningContainersComponent } from './docker-running-containers.component';

describe('DockerRunningContainersComponent', () => {
  let component: DockerRunningContainersComponent;
  let fixture: ComponentFixture<DockerRunningContainersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockerRunningContainersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockerRunningContainersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
