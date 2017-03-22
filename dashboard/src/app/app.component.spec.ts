import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TopNavLeftComponent } from './shared/top-nav-left/top-nav-left.component';
import { NavigationComponent } from './shared/navigation/navigation.component';
import { TopNavRightComponent } from './shared/top-nav-right/top-nav-right.component';
import { NavSidebarComponent } from './shared/nav-sidebar/nav-sidebar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TimelineComponent } from './pages/timeline/timeline.component';
import { ConsoleComponent } from './pages/console/console.component';
import { MachinesComponent } from './pages/machines/machines.component';
import { NodesComponent } from './pages/nodes/nodes.component';
import { WorkflowsComponent } from './pages/workflows/workflows.component';
import { WorkersComponent } from './pages/workers/workers.component';
import { HumansComponent } from './pages/humans/humans.component';
import { SchedulerComponent } from './pages/scheduler/scheduler.component';
import { DockerComponent } from './pages/docker/docker.component';

import { RouterTestingModule } from '@angular/router/testing';

import {APP_BASE_HREF} from '@angular/common';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        TopNavLeftComponent,
        NavigationComponent,
        TopNavRightComponent,
        NavSidebarComponent,
        DashboardComponent,
        TimelineComponent,
        ConsoleComponent,
        MachinesComponent,
        NodesComponent,
        WorkflowsComponent,
        WorkersComponent,
        HumansComponent,
        SchedulerComponent,
        DockerComponent
      ],
      imports: [
        RouterTestingModule
      ],
      providers: [{provide: APP_BASE_HREF, useValue: '/'}]
    });
    TestBed.compileComponents();
  });

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it('should render a router-outlet tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  }));
});
