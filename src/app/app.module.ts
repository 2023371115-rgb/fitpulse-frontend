import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { VirtualFolderComponent } from './virtual-folder/virtual-folder.component';
import { DevicePanelComponent } from './device-panel/device-panel.component';
import { DashboardViewComponent } from './dashboard-view/dashboard-view.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthInterceptor } from './auth.interceptor';
import { GoalsSessionsComponent } from './goals-sessions/goals-sessions.component';
import { TvDashboardComponent } from './tv-dashboard/tv-dashboard.component';
import { TermsModalComponent } from './terms-modal/terms-modal.component';


@NgModule({
  declarations: [
    AppComponent,
    VirtualFolderComponent,
    DevicePanelComponent,
    DashboardViewComponent,
    LoginComponent,
    GoalsSessionsComponent,
    ProfileComponent,
    TvDashboardComponent,
    TermsModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
