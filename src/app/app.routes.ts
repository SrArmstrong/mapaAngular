import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { DeliveryComponent } from './pages/delivery/delivery.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: 'admin', component: AdminComponent },
  { path: 'delivery', component: DeliveryComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

/*
export const routes: Routes = [
    { path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)        
    },
    { path: 'delivery',
        loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent)
    },
    { path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
*/