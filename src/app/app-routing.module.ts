import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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

const appRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'timeline', component: TimelineComponent },
  { path: 'console', component:  ConsoleComponent},
  { path: 'docker', component:  DockerComponent},
  { path: 'machines', component:  MachinesComponent},
  { path: 'nodes', component:  NodesComponent},
  { path: 'workers', component:  WorkersComponent},
  { path: 'humans', component:  HumansComponent},
  { path: 'workflows', component:  WorkflowsComponent},
  { path: 'scheduler', component:  SchedulerComponent},
  { path: '',   redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
