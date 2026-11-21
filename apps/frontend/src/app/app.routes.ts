import { Route } from '@angular/router';
import { CfpDashboardComponent } from './cfp-dashboard/cfp-dashboard';
import { CfpEventComponent } from './cfp-event/cfp-event';
import { CfpSubmissionComponent } from './cfp-submission/cfp-submission';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: CfpDashboardComponent,
    title: 'Dashboard',
  },
  {
    path: 'palestras/nova',
    component: CfpSubmissionComponent,
    title: 'Proponha sua palestra',
  },
  {
    path: 'eventos/novo',
    component: CfpEventComponent,
    title: 'Cadastre um evento',
  },
  // Legacy URL of the dashboard, kept for saved links.
  { path: 'dashboard', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
