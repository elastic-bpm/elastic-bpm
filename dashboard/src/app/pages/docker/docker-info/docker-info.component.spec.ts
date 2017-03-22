import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockerInfoComponent } from './docker-info.component';

describe('DockerInfoComponent', () => {
  let component: DockerInfoComponent;
  let fixture: ComponentFixture<DockerInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockerInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockerInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
