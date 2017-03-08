import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

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
import { DockerRunningServicesComponent } from './pages/docker/docker-running-services/docker-running-services.component';
import { DockerRunningContainersComponent } from './pages/docker/docker-running-containers/docker-running-containers.component';
import { DockerInfoComponent } from './pages/docker/docker-info/docker-info.component';

import { BsPanelComponent } from './components/bs-panel/bs-panel.component';
import { WarningPanelComponent } from './components/warning-panel/warning-panel.component';

import { StatusService } from './services/status.service';
import { DockerService } from './services/docker.service';
import { MachineService } from './services/machine.service';
import { HumanService } from './services/human.service';
import { WorkflowService } from './services/workflow.service';
import { SchedulerService } from './services/scheduler.service';

import { AppRoutingModule } from './app-routing.module';

import {ModalModule} from 'ngx-modal';

@NgModule({
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
    DockerComponent,
    DockerRunningServicesComponent,
    DockerRunningContainersComponent,
    DockerInfoComponent,
    BsPanelComponent,
    WarningPanelComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    ModalModule
  ],
  providers: [
    StatusService,
    DockerService,
    MachineService,
    HumanService,
    WorkflowService,
    SchedulerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
